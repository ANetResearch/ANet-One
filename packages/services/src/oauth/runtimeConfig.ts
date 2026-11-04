import type { OAuthProviderId } from "@anet/shared";

/** Provider 运行时配置（仅 host process 可见） */
export interface OAuthProviderRuntimeConfig {
  id: OAuthProviderId;
  displayName: string;
  enabled: boolean;
  order: number;
  authorizeUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  appId: string;
  redirectUri: string;
  businessLoginUrl?: string;
  appSecret?: string;
}

/** OAuth 全局运行时配置 */
export interface OAuthRuntimeConfig {
  providers: OAuthProviderRuntimeConfig[];
}

/**
 * 从运行时环境变量生成 OAuth 配置。
 *
 * 注意：这里只能在 host process 使用，避免把敏感配置暴露给 renderer。
 *
 * 本分发不内置任何 provider，返回空列表；自建授权服务端在此追加自己的配置。
 * 保留 env 形参是为了不改变调用方签名。
 */
export function createOAuthRuntimeConfig(
  _env: NodeJS.ProcessEnv = process.env,
): OAuthRuntimeConfig {
  return {
    providers: [],
  };
}
