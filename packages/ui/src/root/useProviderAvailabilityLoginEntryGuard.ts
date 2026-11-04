import { useCallback, useEffect, useRef, useState } from "react";
import type { UserInfo } from "@anet/shared";
import type { ModelSelectionView } from "@anet/services";
import { resolveProviderAvailabilityState } from "@/lib/modelProviderAvailability.js";
import { logger } from "@/logger.js";

export interface ProviderAvailabilityLoginEntryGuardResult {
  hasUsableProvider: boolean;
  providerCount: number;
  shouldOpenLoginEntry: boolean;
}

export function useProviderAvailabilityLoginEntryGuard({
  enabled = true,
  user,
  isRestoringOAuthSession,
  providerFamilyDomain,
  modelSelectionView,
  modelSelectionError,
  refreshProviderState,
  readModelSelectionView,
  setLoginEntryOpen,
}: {
  enabled?: boolean;
  user: UserInfo | null;
  isRestoringOAuthSession: boolean;
  providerFamilyDomain: string | null | undefined;
  modelSelectionView: ModelSelectionView | null;
  modelSelectionError?: Error;
  refreshProviderState: () => Promise<void>;
  readModelSelectionView: () => Promise<ModelSelectionView>;
  setLoginEntryOpen: (open: boolean) => void;
}) {
  const [startupCheckCompleted, setStartupCheckCompleted] = useState(!enabled);
  const startupCheckCompletedRef = useRef(false);
  const providerAvailabilityHydrated = modelSelectionView !== null;

  const syncLoginEntryWithProviderAvailability = useCallback(
    async (options: { forceRefresh?: boolean; reason: string }) => {
      if (!enabled) {
        return {
          hasUsableProvider: true,
          providerCount: modelSelectionView?.providers.length ?? 0,
          shouldOpenLoginEntry: false,
        } satisfies ProviderAvailabilityLoginEntryGuardResult;
      }

      if (options.forceRefresh) {
        await refreshProviderState();
      }

      const refreshedView = options.forceRefresh
        ? await readModelSelectionView()
        : modelSelectionView;
      const availability = resolveProviderAvailabilityState({ modelSelectionView: refreshedView });
      const { hasUsableProvider, providerCount } = availability;
      const shouldOpenLoginEntry = !user && !hasUsableProvider;

      // 未登录且没有可用模型配置时必须引导用户连接账号或填写 API Key。
      // 启动检查、API Key 设置回流等入口统一走这里，避免各处复制判断后语义分叉。
      //
      // 这里原本还有一个 `!providerFamilyDomain ||` 前项，与上面这句注释自相
      // 矛盾：providerFamilyDomain 的取值被 zod 限定为已注册的 provider family
      // (packages/shared/src/validationAppSettings.ts:72)，所以只要用户没有
      // 选过这两家之一，无论 provider 多么可用都会被强制弹回 WelcomeScreen，
      // 并且 canRestoreWorkspaceSession 一并被阻断。对于用自建网关
      // (base_url + api_key) 的用户，那是每次启动都过不去的门。
      // 判据仍然是"有没有能用的模型"，而不是"选过哪一家厂商"。
      logger.info("[Root] provider 可用性登录入口守卫完成检查", {
        reason: options.reason,
        source: availability.source,
        providerCount,
        hasUsableProvider,
        hasUser: Boolean(user),
        hasProviderFamilyDomain: Boolean(providerFamilyDomain),
        shouldOpenLoginEntry,
      });
      setLoginEntryOpen(shouldOpenLoginEntry);
      return {
        hasUsableProvider,
        providerCount,
        shouldOpenLoginEntry,
      } satisfies ProviderAvailabilityLoginEntryGuardResult;
    },
    [
      enabled,
      modelSelectionView,
      providerFamilyDomain,
      refreshProviderState,
      readModelSelectionView,
      setLoginEntryOpen,
      user,
    ],
  );

  useEffect(() => {
    if (!enabled) {
      startupCheckCompletedRef.current = true;
      setStartupCheckCompleted(true);
      return;
    }

    if (modelSelectionError) {
      // 首次读取失败不能伪装成“没有 Provider”，也不能让启动门禁永久停在 loading。
      logger.error("[Root] provider 可用性读取失败，结束启动门禁等待", modelSelectionError);
      startupCheckCompletedRef.current = true;
      setStartupCheckCompleted(true);
      return;
    }

    if (
      startupCheckCompletedRef.current ||
      isRestoringOAuthSession ||
      !providerAvailabilityHydrated
    ) {
      return;
    }

    startupCheckCompletedRef.current = true;
    void syncLoginEntryWithProviderAvailability({
      reason: "startup",
    }).finally(() => {
      setStartupCheckCompleted(true);
    });
  }, [
    enabled,
    isRestoringOAuthSession,
    modelSelectionError,
    providerAvailabilityHydrated,
    syncLoginEntryWithProviderAvailability,
  ]);

  return {
    startupCheckCompleted,
    syncLoginEntryWithProviderAvailability,
  };
}
