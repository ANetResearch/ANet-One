import { PROVIDER_FAMILY_SPECS } from "@/lib/modelProviderFamilies.js";
import {
  DEFAULT_ANET_ENDPOINT_ORIGIN,
  isTrustedCodingPlanWebviewOrigin,
  normalizeANetEndpointOrigin,
  resolveModelProviderFamilyIdByProviderId,
  type ANetEnv,
  ANET_ENV,
  type ProviderFamilyDomain,
} from "@anet/shared";
import type { CodingPlanWebviewLocale } from "@anet/shared";
import type { CodingPlanFunnelContext } from "@/lib/codingPlanFunnelTelemetry.js";
import type { CodingPlanProviderId } from "@/settings/model-provider-section/constants.js";

export type CodingPlanWebsiteProvider = ProviderFamilyDomain;
export type CodingPlanPurchaseAudience = "personal" | "team";

export interface CodingPlanEmbeddedCredentials {
  /** 当前 family 的 OAuth access token；写入对应 family 的 localStorage key。 */
  accessToken?: string | null;
  anetJwtToken?: string | null;
}

export interface CodingPlanEmbeddedReportContext {
  purchase_funnel_id?: string;
  purchase_entry_reporter?: "app";
  upgrade_source?: string;
  event_region?: string;
  event_text?: string;
  entry_plan_status?: string;
  entry_plan_level?: string;
  entry_plan_list?: string;
  purchase_audience?: string;
  provider_family?: string;
  channel?: string;
  device_mid?: string;
  user_id?: string;
  app_version?: string;
}

export type CodingPlanEmbeddedTheme = "anet-light" | "anet-dark";

/**
 * App locale（zh-CN / en-US）→ 官网 URL lang 段（cn / en）。
 * 用于 webview URL 的 ?lang= hint，让官网首屏就有正确语言，避免注入前的英文闪烁。
 */
export function codingPlanLocaleToWebsiteLang(
  locale: CodingPlanWebviewLocale | null | undefined,
): "cn" | "en" {
  return locale === "zh-CN" ? "cn" : "en";
}

export interface ResolveCodingPlanEmbeddedOriginOptions {
  dev: boolean;
  endpointOrigin: string;
  e2eStoreBridgeEnabled?: boolean;
  overrideOrigin?: string | null;
  anetEnv?: ANetEnv;
}

export const CODING_PLAN_WEBVIEW_OVERRIDE_ENV_KEY = "VITE_CODING_PLAN_WEBVIEW_ORIGIN";
const ANET_JWT_LOCAL_STORAGE_KEY = "anetjwttoken";
const CODING_PLAN_WEBVIEW_CREDENTIAL_LOCAL_STORAGE_KEYS: readonly string[] = [
  ...PROVIDER_FAMILY_SPECS.map((spec) => `oauth:${spec.oauthProviderId}:access_token`),
  ANET_JWT_LOCAL_STORAGE_KEY,
];
const CODING_PLAN_REPORT_CONTEXT_STORAGE_KEY = "anet:coding-plan:report-context";

/** 返回 providerId 所属的 family；不属于任何已注册 family 时返回 null，调用方不应打开购买页。 */
export function resolveCodingPlanWebsiteProvider(
  providerId: CodingPlanProviderId,
): CodingPlanWebsiteProvider | null {
  return resolveModelProviderFamilyIdByProviderId(providerId);
}

export function resolveCodingPlanEmbeddedOrigin({
  dev,
  endpointOrigin,
  e2eStoreBridgeEnabled,
  overrideOrigin,
  anetEnv = ANET_ENV,
}: ResolveCodingPlanEmbeddedOriginOptions): string {
  const normalizedOverride = overrideOrigin?.trim();
  if (
    normalizedOverride &&
    isTrustedCodingPlanWebviewOrigin(normalizedOverride, { e2eStoreBridgeEnabled })
  ) {
    return normalizeANetEndpointOrigin(normalizedOverride);
  }
  // Bug 原因：本地开发默认注入 ANET_ENV=production，不能仅凭 Vite DEV 就打开未启动的官网本地页。
  if (dev && anetEnv === "test") {
    return "http://localhost:3000";
  }
  const normalizedEndpointOrigin = normalizeANetEndpointOrigin(endpointOrigin);
  return isTrustedCodingPlanWebviewOrigin(normalizedEndpointOrigin, { e2eStoreBridgeEnabled })
    ? normalizedEndpointOrigin
    : DEFAULT_ANET_ENDPOINT_ORIGIN;
}

