import { useCallback, useEffect, useMemo } from "react";
import type { ProviderSettingsView } from "@anet/services";
import type { ProviderFamilyConnectionSelectionSettings } from "@anet/shared";
import type { UsageEntitlementRefreshOptions } from "@/hooks/useUsageEntitlement.js";
import type { CodingPlanEntitlementState } from "@/settings/model-provider-section/constants.js";

export function resolveCodingPlanProviderFingerprintAutoRefresh({
  loading,
  providerFingerprint,
  skippedProviderFingerprint,
  suppressAutoRefresh,
}: {
  loading: boolean;
  providerFingerprint: string;
  skippedProviderFingerprint: string;
  suppressAutoRefresh: boolean;
}): {
  shouldRefresh: boolean;
  skippedProviderFingerprint: string;
} {
  if (loading || !providerFingerprint) {
    return { shouldRefresh: false, skippedProviderFingerprint };
  }
  if (suppressAutoRefresh) {
    return {
      shouldRefresh: false,
      skippedProviderFingerprint: providerFingerprint,
    };
  }
  if (skippedProviderFingerprint === providerFingerprint) {
    return {
      shouldRefresh: false,
      skippedProviderFingerprint: "",
    };
  }
  return { shouldRefresh: true, skippedProviderFingerprint: "" };
}

export function useCodingPlanAccessRefresh({
  refresh,
  selectedPlanKey,
}: {
  refresh: (options?: UsageEntitlementRefreshOptions) => Promise<void>;
  selectedPlanKey: string | null;
}): void {
  useEffect(() => {
    if (!selectedPlanKey) {
      return;
    }
    // 原 effect 依赖整个 selectedNavItem，额度和 loading 的投影变化也会
    // 被误判为用户重新打开套餐。这里只响应稳定的套餐选择身份。
    void refresh({ silent: true, reason: "access" });
  }, [refresh, selectedPlanKey]);
}

const EMPTY_ENTITLEMENTS: Partial<Record<string, CodingPlanEntitlementState>> = {};
const EMPTY_PROVIDER_IDS: string[] = [];

/**
 * 当前没有注册任何 provider family，因此没有可查询权益的 Coding Plan / Start Plan。
 * 返回稳定的空结果与空操作 refresh，调用方的数据流保持不变。
 * 接入 family 后，需要在此为每个 family 固定调用一次权益 hook（React Hook 调用顺序必须固定），
 * 并把指纹交给 resolveCodingPlanProviderFingerprintAutoRefresh 决定是否自动刷新。
 */
export function useCodingPlanEntitlements(_params: {
  providerSettingsView: ProviderSettingsView | null;
  connectionSelections?: ProviderFamilyConnectionSelectionSettings;
  suppressProviderFingerprintAutoRefresh?: boolean;
}): {
  entitlements: Partial<Record<string, CodingPlanEntitlementState>>;
  /** 当前具备 Account Access、能够独立查询权益的 Start Plan Provider。 */
  enabledStartPlanProviderIds: string[];
  refresh: (options?: UsageEntitlementRefreshOptions) => Promise<void>;
} {
  const refresh = useCallback(
    async (_options: UsageEntitlementRefreshOptions = {}) => undefined,
    [],
  );
  return useMemo(
    () => ({
      entitlements: EMPTY_ENTITLEMENTS,
      enabledStartPlanProviderIds: EMPTY_PROVIDER_IDS,
      refresh,
    }),
    [refresh],
  );
}
