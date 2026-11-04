import { PROVIDER_FAMILY_SPECS } from "@/lib/modelProviderFamilies.js";
import {
  isCodingPlanModelProviderId,
  type OAuthProviderId,
  resolveModelProviderFamilySpecByProviderId,
} from "@anet/shared";
import { type CodingPlanProviderId } from "@/settings/model-provider-section/constants.js";

export type CodingPlanPurchaseAuthStatus =
  | "unknown"
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

export function isCodingPlanPurchaseAuthPending(status: CodingPlanPurchaseAuthStatus): boolean {
  return status === "unknown" || status === "loading";
}

export async function readCodingPlanPurchaseTokenState(credentialService: {
  load(key: string): Promise<string | null>;
}) {
  const [activeProvider, ...tokens] = await Promise.all([
    credentialService.load("oauth:active_provider"),
    ...PROVIDER_FAMILY_SPECS.map((spec) =>
      credentialService.load(`oauth:${spec.oauthProviderId}:access_token`),
    ),
  ]);
  // 只有 active provider 对应的 family 才视为已登录；个人 Coding Plan 与 Start Plan 共用同一 token。
  const state: Partial<Record<CodingPlanProviderId, boolean>> = {};
  PROVIDER_FAMILY_SPECS.forEach((spec, index) => {
    const authenticated = activeProvider === spec.oauthProviderId && Boolean(tokens[index]?.trim());
    state[spec.individualCodingPlanProviderId] = authenticated;
    state[spec.startPlanProviderId] = authenticated;
  });
  return state;
}

export function normalizeCodingPlanProviderId(
  providerId: string | null | undefined,
): CodingPlanProviderId | null {
  const normalized = providerId?.trim();
  return normalized && isCodingPlanModelProviderId(normalized)
    ? (normalized as CodingPlanProviderId)
    : null;
}

export function isCodingPlanProviderId(
  providerId: CodingPlanProviderId | null,
): providerId is CodingPlanProviderId {
  return Boolean(providerId);
}

export function resolveCodingPlanOAuthProviderId(
  providerId: CodingPlanProviderId,
): OAuthProviderId | null {
  return resolveModelProviderFamilySpecByProviderId(providerId)?.oauthProviderId ?? null;
}
