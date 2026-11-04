import type { ANetEnv } from "./env.js";

// 本分发不内置任何产品服务端地址。
//
// 上游把自有域名写死在这些常量里。后果是:远程控制中转、会话分享、客户端配置下发、
// 事件上报、套餐与 OAuth 在用户未做任何配置时就会连到上游服务端,会话内容、屏幕内容
// 和账号信息随之经过该服务端。
//
// 改为空字符串表示"未配置"。未配置时相关功能不发起任何网络请求,也不回落到任何
// 默认域名;要自建服务端,通过 ANET_BASE_URL / ANET_ENDPOINT_ORIGIN 指定。
// 账号与套餐相关的端点随厂商 provider 一并移除,不再有对应的环境变量。
//
// 代价:这些功能在缺省分发里不可用,而不是指向一个能用但不是我们的服务端。对交付给
// 客户的分发来说,"不可用"是可接受的,"默默连到第三方"不是。
export const UNCONFIGURED_ENDPOINT_ORIGIN = "";
export const DEFAULT_ANET_ENDPOINT_ORIGIN = UNCONFIGURED_ENDPOINT_ORIGIN;
export const TEST_ANET_ENDPOINT_ORIGIN = UNCONFIGURED_ENDPOINT_ORIGIN;
export const CODING_PLAN_LOCAL_WEBVIEW_ORIGIN = "http://localhost:3000";
export const DEFAULT_WEB_REMOTE_CONTROL_RELAY_WS_URL = "";
export const WEB_REMOTE_CONTROL_V4_MIN_APP_VERSION = "3.4.0";

/**
 * 空字符串即未配置。用它判断,而不是在各处重复写 `=== ""`。
 *
 * 写成类型谓词而不是 boolean:调用方几乎都是
 * `if (!isEndpointConfigured(x)) return ""; useAsString(x)`,
 * 返回 boolean 时 x 在后半段仍是 `string | undefined`,编译不过。
 */
export function isEndpointConfigured(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * 未配置服务端却要求一个具体 URL 时抛出。错误里带上该功能名和应设置的环境变量,
 * 否则调用方只会看到一个 `Invalid URL`,看不出是缺配置还是地址写错。
 */
export function requireConfiguredEndpoint(value: string, featureName: string): string {
  if (!isEndpointConfigured(value)) {
    throw new Error(
      `${featureName} requires a product service endpoint; set ANET_BASE_URL (or ANET_ENDPOINT_ORIGIN) to your own server. This build ships no default endpoint.`,
    );
  }
  return value;
}

export interface BuildANetEndpointUrlsOptions {
  appVersion?: string;
}

function isWebRemoteControlV4AppVersion(appVersion: string | undefined): boolean {
  if (!appVersion) {
    return false;
  }

  // anetEndpoint 会被 Vite 配置在 Node 加载期直接导入，不能依赖源码态 `.js` runtime import。
  // 这里只比较固定的稳定版门槛；高于 3.4.0 的预发布版本仍满足门槛，3.4.0 自身的预发布版本不满足。
  const normalizedVersion = appVersion.trim().replace(/^v/i, "");
  const match = normalizedVersion.match(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([^+]+))?(?:\+(.+))?$/,
  );
  if (!match) {
    return false;
  }

  const prereleaseIdentifiers = match[4]?.split(".");
  const hasValidPrerelease =
    prereleaseIdentifiers === undefined ||
    prereleaseIdentifiers.every(
      (identifier) =>
        /^[0-9A-Za-z-]+$/.test(identifier) &&
        (!/^\d+$/.test(identifier) || /^(0|[1-9]\d*)$/.test(identifier)),
    );
  const buildIdentifiers = match[5]?.split(".");
  const hasValidBuild =
    buildIdentifiers === undefined ||
    buildIdentifiers.every((identifier) => /^[0-9A-Za-z-]+$/.test(identifier));
  if (!hasValidPrerelease || !hasValidBuild) {
    return false;
  }

  const versionParts = [Number(match[1]), Number(match[2]), Number(match[3])];
  const floorParts = WEB_REMOTE_CONTROL_V4_MIN_APP_VERSION.split(".").map(Number);
  for (let index = 0; index < floorParts.length; index += 1) {
    if (versionParts[index]! !== floorParts[index]!) {
      return versionParts[index]! > floorParts[index]!;
    }
  }

  return prereleaseIdentifiers === undefined;
}

export interface ANetEndpointUrls {
  origin: string;
  apiBaseUrl: string;
  remoteUrl: string;
  webRemoteCallbackUrl: string;
  webShareCallbackUrl: string;
  relayWsUrl: string;
  anetPlanOpenAiBaseUrl: string;
  anetPlanAnthropicBaseUrl: string;
  anetPlanBillingCurrentUrl: string;
  anetPlanBillingBalanceUrl: string;
}