export function buildCodingPlanEmbeddedWebviewUrl({
  origin,
  provider,
  locale,
  theme,
  audience,
  teamPlanKey,
}: {
  origin: string;
  provider: CodingPlanWebsiteProvider;
  // 传入 App 当前 locale，作为官网首屏语言 hint（?lang=cn|en），避免注入前的英文闪烁。
  locale?: CodingPlanWebviewLocale | null;
  // 官网 SSR 默认 dark；首次打开 WebView 时 localStorage 还没有主题，
  // 必须把 App 当前主题同步放进 URL，让官网 head 脚本在首帧 paint 前读到。
  theme?: CodingPlanEmbeddedTheme | null;
  audience?: CodingPlanPurchaseAudience;
  teamPlanKey?: string | null;
}): string {
  const url = new URL("/coding-plan", normalizeANetEndpointOrigin(origin));
  url.searchParams.set("provider", provider);
  url.searchParams.set("embedded", "app");
  url.searchParams.set("lang", codingPlanLocaleToWebsiteLang(locale));
  if (audience) {
    url.searchParams.set("audience", audience);
  }
  if (teamPlanKey?.trim()) {
    url.searchParams.set("teamPlanKey", teamPlanKey.trim());
  }
  if (theme) {
    url.searchParams.set("theme", theme);
  }
  return url.toString();
}

export function isTrustedCodingPlanEmbeddedWebviewUrl(
  value: string | null | undefined,
  options?: {
    e2eStoreBridgeEnabled?: boolean;
  },
): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (
      !isTrustedCodingPlanWebviewOrigin(url.origin, {
        e2eStoreBridgeEnabled: options?.e2eStoreBridgeEnabled,
      })
    ) {
      return false;
    }
    if (!url.pathname.includes("coding-plan")) return false;
    if (url.searchParams.get("embedded") === "app") return true;
    // PayPal 成功后先回到 /coding-plan/payment/callback，embedded=app
    // 在 returnTo 里。该页仍需要 App 注入 OAuth token 完成 subscribe，不能被当作外站清理凭据。
    if (!url.pathname.endsWith("/coding-plan/payment/callback")) return false;
    const returnTo = url.searchParams.get("returnTo");
    if (!returnTo) return false;
    const target = new URL(returnTo, url.origin);
    return (
      target.origin === url.origin &&
      target.pathname.includes("coding-plan") &&
      target.searchParams.get("embedded") === "app" &&
      !target.pathname.endsWith("/coding-plan/payment/callback")
    );
  } catch {
    return false;
  }
}

export function createCodingPlanAuthInjectionScript({
  provider,
  credentials,
  theme,
  locale,
  reportContext,
}: {
  provider: CodingPlanWebsiteProvider;
  credentials: CodingPlanEmbeddedCredentials;
  theme: CodingPlanEmbeddedTheme;
  // App 当前 locale，写入 window.__anetLang__ 供 anetBridge.getLang() 读取，
  // 并附带在 auth-ready 事件 detail 里让官网一次性同步初始语言。
  locale: CodingPlanWebviewLocale | null;
  reportContext?: CodingPlanEmbeddedReportContext | null;
}): string {
  // 只写入当前 family 的 access token，其他 family 的 key 置空，避免跨 family 凭据残留。
  // anetjwttoken 是 anet-plan 域通用凭证，官网用它查 billing/balance 判定 Start Plan 是否使用中；
  // 缺失注入会让官网 Start Plan 卡因查不到权益而误显示「已过期」。
  const values: Record<string, string | null> = {
    [ANET_JWT_LOCAL_STORAGE_KEY]: credentials.anetJwtToken?.trim() || null,
  };
  for (const spec of PROVIDER_FAMILY_SPECS) {
    values[`oauth:${spec.oauthProviderId}:access_token`] =
      spec.id === provider ? credentials.accessToken?.trim() || null : null;
  }
  const storageUpdates = Object.entries(values)
    .map(([key, value]) =>
      value
        ? `localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});`
        : `localStorage.removeItem(${JSON.stringify(key)});`,
    )
    .join("\n  ");
  const resolvedLocale: CodingPlanWebviewLocale = locale === "zh-CN" ? "zh-CN" : "en-US";
  const normalizedReportContext = normalizeCodingPlanEmbeddedReportContext(reportContext);

  return `(() => {
  ${storageUpdates}
  const anetTheme = ${JSON.stringify(theme)};
  document.documentElement.classList.toggle("dark", anetTheme === "anet-dark");
  document.documentElement.classList.toggle("theme-anet-light", anetTheme === "anet-light");
  document.documentElement.classList.toggle("theme-anet-dark", anetTheme === "anet-dark");
  localStorage.setItem("anet-theme", anetTheme);
  localStorage.setItem("anet:coding-plan:embedded", "app");
  // 写入当前 App locale，供官网 anetBridge.getLang() 读取。
  // 注意：这是注入 webview 执行的原始 JS，不能用 TS 语法（如 as any）。
  window.__anetLang__ = ${JSON.stringify(resolvedLocale)};
  const anetReportContext = ${JSON.stringify(normalizedReportContext)};
  window.__anetReportContext__ = anetReportContext;
  localStorage.setItem(${JSON.stringify(CODING_PLAN_REPORT_CONTEXT_STORAGE_KEY)}, JSON.stringify(anetReportContext));
  window.dispatchEvent(new CustomEvent("anet-coding-plan-auth-ready", {
    detail: { ...${JSON.stringify({ provider, locale: resolvedLocale })}, reportContext: anetReportContext },
  }));
})()`;
}

