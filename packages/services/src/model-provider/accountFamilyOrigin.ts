import { getModelProviderFamilySpec, type ProviderFamilyDomain } from "@anet/shared";

/**
 * 账号 family 的业务接口 origin。
 *
 * family 注册表为空时没有任何已知账号域,返回 null,调用方按"不可用"处理。
 * 已注册的 family 以其 rootDomain 的 https origin 作为业务入口;需要其他入口的发行方
 * 应在调用点显式传入,而不是在这里按 family 增加分支。
 */
export function resolveAccountFamilyOrigin(family: ProviderFamilyDomain): string | null {
  const spec = getModelProviderFamilySpec(family);
  return spec ? `https://${spec.rootDomain}` : null;
}

/** family 对应的 OAuth provider id;family 未注册时返回 null,调用方按"无凭据"处理。 */
export function resolveFamilyOAuthProviderId(family: ProviderFamilyDomain): string | null {
  return getModelProviderFamilySpec(family)?.oauthProviderId ?? null;
}
