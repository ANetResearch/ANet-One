import {
  MODEL_PROVIDER_FAMILY_SPECS,
  getModelProviderFamilySpec,
  type ModelProviderFamilySpec,
} from "@anet/shared";
import type { TuiSelection, TuiSubmitPrompt } from "@anet/tui";
import { getANetCopy } from "@anet/i18n";
import type { CommandCenterApp, CommandCenterLoginResult } from "./types.js";
import { randomUUID } from "node:crypto";

function fillLabel(template: string, label: string): string {
  return template.replaceAll("{label}", label);
}

/** 家族显示名;家族未注册时退回 id 本身,不编造名称。 */
export function resolveFamilyLabel(familyId: string): string {
  return getModelProviderFamilySpec(familyId)?.label ?? familyId;
}

/**
 * 登录选项按 `MODEL_PROVIDER_FAMILY_SPECS` 逐家族生成。注册表为空时列表为空,
 * 面板显示 `emptyMessage`;代价是不含任何家族的构建没有交互式登录入口。
 * `families` 参数供测试注入夹具家族。
 */
export function buildLoginSelection(
  locale?: string,
  families: readonly Pick<ModelProviderFamilySpec, "id" | "label">[] = MODEL_PROVIDER_FAMILY_SPECS,
): TuiSelection {
  const copy = getANetCopy(locale).tui.loginSetup;
  return {
    emptyMessage: copy.emptyMessage,
    filterable: false,
    help: copy.help,
    items: families.flatMap((spec) => {
      const label = spec.label;
      return [
        {
          command: `/login ${spec.id}-coding-plan`,
          id: `${spec.id}-coding-plan`,
          keywords: [spec.id, "oauth", "coding", "plan"],
          pending: {
            cancelStatus: copy.pending.cancelStatus,
            help: copy.pending.help,
            primary: fillLabel(copy.options.familyOauth.pendingPrimary, label),
            secondary: fillLabel(copy.options.familyOauth.pendingSecondary, label),
            status: copy.pending.status,
          },
          primary: fillLabel(copy.options.familyOauth.primary, label),
          secondary: fillLabel(copy.options.familyOauth.secondary, label),
        },
        {
          command: `/login ${spec.id}-coding-plan-api-key`,
          id: `${spec.id}-coding-plan-api-key`,
          input: {
            cancelStatus: copy.input.cancelStatus,
            clearStatus: copy.input.clearStatus,
            emptyStatus: copy.input.emptyStatus,
            help: copy.input.help,
            mask: true,
            placeholder: copy.input.placeholder,
            primary: fillLabel(copy.options.familyApiKey.inputPrimary, label),
            secondary: fillLabel(copy.options.familyApiKey.inputSecondary, label),
            status: copy.input.status,
            submitStatus: copy.input.submitStatus,
          },
          keywords: [spec.id, "api", "key", "manual"],
          primary: fillLabel(copy.options.familyApiKey.primary, label),
          secondary: fillLabel(copy.options.familyApiKey.secondary, label),
        },
      ];
    }),
    prompt: copy.prompt,
    title: copy.title,
  };
}

export function loginSetupResponse(locale?: string): string {
  return getANetCopy(locale).tui.loginSetup.response;
}

export function formatLoginResult(result: CommandCenterLoginResult): string {
  const label = result.user.name || result.user.email || result.user.user_id;
  const browserNote =
    result.browser && !result.browser.opened
      ? `\nBrowser open failed: ${result.browser.reason ?? "unknown error"}`
      : "";

  const plan = result.providerId
    ? `${resolveFamilyLabel(result.providerId)} Coding Plan`
    : "Coding Plan";
  return [
    `Configured ${plan} as ${label}.`,
    `Model: ${result.model}`,
    `Credentials: ${result.credentialsPath}`,
    `Model selection: ${result.configPath}${browserNote}`,
  ].join("\n");
}

export function formatProviderSetupResult(result: {
  configPath: string;
  model: string;
  providerId: string;
}): string {
  const provider = resolveFamilyLabel(result.providerId);
  return [
    `Configured ${provider} Coding Plan.`,
    `Model: ${result.model}`,
    `Model selection: ${result.configPath}`,
  ].join("\n");
}

export async function emitLoginAuthorizeMessage(
  options: Parameters<TuiSubmitPrompt>[1],
  authorizeUrl: string,
  providerName: string,
  session: Pick<CommandCenterApp, "sessionId" | "traceId">,
): Promise<void> {
  const onEvent = options.onEvent;
  if (!onEvent) return;

  await onEvent({
    id: `local-login-authorize-${randomUUID()}` as never,
    payload: {
      content: [
        `Open this URL to sign in with ${providerName}:`,
        "",
        authorizeUrl,
        "",
        "After authorization, return here and I will finish the login automatically.",
      ].join("\n"),
    },
    sequenceNumber: 0,
    sessionId: session.sessionId as never,
    timestamp: new Date(),
    traceId: session.traceId as never,
    type: "assistant_message" as never,
  });
}

export function parseOauthLoginArgs(args: string): { providerId: string } | null {
  const familyId = resolveFamilyIdFromKind(args.trim(), "-coding-plan");
  return familyId ? { providerId: familyId } : null;
}

export function parseApiKeyLoginArgs(args: string): {
  apiKey: string;
  kind: string;
  providerId: string;
} | null {
  const [kind = "", ...rest] = args.split(/\s+/u);
  const familyId = resolveFamilyIdFromKind(kind, "-coding-plan-api-key");
  if (!familyId) return null;
  return {
    apiKey: rest.join(" ").trim(),
    kind,
    providerId: familyId,
  };
}

/**
 * 只做形式解析,不查注册表:家族是否已注册由 bootstrap 的 loginANetCli /
 * configureCodingPlanApiKey 判定,避免命令解析层和注册表各维护一份"有效家族"集合。
 */
function resolveFamilyIdFromKind(kind: string, suffix: string): string | null {
  if (!kind.endsWith(suffix)) return null;
  const familyId = kind.slice(0, -suffix.length);
  return familyId.length > 0 ? familyId : null;
}