export interface RuntimeANetEndpointEnv {
  [key: string]: string | undefined;
  ANET_ENV?: string;
  ANET_BASE_URL?: string;
  ANET_ENDPOINT_ORIGIN?: string;
  ANET_TEST_BASE_URL?: string;
  ANET_PRODUCTION_BASE_URL?: string;
}

export interface RuntimeProductEndpointEnv extends RuntimeANetEndpointEnv {}

export interface RuntimeProductEndpointConfig {
  anetEnv: ANetEnv;
  anetEndpointOrigin: string;
  anetEndpointUrls: ANetEndpointUrls;
}

function readRuntimeEnvValue(
  env: Record<string, string | undefined>,
  key: string,
): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

function readRuntimeANetEnvScopedValue(
  env: Record<string, string | undefined>,
  anetEnv: ANetEnv,
  testKey: string,
  productionKey: string,
): string | undefined {
  return readRuntimeEnvValue(env, anetEnv === "production" ? productionKey : testKey);
}

export function normalizeANetEndpointOrigin(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("ANet endpoint origin is empty");
  }

  const parsed = new URL(trimmed);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("ANet endpoint origin must use http or https");
  }
  return parsed.origin;
}

function isLoopbackHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function isTrustedCodingPlanWebviewOrigin(
  value: string | null | undefined,
  options?: {
    e2eStoreBridgeEnabled?: boolean;
  },
): boolean {
  if (!value) return false;
  try {
    const origin = normalizeANetEndpointOrigin(value);
    // 未配置的服务端常量是空串,不能参与"是否可信"的比较:否则任何 origin 都会被
    // 拿去和空串比,一旦某处把空串也 normalize 过就会放行。只比对已配置的那些。
    const trustedOrigins = [
      DEFAULT_ANET_ENDPOINT_ORIGIN,
      TEST_ANET_ENDPOINT_ORIGIN,
      CODING_PLAN_LOCAL_WEBVIEW_ORIGIN,
    ].filter(isEndpointConfigured);
    if (trustedOrigins.includes(origin)) {
      return true;
    }
    const parsed = new URL(origin);
    return options?.e2eStoreBridgeEnabled === true && isLoopbackHostname(parsed.hostname);
  } catch {
    return false;
  }
}

export function resolveANetEndpointOrigin(options?: {
  env?: ANetEnv;
  envBaseOrigin?: string | null;
  overrideOrigin?: string | null;
}): string {
  const env = options?.env ?? "test";
  const envBaseOrigin = options?.envBaseOrigin?.trim();
  if (env === "production") {
    return envBaseOrigin
      ? normalizeANetEndpointOrigin(envBaseOrigin)
      : UNCONFIGURED_ENDPOINT_ORIGIN;
  }

  const overrideOrigin = options?.overrideOrigin?.trim();
  if (overrideOrigin) {
    return normalizeANetEndpointOrigin(overrideOrigin);
  }

  return envBaseOrigin ? normalizeANetEndpointOrigin(envBaseOrigin) : UNCONFIGURED_ENDPOINT_ORIGIN;
}

export function resolveRuntimeANetEnv(env: RuntimeANetEndpointEnv = {}): ANetEnv {
  // 独立 CLI / 服务测试未注入 ANET_ENV 时默认生产域；桌面测试包会显式下发 ANET_ENV=test。
  return env.ANET_ENV?.trim().toLowerCase() === "test" ? "test" : "production";
}

export function resolveRuntimeANetEndpointOrigin(
  env: RuntimeANetEndpointEnv = {},
  options?: { overrideOrigin?: string | null },
): string {
  const anetEnv = resolveRuntimeANetEnv(env);
  const scopedBaseOrigin =
    anetEnv === "production"
      ? readRuntimeEnvValue(env, "ANET_PRODUCTION_BASE_URL")
      : readRuntimeEnvValue(env, "ANET_TEST_BASE_URL");

  return resolveANetEndpointOrigin({
    env: anetEnv,
    envBaseOrigin:
      readRuntimeEnvValue(env, "ANET_BASE_URL") ??
      readRuntimeEnvValue(env, "ANET_ENDPOINT_ORIGIN") ??
      scopedBaseOrigin,
    overrideOrigin: options?.overrideOrigin,
  });
}

export function buildRuntimeANetEndpointUrls(env: RuntimeANetEndpointEnv = {}): ANetEndpointUrls {
  return buildANetEndpointUrls(resolveRuntimeANetEndpointOrigin(env));
}

