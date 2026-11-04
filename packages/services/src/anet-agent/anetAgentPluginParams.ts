import type {
  ModelSelection,
  ANetAgentMcpServer,
  ANetAutomationScheduleRule,
  ANetMcpListMode,
} from "@anet/shared";
import type { McpAppsAppToolCallResult, McpAppsAppToolDescriptor } from "@anet/shared/mcp-apps";

export interface ANetAgentWorkspaceTarget {
  workspacePath: string;
  workspaceIdentity?: string;
  /** 远程 workspace 的运行时会话身份；只用于隔离/路由，不能替代 workspacePath。 */
  remoteSessionId?: string;
}

export interface ANetAgentPluginMutationTarget extends ANetAgentWorkspaceTarget {
  /** 仅 Host 观测使用；不会传给 CLI。 */
  telemetry?: {
    entry?:
      | "store_list"
      | "store_detail"
      | "side_pane_market"
      | "recommended_prompt"
      | "recommended_ui"
      | "component_settings";
    client_kind?: "desktop" | "mobile";
    trigger?: "user" | "automatic" | "dependency" | "restore" | "sync";
  };
}

export interface ANetAgentPluginViewParams extends ANetAgentWorkspaceTarget {
  configScope?: "user" | "workspace";
}

export interface ANetAgentListMcpServerStatusesParams extends ANetAgentWorkspaceTarget {
  mcpServers?: ANetAgentMcpServer[];
  mode?: ANetMcpListMode;
}

export interface ANetAgentAddPluginMarketplaceParams extends ANetAgentPluginMutationTarget {
  dryRun?: boolean;
  operationId?: string;
  source: string;
}

export interface ANetAgentRemovePluginMarketplaceParams extends ANetAgentPluginMutationTarget {
  marketplace: string;
}

export interface ANetAgentUpdatePluginMarketplaceParams extends ANetAgentPluginMutationTarget {
  marketplace?: string;
  operationId?: string;
}

export interface ANetAgentInstallPluginParams extends ANetAgentPluginMutationTarget {
  dryRun?: boolean;
  marketplace: string;
  operationId?: string;
  pluginName: string;
  scope?: "user" | "workspace";
}

export interface ANetAgentCancelPluginOperationParams {
  operationId: string;
}

export interface ANetAgentUninstallPluginParams extends ANetAgentPluginMutationTarget {
  marketplace?: string;
  pluginId?: string;
  pluginName?: string;
  removeCache?: boolean;
}

export interface ANetAgentUpdatePluginParams extends ANetAgentPluginMutationTarget {
  pluginId?: string;
  marketplace?: string;
}

export interface ANetAgentRestoreBuiltinPluginParams extends ANetAgentPluginMutationTarget {
  pluginId: string;
}

export interface ANetAgentConfigurePluginParams extends ANetAgentPluginMutationTarget {
  clearOptionKeys?: string[];
  dryRun?: boolean;
  options: Record<string, unknown>;
  pluginId: string;
  scope?: "user" | "workspace";
}

export interface ANetAgentResetPluginConfigParams extends ANetAgentPluginMutationTarget {
  pluginId: string;
  scope?: "user" | "workspace";
}

export interface ANetAgentValidatePluginParams extends ANetAgentWorkspaceTarget {
  marketplace?: string;
  pluginName?: string;
  source?: string;
}

export interface ANetAgentDescribePluginParams extends ANetAgentWorkspaceTarget {
  marketplace: string;
  pluginName: string;
}

export interface ANetAgentSetPluginEnabledParams extends ANetAgentPluginMutationTarget {
  enabled: boolean;
  operationId?: string;
  pluginId: string;
  scope?: "user" | "workspace";
}

// Plugin 对话引用 catalog：
// 带 sessionId → session-owned 冻结 catalog（必须路由到持有该 session 的 workspace client）；
// 不带 → workspace 当前 catalog（新建草稿 Picker）。
export interface ANetAgentPluginReferenceCatalogParams extends ANetAgentWorkspaceTarget {
  sessionId?: string;
}

// Composer Skill catalog：与 Plugin 引用相同，以 sessionId 区分 workspace 当前目录和
// resident Session runtime 快照；不参与 Settings 管理目录。
export interface ANetAgentSkillReferenceCatalogParams extends ANetAgentWorkspaceTarget {
  sessionId?: string;
}

