import type { OAuthTokenSet, UserInfo } from "@anet/shared";
import type { WebOAuthProviderId } from "./browserOAuthCredentialRepo.js";

export interface WebOAuthCallbackParams {
  code?: string;
  error?: string;
  state: string;
}

export interface WebOAuthTokenExchangeResult {
  tokenSet: OAuthTokenSet;
  userInfo: UserInfo;
  rawUserInfo: unknown;
}

/** 浏览器端 OAuth provider 的抽象。具体 provider 由发行方在构建时提供，本仓不内置任何一家。 */
export interface WebOAuthProvider {
  buildAuthorizeUrl(params: {
    state: string;
    redirectUri?: string;
    provider?: WebOAuthProviderId;
  }): string;
  parseCallbackParams(url: string): WebOAuthCallbackParams;
  exchangeToken(params: {
    code: string;
    state: string;
    redirectUri?: string;
    provider?: WebOAuthProviderId;
  }): Promise<WebOAuthTokenExchangeResult>;
}

/**
 * 当前构建可用的登录 provider id。未接入任何 provider 时为空，登录页据此显示“不可用”，
 * 而不是渲染一个点了必然失败的按钮。
 */
export const WEB_OAUTH_PROVIDERS: readonly WebOAuthProviderId[] = [];

export function parseWebOAuthCallbackParams(url: string): WebOAuthCallbackParams {
  const parsed = new URL(url);
  const state = parsed.searchParams.get("state")?.trim();
  if (!state) {
    throw new Error("OAuth callback missing state");
  }
  const code = parsed.searchParams.get("code") ?? parsed.searchParams.get("authCode");
  const error = parsed.searchParams.get("error");
  return {
    state,
    ...(code ? { code } : {}),
    ...(error ? { error } : {}),
  };
}

/**
 * 未接入 provider 时的默认实现：回调参数仍可解析（供 dev return_to 转发使用），
 * 但发起授权与换 token 一律抛错，调用方得到明确的“不可用”而不是伪造的登录流程。
 */
export class UnavailableWebOAuthProvider implements WebOAuthProvider {
  buildAuthorizeUrl(): string {
    throw new Error("No OAuth provider is configured in this build");
  }

  parseCallbackParams(url: string): WebOAuthCallbackParams {
    return parseWebOAuthCallbackParams(url);
  }

  async exchangeToken(): Promise<WebOAuthTokenExchangeResult> {
    throw new Error("No OAuth provider is configured in this build");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeBackendAvatarUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^data:image\/[^;]+;base64,/i.test(trimmed) || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed) && trimmed.length >= 16) {
    return `data:image/png;base64,${trimmed}`;
  }
  return trimmed;
}

/** 把缓存或后端返回的用户资料归一化为 UserInfo；缺少可识别身份时返回 null。 */
export function toUserInfo(user: unknown): UserInfo | null {
  if (!isRecord(user)) return null;

  if (
    typeof user.id === "string" &&
    typeof user.username === "string" &&
    typeof user.displayName === "string"
  ) {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      ...(typeof user.avatarUrl === "string" ? { avatarUrl: user.avatarUrl } : {}),
    };
  }

  const id = typeof user.user_id === "string" ? user.user_id : "unknown";
  const name = typeof user.name === "string" ? user.name.trim() : "";
  const email = typeof user.email === "string" ? user.email.trim() : "";
  const username = name || email || id;
  if (!name && !email && id === "unknown") return null;

  const avatarUrl = normalizeBackendAvatarUrl(user.avatar);
  return {
    id,
    username,
    displayName: username,
    ...(avatarUrl ? { avatarUrl } : {}),
  };
}
