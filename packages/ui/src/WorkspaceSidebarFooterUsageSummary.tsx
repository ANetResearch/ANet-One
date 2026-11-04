import { SidebarNativeTooltip } from "@/ControlHintTooltip.js";
import { useCodingPlanEntryGate } from "@/settings/CodingPlanEntryButton.js";
import { TID_SIDEBAR_CODING_PLAN_USAGE_BUTTON } from "@anet/shared/test-ids";
import { BarChart3Icon, RocketIcon } from "lucide-react";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu.js";
import {
  resolveCodingPlanUsageRemainingState,
  type CodingPlanUsageAvailableProvider,
  type CodingPlanUsageRemainingEntitlement,
} from "@/CodingPlanUsageRemainingPanel.js";
import { useProviderSettingsView } from "@/hooks/useProviderSettingsView.js";
import { useANetIntl } from "@/i18n/IntlProvider.js";
import { isMaxCodingPlanSnapshot } from "@/lib/sidebarCodingPlanUpgrade.js";
import {
  createCodingPlanFunnelContext,
  resolveCodingPlanEntryPlanState,
  type CodingPlanFunnelContext,
} from "@/lib/codingPlanFunnelTelemetry.js";
import {
  type SidebarUsageCodingPlanProviderId,
  type SidebarUsageCodingPlanSourceId,
} from "@/lib/sidebarUsageCodingPlanProviderPreference.js";
import { setPendingSettingsUsageIntent } from "@/lib/settingsNavigation.js";
import {
  resolveSidebarFooterPlanBadgeLabel,
  resolveSidebarFooterProfilePlanBadge,
} from "@/WorkspaceSidebarFooterPlanBadgeHelpers.js";

export {
  resolveSidebarFooterPlanBadgeLabel,
  resolveSidebarFooterProfilePlanBadge,
} from "@/WorkspaceSidebarFooterPlanBadgeHelpers.js";

const TID_SIDEBAR_CODING_PLAN_UPGRADE_BUTTON = "sidebar-coding-plan-upgrade-button";

export function WorkspaceSidebarFooterUsageSummary({
  enabled,
  onUsageClick,
  onUpgradeClick,
  workspaceIdentity,
  workspacePath,
}: {
  enabled: boolean;
  onUsageClick?: () => void;
  onUpgradeClick?: (
    providerId: SidebarUsageCodingPlanProviderId,
    funnelContext: CodingPlanFunnelContext,
  ) => void;
  workspaceIdentity?: string;
  workspacePath?: string;
}) {
  const state = useWorkspaceSidebarFooterUsageSummaryState({
    enabled,
    workspaceIdentity,
    workspacePath,
  });
  return (
    <WorkspaceSidebarFooterUsageSummaryContent
      state={state}
      onUsageClick={onUsageClick}
      onUpgradeClick={onUpgradeClick}
    />
  );
}

const NO_AVAILABLE_CODING_PLAN_PROVIDERS: CodingPlanUsageAvailableProvider[] = [];
const NO_PROVIDER_ENTITLEMENTS: CodingPlanUsageRemainingEntitlement[] = [];

/**
 * footer 套餐汇总状态。Coding Plan 来源由已注册的 provider family 产出；
 * 当前没有注册任何 family，因此可用来源、权益与升级目标恒为空，
 * 头像旁不显示套餐徽标，菜单中不显示升级入口。
 * 接入 family 后，需要在此为每个 family 固定调用 useUsageEntitlement（Hook 调用顺序必须固定），
 * 并通过 resolveSidebarCurrentCodingPlanUsageSource 解析当前来源。
 */
