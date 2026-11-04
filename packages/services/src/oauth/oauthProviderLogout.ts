import {
  getModelProviderFamilySpec,
  resolveProviderFamilyDomainFromOAuthProvider,
  type OAuthProviderId,
} from "@anet/shared";
import { accountProviderCredentialKey } from "../model-provider/accountProviderCredentialKey.js";
import type { AccountProviderCredentialStore } from "../model-provider/accountProviderCredentialStore.js";

interface OAuthProviderLogoutDependencies {
  readonly accountProviderCredentialStore: Pick<AccountProviderCredentialStore, "deleteApiKey">;
  readonly refreshAccountProviders?: (reason: string) => Promise<unknown>;
}

export function createOAuthProviderLogoutHandler(
  dependencies: OAuthProviderLogoutDependencies,
): (provider: OAuthProviderId, accountIdentity?: string | null) => Promise<void> {
  return async (provider, accountIdentity) => {
    const providerIds = resolveProviderIds(provider);
    if (!providerIds) return;

    if (accountIdentity?.trim()) {
      await dependencies.accountProviderCredentialStore.deleteApiKey(
        accountProviderCredentialKey({
          providerId: providerIds.codingPlan,
          planKind: "individual-coding-plan",
          accountIdentity,
        }),
      );
    }
    await dependencies.refreshAccountProviders?.(`oauth-logout:${provider}`);
  };
}

function resolveProviderIds(provider: OAuthProviderId): {
  readonly codingPlan: string;
} | null {
  const familyId = resolveProviderFamilyDomainFromOAuthProvider(provider);
  const spec = familyId ? getModelProviderFamilySpec(familyId) : null;
  return spec ? { codingPlan: spec.individualCodingPlanProviderId } : null;
}
