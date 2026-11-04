import type {
  ApiClient,
  ProviderFamilyDomain,
  ProviderFamilyConnectionSelectionSettings,
} from "@anet/shared";

export type CodingPlanUnavailableReason =
  | "coding_plan_not_authenticated"
  | "coding_plan_not_connected"
  | "coding_plan_auth_failed"
  | "coding_plan_not_entitled";

interface CodingPlanAvailabilityCredentialService {
  load(key: string): Promise<string | null>;
}

interface CodingPlanAvailabilityContext {
  apiClient?: ApiClient;
  credentialService?: CodingPlanAvailabilityCredentialService;
  providerFamilyConnectionSelections?: ProviderFamilyConnectionSelectionSettings;
}

export type CodingPlanAvailabilityResult =
  | { kind: "available"; models?: readonly string[] }
  | { kind: "pending"; effectiveAt: number; models: readonly string[] }
  | { kind: "unavailable"; reason: CodingPlanUnavailableReason }
  | { kind: "unknown" };

export interface CodingPlanAvailabilityProvider {
  readonly providerId: string;
  readonly family: ProviderFamilyDomain;
  readonly planKind: "start-plan" | "individual-coding-plan" | "team-coding-plan";
  readonly apiKey?: string | null;
}

/**
 * 校验单个 Coding Plan provider 的权益。
 *
 * 本分发不内置任何套餐查询后端，权益无从核验，恒返回 unknown。
 * 这里不返回 available（不能证明有权益），也不返回 unavailable（不能证明没有），
 * 调用方按"未知"处理，保持各自既有的保守分支。
 * 接入自建套餐服务时，在此按 planKind 与 family 分发到真实查询实现。
 */
export async function validateCodingPlanProviderAvailability(
  _provider: CodingPlanAvailabilityProvider,
  _context: CodingPlanAvailabilityContext,
): Promise<CodingPlanAvailabilityResult> {
  return { kind: "unknown" };
}

/** 按 family 汇总同一账号下各 provider 的权益；无查询后端时每个 provider 都是 unknown。 */
export async function validateAccountProviderAvailability(
  providers: readonly CodingPlanAvailabilityProvider[],
  context: CodingPlanAvailabilityContext,
): Promise<Partial<Record<string, CodingPlanAvailabilityResult>>> {
  const result: Record<string, CodingPlanAvailabilityResult> = {};
  for (const provider of providers) {
    result[provider.providerId] = await validateCodingPlanProviderAvailability(provider, context);
  }
  return result;
}
