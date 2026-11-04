import { PROVIDER_FAMILY_SPECS } from "@/lib/modelProviderFamilies.js";
import { type ModelProviderFamilySpec } from "@anet/shared";
import { logger } from "@/logger.js";

/** 已注册 provider family 的个人 / 团队 Coding Plan providerId。 */
export type SidebarUsageCodingPlanProviderId =
  | ModelProviderFamilySpec["individualCodingPlanProviderId"]
  | ModelProviderFamilySpec["teamCodingPlanProviderId"];
export type SidebarUsageCodingPlanSourceId = SidebarUsageCodingPlanProviderId | `team:${string}`;

const SIDEBAR_USAGE_CODING_PLAN_PROVIDER_STORAGE_KEY = "anet:sidebar-usage-coding-plan-provider";

const SIDEBAR_USAGE_CODING_PLAN_PROVIDER_IDS: readonly string[] = PROVIDER_FAMILY_SPECS.flatMap(
  (spec) => [spec.individualCodingPlanProviderId, spec.teamCodingPlanProviderId],
);

function isSidebarUsageCodingPlanProviderId(
  providerId: string | null | undefined,
): providerId is SidebarUsageCodingPlanProviderId {
  return providerId != null && SIDEBAR_USAGE_CODING_PLAN_PROVIDER_IDS.includes(providerId);
}

function isSidebarUsageCodingPlanSourceId(
  sourceId: string | null | undefined,
): sourceId is SidebarUsageCodingPlanSourceId {
  if (sourceId == null) return false;
  // 个人来源 id 的类型放宽为 string 后，类型谓词的 false 分支会把 sourceId 收窄为 never，
  // 因此这里直接按字符串判断，不复用上面的类型谓词。
  return SIDEBAR_USAGE_CODING_PLAN_PROVIDER_IDS.includes(sourceId) || sourceId.startsWith("team:");
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch (error) {
    // WebView 隐私模式或移动端远控容器可能禁用 localStorage。
    // 这里只影响 footer 的 provider 选择记忆，失败时降级为本次默认选择即可。
    logger.warn("[sidebarUsageCodingPlanProviderPreference] localStorage 不可用", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export function readSidebarUsageCodingPlanProviderPreference():
  | SidebarUsageCodingPlanProviderId
  | undefined {
  const value = readSidebarUsageCodingPlanSourcePreference();
  return isSidebarUsageCodingPlanProviderId(value) ? value : undefined;
}

export function readSidebarUsageCodingPlanSourcePreference():
  | SidebarUsageCodingPlanSourceId
  | undefined {
  const storage = getLocalStorage();
  if (!storage) {
    return undefined;
  }
  try {
    const value = storage.getItem(SIDEBAR_USAGE_CODING_PLAN_PROVIDER_STORAGE_KEY);
    return isSidebarUsageCodingPlanSourceId(value) ? value : undefined;
  } catch (error) {
    logger.warn("[sidebarUsageCodingPlanProviderPreference] 读取偏好失败", {
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}

export function writeSidebarUsageCodingPlanProviderPreference(
  providerId: SidebarUsageCodingPlanSourceId,
): void {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(SIDEBAR_USAGE_CODING_PLAN_PROVIDER_STORAGE_KEY, providerId);
  } catch (error) {
    logger.warn("[sidebarUsageCodingPlanProviderPreference] 写入偏好失败", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