export function buildRuntimeANetApiUrl(env: RuntimeANetEndpointEnv = {}, path: string): string {
  const origin = resolveRuntimeANetEndpointOrigin(env);
  if (!isEndpointConfigured(origin)) {
    // 回落到相对路径会让请求打到当前页面所在的站点,看起来"成功"却是错的目标。
    return "";
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}

export function resolveWebRemoteControlRelayWsUrl(options?: {
  endpointOrigin?: string | null | undefined;
  overrideUrl?: string | null | undefined;
}): string {
  const overrideUrl = options?.overrideUrl?.trim();
  if (overrideUrl) {
    return overrideUrl;
  }

  const endpointOrigin = options?.endpointOrigin?.trim() || DEFAULT_ANET_ENDPOINT_ORIGIN;
  if (!isEndpointConfigured(endpointOrigin)) {
    // 远程控制中转没有默认服务端。返回空串,由调用方据此停用远程控制,而不是连到第三方。
    return "";
  }
  const origin = new URL(normalizeANetEndpointOrigin(endpointOrigin));
  origin.protocol = origin.protocol === "https:" ? "wss:" : "ws:";
  origin.pathname = "/api/v1/remote/ws2";
  return origin.toString();
}

export function resolveRuntimeProductEndpointConfig(
  env: RuntimeProductEndpointEnv = {},
): RuntimeProductEndpointConfig {
  const anetEnv = resolveRuntimeANetEnv(env);
  const anetEndpointOrigin = resolveRuntimeANetEndpointOrigin(env);

  return {
    anetEnv,
    anetEndpointOrigin,
    anetEndpointUrls: buildANetEndpointUrls(anetEndpointOrigin),
  };
}

export function buildANetEndpointUrls(
  origin: string,
  options: BuildANetEndpointUrlsOptions = {},
): ANetEndpointUrls {
  if (!isEndpointConfigured(origin)) {
    // 这个函数在若干模块的顶层/字段初始化期被调用,未配置时抛错会让整个进程起不来。
    // 返回全空字段:需要具体 URL 的调用方自行判断为空并停用对应功能。
    return {
      origin: "",
      apiBaseUrl: "",
      remoteUrl: "",
      webRemoteCallbackUrl: "",
      webShareCallbackUrl: "",
      relayWsUrl: "",
      anetPlanOpenAiBaseUrl: "",
      anetPlanAnthropicBaseUrl: "",
      anetPlanBillingCurrentUrl: "",
      anetPlanBillingBalanceUrl: "",
    };
  }

  const normalizedOrigin = normalizeANetEndpointOrigin(origin);
  const parsed = new URL(normalizedOrigin);
  const wsProtocol = parsed.protocol === "https:" ? "wss:" : "ws:";
  const wsOrigin = `${wsProtocol}//${parsed.host}`;
  // 无法解析或低于分界版本时保守使用 v3，避免开发版本和旧客户端进入未兼容的 v4 页面。
  const remoteVersion = isWebRemoteControlV4AppVersion(options.appVersion) ? "v4" : "v3";

  return {
    origin: normalizedOrigin,
    apiBaseUrl: `${normalizedOrigin}/api/v1`,
    remoteUrl: `${normalizedOrigin}/remote/${remoteVersion}`,
    webRemoteCallbackUrl: `${normalizedOrigin}/remote/v4`,
    webShareCallbackUrl: `${normalizedOrigin}/cn/share/callback`,
    relayWsUrl: `${wsOrigin}/api/v1/remote/ws2`,
    anetPlanOpenAiBaseUrl: `${normalizedOrigin}/api/v1/anet-plan`,
    anetPlanAnthropicBaseUrl: `${normalizedOrigin}/api/v1/anet-plan/anthropic`,
    anetPlanBillingCurrentUrl: `${normalizedOrigin}/api/v1/anet-plan/billing/current`,
    anetPlanBillingBalanceUrl: `${normalizedOrigin}/api/v1/anet-plan/billing/balance`,
  };
}

export function rewriteANetEndpointUrl(input: string | URL, endpointOrigin: string): string | URL {
  const originalUrl = typeof input === "string" ? input : input.toString();
  let parsed: URL;
  try {
    parsed = new URL(originalUrl);
  } catch {
    return input;
  }
  const sourceOrigin = DEFAULT_ANET_ENDPOINT_ORIGIN;
  if (!isEndpointConfigured(sourceOrigin)) {
    // 本分发没有内置来源 origin,没有需要改写的既有 URL。
    return input;
  }
  if (parsed.origin !== sourceOrigin) {
    return input;
  }

  const targetOrigin = normalizeANetEndpointOrigin(endpointOrigin);
  if (targetOrigin === sourceOrigin) {
    return input;
  }

  const target = new URL(targetOrigin);
  target.pathname = parsed.pathname;
  target.search = parsed.search;
  target.hash = parsed.hash;
  return target.toString();
}