/** 插件 UI：UI 发起的 `ui://` 资源读取。 */
export interface ANetAgentReadMcpResourceParams extends ANetAgentWorkspaceTarget {
  instance: import("@anet/shared/mcp-apps").McpAppInstance;
  sessionId: string;
  pluginId: string;
  serverName: string;
  uri: string;
}

/** 插件 UI 页面发起的 `resources/read`；参数与 readMcpResource 同形，结果受 8 MiB 与 mimeType 白名单约束。 */
export type ANetAgentReadMcpResourceForUiParams = ANetAgentReadMcpResourceParams;

/** 插件 UI：UI 回调本插件工具；不进审批流，归属由 agent 侧 catalog fail closed。 */
export interface ANetAgentCallMcpToolForUiParams extends ANetAgentWorkspaceTarget {
  instance: import("@anet/shared/mcp-apps").McpAppInstance;
  sessionId: string;
  pluginId: string;
  serverName: string;
  toolName: string;
  arguments?: Record<string, unknown>;
  /** 宿主生成的调用 id，配合 cancelMcpToolCallForUi。 */
  callId: string;
}
/** 插件 UI 页面发起的 resources/list、resources/templates/list、subscribe、unsubscribe。 */
export interface ANetAgentListMcpResourcesForUiParams extends ANetAgentWorkspaceTarget {
  instance: import("@anet/shared/mcp-apps").McpAppInstance;
  sessionId: string;
  pluginId: string;
  serverName: string;
  cursor?: string;
}
/** App-Provided Tools：实例身份 = 会话 + 沙箱作用域 + 代际。 */
export interface ANetAgentAppToolInstanceForUiParams extends ANetAgentWorkspaceTarget {
  instance: import("@anet/shared/mcp-apps").McpAppInstance;
  sessionId: string;
  pluginId: string;
  serverName: string;
  scopeId: string;
  generation: number;
}
export interface ANetAgentRegisterAppToolsForUiParams extends ANetAgentAppToolInstanceForUiParams {
  tools: McpAppsAppToolDescriptor[];
}
export interface ANetAgentAppToolCallForUiParams extends ANetAgentAppToolInstanceForUiParams {
  callId: string;
}
export interface ANetAgentResolveAppToolCallForUiParams extends ANetAgentAppToolCallForUiParams {
  result?: McpAppsAppToolCallResult;
  error?: { message: string };
}
export interface ANetAgentMcpResourceSubscriptionForUiParams extends ANetAgentWorkspaceTarget {
  instance: import("@anet/shared/mcp-apps").McpAppInstance;
  sessionId: string;
  pluginId: string;
  serverName: string;
  scopeId: string;
  generation: number;
  uri: string;
}
export interface ANetAgentCancelMcpToolCallForUiParams extends ANetAgentWorkspaceTarget {
  instance: import("@anet/shared/mcp-apps").McpAppInstance;
  sessionId: string;
  pluginId: string;
  serverName: string;
  callId: string;
}
export interface ANetAgentResolveSuggestedPluginReferenceParams extends ANetAgentWorkspaceTarget {
  stableId: string;
  operationId: string;
  clientMode: "desktop-continuous" | "web-remote-replayable";
  deliveryKind: "desktop-continuous" | "web-remote-replayable";
}

// ---- 定时任务(automation)管理参数 ----

export interface ANetAgentCreateAutomationParams extends ANetAgentWorkspaceTarget {
  projectId?: string | null;
  title: string;
  cronExpr: string;
  relativeDelayMinutes?: number;
  prompt: string;
  modelSelection?: ModelSelection;
  mode?: string;
  recurring?: boolean;
  maxRuns?: number;
  endAt?: number;
  scheduleRule?: ANetAutomationScheduleRule;
}

export interface ANetAgentUpdateAutomationParams extends ANetAgentWorkspaceTarget {
  automationId: string;
  title?: string;
  cronExpr?: string;
  prompt?: string;
  modelSelection?: ModelSelection | null;
  mode?: string | null;
  recurring?: boolean;
  maxRuns?: number | null;
  endAt?: number | null;
  scheduleRule?: ANetAutomationScheduleRule | null;
  scheduleEditedByUser?: boolean;
}

export interface ANetAgentAutomationIdParams extends ANetAgentWorkspaceTarget {
  automationId: string;
}

export interface ANetAgentSetAutomationEnabledParams extends ANetAgentWorkspaceTarget {
  automationId: string;
  enabled: boolean;
}

export interface ANetAgentDeleteAutomationRunParams extends ANetAgentWorkspaceTarget {
  runId: string;
}
