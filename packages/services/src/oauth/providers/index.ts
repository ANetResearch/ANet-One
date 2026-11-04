import type { ApiClient } from "@anet/shared";
import type { OAuthRuntimeConfig } from "../runtimeConfig.js";
import type { OAuthProviderAdapter } from "./providerAdapter.js";

/**
 * 根据运行时配置创建可用 provider adapter。
 *
 * 本分发不内置任何厂商的 OAuth provider:上游在这里注册了两个厂商账号体系的
 * adapter,连同它们写死的授权域名与 client id。实现文件已删除,这里只剩框架 ——
 * 配置里出现任何 provider id 都会落到 default 分支被忽略,返回空列表。
 *
 * 要接自建的授权服务端,在这里注册自己的 adapter。
 */
export function createOAuthProviderAdapters(
  config: OAuthRuntimeConfig,
  options: { apiClient?: ApiClient } = {},
): OAuthProviderAdapter[] {
  const adapters: OAuthProviderAdapter[] = [];
  const apiClient = options.apiClient;
  if (!apiClient) {
    throw new Error(
      "ApiClient 注入缺失：OAuth provider adapters 必须通过 Providers 传入 apiClient",
    );
  }

  for (const _providerConfig of config.providers) {
    // 没有内置 adapter 可注册。保留循环而不是直接 return [],是为了让后续接入
    // 自建 provider 时改动落在同一处。
  }

  return adapters;
}

export type { OAuthProviderAdapter, OAuthProviderContext } from "./providerAdapter.js";
