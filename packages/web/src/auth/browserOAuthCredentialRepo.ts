import {
  type OAuthProviderId,
  type OAuthTokenSet,
  type OAuthCachedSessionRestoreResult,
  type UserInfo,
  resolveJwtExpiration,
} from "@anet/shared";
import { toUserInfo } from "./webOAuthProvider.js";

const ACTIVE_PROVIDER_KEY = "oauth:active_provider";
const ANET_JWT_TOKEN_KEY = "anetjwttoken";
const OAUTH_PENDING_LOGINS_KEY = "oauth_pending_logins";
// 同一浏览器多个标签页可以同时发起登录；只留最近几条，放弃的登录不会无限累积。
const MAX_PENDING_LOGINS = 5;

/** 登录 provider id。本仓不内置任何 provider，取值由接入的 provider 决定。 */
export type WebOAuthProviderId = string;

export function isWebOAuthProviderId(value: unknown): value is WebOAuthProviderId {
  return typeof value === "string" && value.trim().length > 0;
}

/** 按 provider 分段的凭据 key。格式沿用既有 `oauth:<provider>:*`，已登录用户的缓存不会因改名失效。 */
const PROVIDER_KEY_PATTERN = /^oauth:[^:]+:(access_token|user_info)$/;

function providerKeys(provider: WebOAuthProviderId): { accessToken: string; userInfo: string } {
  return {
    accessToken: `oauth:${provider}:access_token`,
    userInfo: `oauth:${provider}:user_info`,
  };
}

interface BrowserOAuthCredentialRepoStorage {
  localStorage: Storage;
}

/** 一次跳出去的登录：回调页靠它校验 state，并用同一 provider 与回调地址换 token。 */
export interface PendingOAuthLogin {
  nonce: string;
  provider: WebOAuthProviderId;
  redirectUri: string;
}

function isPendingOAuthLogin(value: unknown): value is PendingOAuthLogin {
  if (!value || typeof value !== "object") return false;
  const login = value as Partial<Record<keyof PendingOAuthLogin, unknown>>;
  return (
    typeof login.nonce === "string" &&
    hasText(login.nonce) &&
    isWebOAuthProviderId(login.provider) &&
    typeof login.redirectUri === "string" &&
    hasText(login.redirectUri)
  );
}

interface BrowserOAuthCredentialRepoOptions {
  now?: () => number;
}

function getBrowserStorage(): BrowserOAuthCredentialRepoStorage {
  return { localStorage: window.localStorage };
}

