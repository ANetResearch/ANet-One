import { BUILTIN_PROVIDER_TEMPLATE_IDS, type AppSettings, type Locale } from "@anet/shared";
import type { ModelSelectionView } from "@anet/services";
import { encodeCustomModelValue } from "@/lib/anetCustomModelValue.js";

// 登录入口只提供一个供应方:Agent Network 的 token 网关，登录只需要填一个 token。
export type ApiKeyProviderChoice = "anet";

export const LOGIN_API_KEY_PROVIDER_CHOICE: ApiKeyProviderChoice = "anet";
export const LOGIN_API_KEY_PROVIDER_LABEL = "Agent Network";

export function resolveLoginApiKeyDefaultProvider(_locale: Locale): ApiKeyProviderChoice {
  // 只有一个供应方,与界面语言无关。
  return LOGIN_API_KEY_PROVIDER_CHOICE;
}

export function resolveLoginApiKeyTemplateId(_choice: ApiKeyProviderChoice): "anet-token" {
  return BUILTIN_PROVIDER_TEMPLATE_IDS.anetToken;
}

export function resolveLoginApiKeyProviderLabel(_choice: ApiKeyProviderChoice): string {
  return LOGIN_API_KEY_PROVIDER_LABEL;
}

export function buildLoginApiKeySkipSettings(
  _choice: ApiKeyProviderChoice,
  now: number,
): Partial<
  Pick<
    AppSettings,
    "providerFamilyDomain" | "providerFamilyDomainUpdatedAt" | "providerFamilyDomainMigrated"
  >
> {
  // 不写 providerFamilyDomain:那个设置选的是供应方家族下的哪个运行域(两个
  // 云之间二选一),对一个纯 api-key 网关没有意义,写任一值都会让后续逻辑
  // 以为用户选了某个云。只记下"已处理过迁移",避免再弹迁移提示。
  return {
    providerFamilyDomainUpdatedAt: now,
    providerFamilyDomainMigrated: true,
  };
}

export function shouldShowLoginApiKeyLink(
  apiKeyValue: string,
  apiKeyUrl: string | undefined,
): boolean {
  return Boolean(apiKeyUrl) && apiKeyValue.trim().length === 0;
}

export function buildLoginApiKeyDefaultModelPreferenceFromSelection(
  view: ModelSelectionView,
  providerId: string,
): string | null {
  const firstModel = view.providers.find((provider) => provider.providerId === providerId)
    ?.models[0]?.modelId;
  return firstModel ? encodeCustomModelValue(providerId, firstModel) : null;
}

export function resolveHydratedLoginApiKeyValue({
  savedApiKey,
  userEdited,
}: {
  savedApiKey: string;
  userEdited: boolean;
}): string | null {
  if (userEdited) {
    return null;
  }
  return savedApiKey.trim();
}