export function useWorkspaceSidebarFooterUsageSummaryState(_params: {
  enabled: boolean;
  workspaceIdentity?: string;
  workspacePath?: string;
}) {
  const providerSettingsRead = useProviderSettingsView();
  // 首次读取失败也不能被解释成“已经加载且没有套餐”；只有 Ready 才能消费 Provider 事实。
  const providerSourcesLoading = providerSettingsRead.state.status !== "ready";
  const usageState = resolveCodingPlanUsageRemainingState({
    availableProviders: NO_AVAILABLE_CODING_PLAN_PROVIDERS,
    entitlements: NO_PROVIDER_ENTITLEMENTS,
    modelProvidersLoading: providerSourcesLoading,
    selectedProviderId: undefined,
  });
  const visibleUsageState = usageState?.hasAnyActiveCodingPlan ? usageState : null;
  return {
    audience: undefined as "individual" | "team" | undefined,
    availableCodingPlanProviders: NO_AVAILABLE_CODING_PLAN_PROVIDERS,
    providerSourcesLoading,
    providerEntitlements: NO_PROVIDER_ENTITLEMENTS,
    profilePlanBadge: resolveSidebarFooterProfilePlanBadge({
      individualEntitlements: [],
      hasTeamPlanEntitlement: false,
    }),
    selectedProviderId: undefined as SidebarUsageCodingPlanSourceId | undefined,
    upgradeTargetProviderId: undefined as SidebarUsageCodingPlanProviderId | undefined,
    usageState: visibleUsageState,
  };
}

export type WorkspaceSidebarFooterUsageSummaryState = ReturnType<
  typeof useWorkspaceSidebarFooterUsageSummaryState
>;

export function WorkspaceSidebarFooterUsageSummaryContent({
  state,
  onUsageClick,
  onUpgradeClick,
}: {
  state: WorkspaceSidebarFooterUsageSummaryState;
  onUsageClick?: () => void;
  onUpgradeClick?: (
    providerId: SidebarUsageCodingPlanProviderId,
    funnelContext: CodingPlanFunnelContext,
  ) => void;
}) {
  const { intl } = useANetIntl();
  const entryGate = useCodingPlanEntryGate();
  const { providerEntitlements, upgradeTargetProviderId } = state;
  const upgradeProviderSnapshot =
    providerEntitlements.find((item) => item.providerId === upgradeTargetProviderId)?.snapshot ??
    null;
  const upgradeActionLabelId = isMaxCodingPlanSnapshot(upgradeProviderSnapshot)
    ? "sidebar.usage.plan.renew"
    : "sidebar.usage.plan.upgrade";

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        data-testid={TID_SIDEBAR_CODING_PLAN_USAGE_BUTTON}
        onSelect={() => {
          setPendingSettingsUsageIntent();
          onUsageClick?.();
        }}
      >
        <BarChart3Icon className="size-4" />
        {intl.formatMessage({ id: "sidebar.usage.plan.openStats" })}
      </DropdownMenuItem>
      {/* 没有可升级的 provider（未注册任何 family）时不显示升级入口。 */}
      {upgradeTargetProviderId ? (
        <DropdownMenuItem
          data-testid={TID_SIDEBAR_CODING_PLAN_UPGRADE_BUTTON}
          disabled={entryGate.status === "loading"}
          aria-busy={entryGate.status === "loading"}
          onSelect={() => {
            if (entryGate.status !== "ready") {
              entryGate.retry?.();
              return;
            }
            onUpgradeClick?.(
              upgradeTargetProviderId,
              createCodingPlanFunnelContext({
                providerId: upgradeTargetProviderId,
                upgradeSource: "profile_menu",
                eventRegion: "app.profile",
                eventText: intl.formatMessage({ id: upgradeActionLabelId }),
                entryPlanState: resolveCodingPlanEntryPlanState({
                  snapshot: upgradeProviderSnapshot,
                }),
              }),
            );
          }}
        >
          <RocketIcon className="size-4" />
          {entryGate.label ?? intl.formatMessage({ id: upgradeActionLabelId })}
        </DropdownMenuItem>
      ) : null}
    </>
  );
}

export function WorkspaceSidebarFooterPlanBadge({
  state,
}: {
  state: WorkspaceSidebarFooterUsageSummaryState;
}) {
  const { intl } = useANetIntl();
  const label =
    state.profilePlanBadge?.audience === "team"
      ? intl.formatMessage({ id: "sidebar.usage.plan.audienceTeam" })
      : resolveSidebarFooterPlanBadgeLabel(state.profilePlanBadge?.snapshot ?? null);
  if (!label) {
    return null;
  }

  return (
    <SidebarNativeTooltip>
      <span
        className="min-w-0 max-w-20 shrink truncate rounded-full border border-border bg-surface px-1 py-px text-ui-xs font-medium leading-normal text-foreground-subtle"
        title={label}
      >
        {label}
      </span>
    </SidebarNativeTooltip>
  );
}