function hasText(value: string | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** 浏览器 OAuth 凭据仓储：统一收敛 localStorage 读写，避免业务层散落认证状态判断。 */
export class BrowserOAuthCredentialRepo {
  private readonly localStorage: Storage;
  private readonly now: () => number;

  constructor(
    storage: BrowserOAuthCredentialRepoStorage = getBrowserStorage(),
    options: BrowserOAuthCredentialRepoOptions = {},
  ) {
    this.localStorage = storage.localStorage;
    this.now = options.now ?? Date.now;
  }

  saveTokenSet(tokenSet: OAuthTokenSet, provider: WebOAuthProviderId): void {
    const accessToken = tokenSet.accessToken;
    const anetJwtToken = tokenSet.anetJwtToken;

    this.localStorage.setItem(providerKeys(provider).accessToken, accessToken);
    if (anetJwtToken) {
      this.localStorage.setItem(ANET_JWT_TOKEN_KEY, anetJwtToken);
    } else {
      this.localStorage.removeItem(ANET_JWT_TOKEN_KEY);
    }
  }

  saveUserInfo(user: unknown, provider: WebOAuthProviderId): void {
    const rawUserInfo = JSON.stringify(user);
    this.localStorage.setItem(providerKeys(provider).userInfo, rawUserInfo);
  }

  setActiveProvider(provider: WebOAuthProviderId | null): void {
    if (!provider) {
      this.localStorage.removeItem(ACTIVE_PROVIDER_KEY);
      return;
    }

    this.localStorage.setItem(ACTIVE_PROVIDER_KEY, provider);
  }

  getActiveProvider(): OAuthProviderId | null {
    return this.localStorage.getItem(ACTIVE_PROVIDER_KEY);
  }

  loadCachedSession(): UserInfo | null {
    const result = this.loadCachedSessionState();
    return result.status === "authenticated" ? result.userInfo : null;
  }

  /**
   * 只读的账号展示资料（设备页账号行）。不是登录门禁：不校验 JWT、不清理残缺凭据，
   * 否则渲染一次列表就可能提前登出；登录事实仍由 loadCachedSessionState / JWT 决定。
   */
  loadActiveAccount(): { provider: WebOAuthProviderId; userInfo: UserInfo } | null {
    try {
      const provider = this.localStorage.getItem(ACTIVE_PROVIDER_KEY);
      if (!isWebOAuthProviderId(provider)) return null;
      const rawUserInfo = this.localStorage.getItem(providerKeys(provider).userInfo);
      if (!hasText(rawUserInfo)) return null;
      const userInfo = toUserInfo(JSON.parse(rawUserInfo));
      return userInfo ? { provider, userInfo } : null;
    } catch {
      return null;
    }
  }

  loadCachedSessionState(): OAuthCachedSessionRestoreResult {
    const activeProvider = this.localStorage.getItem(ACTIVE_PROVIDER_KEY);
    const anetJwtToken = this.localStorage.getItem(ANET_JWT_TOKEN_KEY);
    // 一次只有一个 activeProvider（切换 provider = 重新登录并覆盖），所以按它选 key 段读。
    const keys = isWebOAuthProviderId(activeProvider) ? providerKeys(activeProvider) : null;
    const accessToken = keys ? this.localStorage.getItem(keys.accessToken) : null;
    const rawUserInfo = keys ? this.localStorage.getItem(keys.userInfo) : null;

    if (!keys || !hasText(anetJwtToken) || !hasText(accessToken) || !hasText(rawUserInfo)) {
      if (this.hasAnyStoredCredential()) {
        this.clearAll();
      }
      return { status: "signed-out" };
    }

    if (resolveJwtExpiration(anetJwtToken, this.now()).kind === "expired") {
      // Web localStorage 之前只检查 JWT 是否存在，过期后仍会恢复伪登录态。
      this.clearAll();
      return { status: "reauthentication-required", reason: "jwt-expired" };
    }

    try {
      const userInfo = toUserInfo(JSON.parse(rawUserInfo));
      if (userInfo) {
        return { status: "authenticated", userInfo };
      }
    } catch {
      // localStorage 可能留下旧版或手工写入的损坏 JSON。
      // 这里按未登录处理并清理残缺态，避免 Web 远控入口误判成已登录后继续连接。
    }

    this.clearAll();
    return { status: "signed-out" };
  }

  loadANetJwtToken(): string | null {
    const session = this.loadCachedSessionState();
    if (session.status !== "authenticated") return null;
    return this.localStorage.getItem(ANET_JWT_TOKEN_KEY)?.trim() || null;
  }

  /** 枚举所有 `oauth:<provider>:*` 凭据 key；按模式匹配，因此也覆盖已下线 provider 遗留的 key。 */
  private listProviderCredentialKeys(): string[] {
    const keys: string[] = [];
    for (let index = 0; index < this.localStorage.length; index += 1) {
      const key = this.localStorage.key(index);
      if (key && PROVIDER_KEY_PATTERN.test(key)) keys.push(key);
    }
    return keys;
  }

  private hasAnyStoredCredential(): boolean {
    return Boolean(
      this.localStorage.getItem(ACTIVE_PROVIDER_KEY) ||
      this.localStorage.getItem(ANET_JWT_TOKEN_KEY) ||
      this.listProviderCredentialKeys().length > 0,
    );
  }

  clearAll(): void {
    this.localStorage.removeItem(ACTIVE_PROVIDER_KEY);
    this.localStorage.removeItem(ANET_JWT_TOKEN_KEY);
    // 所有 provider 的 key 段一起清：切换 provider 时不能留下上一个身份的残片，
    // 否则 loadCachedSessionState 可能读到半套凭据。
    for (const key of this.listProviderCredentialKeys()) {
      this.localStorage.removeItem(key);
    }
  }

  /**
   * 记住这次跳出去的登录，按 nonce 区分。
   *
   * 修复：原先 nonce/provider/回调地址存在发起页的 sessionStorage。部分手机浏览器的 OAuth
   * 回调不在发起登录的标签页里，或标签页被系统回收后重建，回调页读不到 nonce，换 token 前
   * 就报 “OAuth CSRF 检测失败”，重新登录也一样失败。改存同源 localStorage 后，同一浏览器的
   * 任意标签页都能完成回调；nonce 仍随机且只用一次，CSRF 校验强度不变。
   */
  savePendingLogin(login: PendingOAuthLogin): void {
    const logins = this.readPendingLogins().filter((pending) => pending.nonce !== login.nonce);
    this.writePendingLogins([...logins, login].slice(-MAX_PENDING_LOGINS));
  }

  /** 取出并删除 nonce 对应的登录记录；找不到时不改动其他标签页的记录。 */
  takePendingLogin(nonce: string): PendingOAuthLogin | null {
    const logins = this.readPendingLogins();
    const login = logins.find((pending) => pending.nonce === nonce);
    if (!login) return null;
    this.writePendingLogins(logins.filter((pending) => pending !== login));
    return login;
  }

  private readPendingLogins(): PendingOAuthLogin[] {
    const raw = this.localStorage.getItem(OAUTH_PENDING_LOGINS_KEY);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isPendingOAuthLogin) : [];
    } catch {
      // 损坏的记录不能当成本次登录；下一次发起登录会整体覆盖。
      return [];
    }
  }

  private writePendingLogins(logins: PendingOAuthLogin[]): void {
    if (logins.length > 0) {
      this.localStorage.setItem(OAUTH_PENDING_LOGINS_KEY, JSON.stringify(logins));
    } else {
      this.localStorage.removeItem(OAUTH_PENDING_LOGINS_KEY);
    }
  }
}