export function buildCodingPlanEmbeddedReportContext({
  funnelContext,
  deviceMid,
  userId,
  appVersion,
}: {
  funnelContext?: CodingPlanFunnelContext | null;
  deviceMid?: string | null;
  userId?: string | null;
  appVersion?: string | null;
}): CodingPlanEmbeddedReportContext {
  return normalizeCodingPlanEmbeddedReportContext({
    purchase_funnel_id: funnelContext?.purchaseFunnelId,
    // 缺少归属标记会让兼容官网重复上报入口；无漏斗时不能声明 App 已接管。
    purchase_entry_reporter: funnelContext ? "app" : undefined,
    upgrade_source: funnelContext?.upgradeSource,
    event_region: funnelContext?.eventRegion,
    event_text: funnelContext?.eventText,
    entry_plan_status: funnelContext?.entryPlanStatus,
    entry_plan_level: funnelContext?.entryPlanLevel,
    entry_plan_list: funnelContext?.entryPlanList,
    purchase_audience: funnelContext?.purchaseAudience,
    provider_family: funnelContext?.providerFamily,
    channel: funnelContext?.channel,
    device_mid: deviceMid ?? undefined,
    user_id: userId ?? undefined,
    app_version: appVersion ?? undefined,
  });
}

function normalizeCodingPlanEmbeddedReportContext(
  context: CodingPlanEmbeddedReportContext | null | undefined,
): CodingPlanEmbeddedReportContext {
  if (!context) return {};
  return Object.fromEntries(
    Object.entries(context).flatMap(([key, value]) => {
      if (typeof value !== "string") return [];
      const normalized = value.trim();
      return normalized ? [[key, normalized]] : [];
    }),
  ) as CodingPlanEmbeddedReportContext;
}

export function createCodingPlanCredentialClearScript(): string {
  const keys = [...CODING_PLAN_WEBVIEW_CREDENTIAL_LOCAL_STORAGE_KEYS];
  return `(() => {
  for (const key of ${JSON.stringify(keys)}) {
    localStorage.removeItem(key);
  }
  localStorage.removeItem(${JSON.stringify(CODING_PLAN_REPORT_CONTEXT_STORAGE_KEY)});
  delete window.__anetReportContext__;
})()`;
}

export function createCodingPlanScrollbarHideScript(): string {
  return `(() => {
  const styleId = "anet-coding-plan-hide-scrollbar";
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = \`
html,
body,
* {
  scrollbar-width: none !important;
}

html::-webkit-scrollbar,
body::-webkit-scrollbar,
*::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}
\`;
  document.head.appendChild(style);
})()`;
}

/**
 * 生成「更新 webview 当前 locale」的注入脚本。
 * App locale 运行时变化时对 webview executeJavaScript 此脚本：
 * 重写 window.__anetLang__ 并派发 anet-coding-plan-lang-change 事件，
 * 官网侧（anetBridge.onLangChange 或 window 监听）据此无感切换语言。
 */
export function createCodingPlanLangInjectionScript(locale: CodingPlanWebviewLocale): string {
  const resolvedLocale: CodingPlanWebviewLocale = locale === "zh-CN" ? "zh-CN" : "en-US";
  return `(() => {
  // 注意：注入 webview 执行的原始 JS，不能用 TS 语法（如 as any）。
  window.__anetLang__ = ${JSON.stringify(resolvedLocale)};
  window.dispatchEvent(new CustomEvent("anet-coding-plan-lang-change", {
    detail: ${JSON.stringify({ locale: resolvedLocale })},
  }));
})()`;
}

export function getCodingPlanCredentialKeys(provider: CodingPlanWebsiteProvider): string[] {
  // anetjwttoken 对所有 family 都加载：它是 anet-plan 域通用凭证。
  const spec = PROVIDER_FAMILY_SPECS.find((item) => item.id === provider);
  return spec
    ? [`oauth:${spec.oauthProviderId}:access_token`, ANET_JWT_LOCAL_STORAGE_KEY]
    : [ANET_JWT_LOCAL_STORAGE_KEY];
}
