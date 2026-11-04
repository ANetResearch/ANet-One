import type { HttpClientPort, HttpClientRunOptions, TraceContext } from "@anet/contracts";
import type { ProjectAccessTokenMaterial } from "@anet/shared";

/** 账号族标识。当前未内置任何账号族，因此不限定取值。 */
export type CodingPlanFamily = string;
export interface CodingPlanApiKeyResolverOptions {
  httpClient: HttpClientPort;
  trace?: TraceContext;
  locationStore?: {
    load(key: string): Promise<string | null>;
    save(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
  };
  observe?(event: { family: string; stage: "resolve"; code: string }): void;
}
export interface ResolveCodingPlanApiKeyInput {
  accessToken: string;
  family: CodingPlanFamily;
  accountIdentity?: string;
  rejectedProjectTokenFingerprint?: string;
  trace?: TraceContext;
}
export interface CodingPlanApiKeyResolver {
  resolve(input: ResolveCodingPlanApiKeyInput, options?: HttpClientRunOptions): Promise<string>;
  resolveMaterial(
    input: ResolveCodingPlanApiKeyInput,
    options?: HttpClientRunOptions,
  ): Promise<ProjectAccessTokenMaterial>;
  clear(): void;
}
export class CodingPlanApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CodingPlanApiKeyError";
  }
}

/**
 * CLI 进程内唯一换证入口。当前未注册任何换证实现，
 * 因此登录令牌为空时报 project_token_login_required，其余情况一律报 project_token_unavailable。
 * 保留接口形状是为了让调用方不必连带修改；代价是该入口目前不能签发任何令牌。
 */
export function createCodingPlanApiKeyResolver(
  options: CodingPlanApiKeyResolverOptions,
): CodingPlanApiKeyResolver {
  const resolveMaterial = async (
    input: ResolveCodingPlanApiKeyInput,
  ): Promise<ProjectAccessTokenMaterial> => {
    if (!input.accessToken.trim()) throw new CodingPlanApiKeyError("project_token_login_required");
    options.observe?.({
      family: input.family,
      stage: "resolve",
      code: "project_token_unavailable",
    });
    throw new CodingPlanApiKeyError("project_token_unavailable");
  };
  return {
    resolveMaterial,
    async resolve(input) {
      return (await resolveMaterial(input)).token;
    },
    clear() {},
  };
}
