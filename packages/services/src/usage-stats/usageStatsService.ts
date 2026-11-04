import type {
  ApiClient,
  AppUsageRequest,
  AppUsageSnapshot,
  CodingPlanUsageRequest,
  CodingPlanUsageSnapshot,
  CodingPlanRegularTpsRequest,
  CodingPlanResetOpportunityRequest,
  CodingPlanResetOpportunityResult,
  CodingPlanResetScopeRequest,
  CodingPlanResetStatusSnapshot,
  CodingPlanResetUseRequest,
  CodingPlanResetUseResult,
  UsageEntitlementRequest,
  UsageEntitlementSnapshot,
  UsageStatsRequest,
  UsageStatsSnapshot,
} from "@anet/shared";
import type { ICredentialService } from "../credential/credential.js";
import type { IAccountRequestAuthService } from "../model-provider/accountRequestAuthService.js";
import type { IANetAgentService } from "../anet-agent/anetAgent.js";
import type { IUsageStatsService } from "./usageStats.js";
import type { OfficialMcpCredentialSource } from "./providers/anetMcpQuotaProvider.js";

interface UsageStatsServiceDependencies {
  apiClient: ApiClient;
  accountRequestAuthService: Pick<
    IAccountRequestAuthService,
    "resolveAccessCurrent" | "resolveCurrent" | "assertCurrent"
  >;
  credentialService?: Pick<ICredentialService, "load">;
  env?: NodeJS.ProcessEnv;
  /** App Usage 经 ANet Protocol 读取 agent 数据库真实统计。 */
  anetAgentService: Pick<IANetAgentService, "getAppUsageStats">;
  /**
   * 官方 Server MCP 额度的凭证来源。当前没有额度查询后端，保留该依赖是为了不改装配签名。
   */
  officialMcpCredentialSource?: OfficialMcpCredentialSource;
}

const USAGE_UNAVAILABLE_MESSAGE = "Coding plan usage is unavailable in this distribution";

/**
 * 本分发不内置任何 Coding Plan 用量/额度供应方，因此只有 App Usage（本地 agent 数据库）可用。
 * 额度/权益类查询返回"未认证、不可用"的空快照；无法构造空快照的明细类查询抛错；
 * 重置机会类查询返回空列表或未授予。接口签名不变，调用方无需分支。
 * 接入自建用量服务时，在此替换为真实实现。
 */
export function createUsageStatsService(
  dependencies: UsageStatsServiceDependencies,
): IUsageStatsService {
  return {
    async getAppUsageSnapshot(request: AppUsageRequest): Promise<AppUsageSnapshot> {
      // App Usage 读取 agent 数据库真实统计（model_usage/turn_usage/tool_usage），
      // 经 ANet Protocol usage/stats 取回。不读本地 session JSON 估算。
      return dependencies.anetAgentService.getAppUsageStats({
        range: request.range,
        timeZone: request.timeZone,
      });
    },
    async getCodingPlanUsageSnapshot(
      _request: CodingPlanUsageRequest,
    ): Promise<CodingPlanUsageSnapshot> {
      throw new Error(USAGE_UNAVAILABLE_MESSAGE);
    },
    async getCodingPlanRegularTps(
      _request: CodingPlanRegularTpsRequest,
    ): Promise<number | undefined> {
      return undefined;
    },
    async getCodingPlanResetStatus(
      _request: CodingPlanResetScopeRequest,
    ): Promise<CodingPlanResetStatusSnapshot> {
      return {
        availableFiveHourResets: [],
        availableWeekResets: [],
        latestFiveHourResetHistory: null,
        latestWeekResetHistory: null,
        hasUnreadHistory: false,
      };
    },
    async requestCodingPlanResetOpportunity(
      _request: CodingPlanResetOpportunityRequest,
    ): Promise<CodingPlanResetOpportunityResult> {
      return { granted: false, nextTryAt: null };
    },
    async useCodingPlanReset(
      _request: CodingPlanResetUseRequest,
    ): Promise<CodingPlanResetUseResult> {
      throw new Error(USAGE_UNAVAILABLE_MESSAGE);
    },
    async markCodingPlanResetHistoryRead(_request: CodingPlanResetScopeRequest): Promise<void> {},
    async getSnapshot(_request: UsageStatsRequest): Promise<UsageStatsSnapshot> {
      throw new Error(USAGE_UNAVAILABLE_MESSAGE);
    },
    async getEntitlementSnapshot(
      _request: UsageEntitlementRequest = {},
    ): Promise<UsageEntitlementSnapshot> {
      return {
        generatedAt: Date.now(),
        authenticated: false,
        unavailableReason: "unavailable",
        provider: null,
        remaining: null,
        subscription: null,
        quota: null,
        mcpQuota: null,
      };
    },
  };
}
