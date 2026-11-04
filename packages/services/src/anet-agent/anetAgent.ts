import type { PluginUiToolResultNotification } from "@anet/shared/mcp-apps";
import type {
  BackgroundBashOutputResult,
  SessionDebugSnapshot,
  ANetSessionContentProfile,
} from "@anet/shared";
/* eslint-disable max-lines -- ANet agent service 接口集中声明 protocol/session/workspace 方法，拆分会增加 service descriptor 迁移成本。 */
import type { RemoteConversationTelemetryEvent } from "@anet/shared/conversation-telemetry";
import type { Event, IDisposable } from "@anet/rpc";
import { ServiceChannels } from "@anet/shared";
import type { AppUsageRange, AppUsageSnapshot, ANetTaskTokenUsageResult } from "@anet/shared";
import type { DynamicWorkflowMode } from "@anet/shared";
import type { ANetAutomation, ANetAutomationRun } from "@anet/shared";
import type {
  ANetStorageStartupState,
  ANetDeliveryKind,
  ANetAgentMcpServer,
  ANetBackgroundTurnAttribution,
  TraceId,
  ANetSessionCompactResult,
  ANetSessionGoalAction,
  ANetSessionGoalResult,
  ANetMessageWithParts,
  ModelSelection,
  ANetSessionImportHistory,
  ANetPermissionRequestParams,
  AgentLaneResourceSample,
  ANetMcpTelemetryEvent,
  ANetMcpResourceSample,
  ANetToolExecResource,
  ANetProcessChildProcess,
  ANetMcpListResult,
  WorkspaceMcpTrustDecision,
  ANetWorkspaceMcpTrustResult,
  ANetPluginsListResult,
  ANetPluginsOverviewResult,
  ANetPluginsMarketplaceMutationResult,
  ANetPluginsInstallResult,
  ANetPluginsReferenceCatalogResult,
  ANetSkillsReferenceCatalogResult,
  ANetMcpReadResourceResult,
  ANetMcpUiCallToolResult,
  ANetMcpUiCancelCallResult,
  ANetMcpUiReadResourceResult,
  ANetMcpUiListResourcesResult,
  ANetMcpUiAppToolAcceptedResult,
  ANetMcpUiRegisterAppToolsResult,
  ANetMcpUiUnregisterAppToolsResult,
  ANetMcpUiListResourceTemplatesResult,
  ANetPluginsListUiSurfacesResult,
  ANetWorkflowsDeleteResult,
  ANetWorkflowsForRunResult,
  ANetWorkflowsGetResult,
  ANetWorkflowsListResult,
  ANetWorkflowsMoveResult,
  ANetWorkflowsRunsResult,
  ANetWorkflowsSaveResult,
  ANetWorkflowsUpdateMetaResult,
  ANetPluginsUninstallResult,
  ANetPluginsRestoreBuiltinResult,
  ANetPluginsConfigureResult,
  ANetPluginsDescribeResult,
  ANetPluginsValidateResult,
  ANetPluginsSetEnabledResult,
  ANetPluginsCancelOperationResult,
  ANetPluginOperationProgressNotification,
  ANetProviderRuntimeHeadersRequestParams,
  RequestVerificationConfig,
  ANetProviderRuntimeHeadersCancelled,
  ANetProviderTestModelConnectivityParams,
  ANetProviderTestModelConnectivityResult,
  ANetUserInputRequestParams,
  ANetUserInputResponse,
  ANetSessionEvent,
  ANetSessionInfo,
  ANetSessionMode,
  ANetSessionPersistence,
  ANetSessionSendResult,
  ANetSessionRequestRuntimePreferencesParams,
  ANetSessionRuntimePreferencesResult,
  ANetSessionStateSnapshot,
  ANetSessionSubagentsResult,
  ANetStateUpdatedNotification,
  ANetTaskClientMode,
  ANetBrowserAmbientContext,
  ANetWorkspacePresentation,
  ANetWorkspaceGenerateTextResult,
  ANetWorkspaceGenerateTextParams,
  ANetWorkspaceHookTrustGrantResult,
  ANetAutomationBotDeliveryTarget,
} from "@anet/shared";
import type {
  ClientHello,
  CommandAck,
  CommandEnvelope,
  CommandKey,
  CommandsQueryResult,
  ConversationTopicWireCandidate,
  ConversationTelemetryFact,
  CuaPermissionObservation,
  ConversationRowTarget,
  HelloMessage,
  SessionsIndexTopicWireCandidate,
  SessionsIndexReconcileResult,
  V4AttachmentBeginResult,
  V4AttachmentChunkResult,
  V4AttachmentCommitResult,
  V4AttachmentPreviewSourceResult,
  V4AttachmentReadResult,
  V4ConversationAttachmentReadResult,
  V4ConversationAttachmentStatResult,
  V4ConnectionFlowState,
  V4ConversationFileChangesResult,
  V4ConversationFileRewindPreviewResult,
  V4ConversationInputPredictionResult,
  V4ConversationPlansResult,
  V4ConversationWorkflowRunEventsResult,
  V4ConversationWorkflowRunArtifactDataResult,
  V4ConversationWorkflowRunArtifactReadResult,
  V4ConversationWorkflowRunArtifactsResult,
  V4ConversationWorkflowRunNodeResultResult,
  V4ConversationWorkflowRunWorkspaceResult,
  V4ConversationWorkflowRunsResult,
  V4ConversationRowsRangeResult,
  V4ConversationResyncResult,
  V4ConversationSubscribeResult,
  V4SessionsIndexSubscribeResult,
  V4WorkspaceConfigSubscribeResult,
  WorkspaceConfigTopicWireCandidate,
} from "@anet/shared/anet-protocol-v4";
import type {
  V4SessionDataMeasureResult,
  V4SessionDataParams,
  V4SessionDataPurgeResult,
} from "@anet/shared/anet-protocol-v4";
import { createServiceDescriptor } from "../descriptors.js";

export * from "./anetAgentPluginParams.js";
export * from "./anetAgentWorkflowParams.js";
import type {
  ANetAgentAddPluginMarketplaceParams,
  ANetAgentAutomationIdParams,
  ANetAgentCancelPluginOperationParams,
  ANetAgentConfigurePluginParams,
  ANetAgentResetPluginConfigParams,
  ANetAgentCreateAutomationParams,
  ANetAgentDeleteAutomationRunParams,
  ANetAgentDescribePluginParams,
  ANetAgentInstallPluginParams,
  ANetAgentListMcpServerStatusesParams,
  ANetAgentPluginViewParams,
  ANetAgentPluginReferenceCatalogParams,
  ANetAgentSkillReferenceCatalogParams,
  ANetAgentReadMcpResourceParams,
  ANetAgentReadMcpResourceForUiParams,
  ANetAgentListMcpResourcesForUiParams,
  ANetAgentAppToolCallForUiParams,
  ANetAgentAppToolInstanceForUiParams,
  ANetAgentRegisterAppToolsForUiParams,
  ANetAgentResolveAppToolCallForUiParams,
  ANetAgentMcpResourceSubscriptionForUiParams,
  ANetAgentCallMcpToolForUiParams,
  ANetAgentCancelMcpToolCallForUiParams,
  ANetAgentResolveSuggestedPluginReferenceParams,
  ANetAgentRemovePluginMarketplaceParams,
  ANetAgentRestoreBuiltinPluginParams,
  ANetAgentSetPluginEnabledParams,
  ANetAgentSetAutomationEnabledParams,
  ANetAgentUninstallPluginParams,
  ANetAgentUpdatePluginMarketplaceParams,
  ANetAgentUpdatePluginParams,
  ANetAgentUpdateAutomationParams,
  ANetAgentValidatePluginParams,
  ANetAgentWorkspaceTarget,
} from "./anetAgentPluginParams.js";
import type {
  ANetAgentDeleteSavedWorkflowParams,
  ANetAgentFindSavedWorkflowForRunParams,
  ANetAgentGetSavedWorkflowParams,
  ANetAgentListSavedWorkflowRunsParams,
  ANetAgentListSavedWorkflowsParams,
  ANetAgentMoveSavedWorkflowParams,
  ANetAgentSaveSavedWorkflowFromRunParams,
  ANetAgentUpdateSavedWorkflowMetaParams,
} from "./anetAgentWorkflowParams.js";

export interface ANetAgentSessionTarget extends ANetAgentWorkspaceTarget {
  sessionId: string;
}

export interface ANetAgentResumeSessionParams extends ANetAgentSessionTarget {
  additionalDirectories?: string[];
  model?: ModelSelection;
  thoughtLevel?: string;
  mcpServers?: ANetAgentMcpServer[];
  // 冷恢复会重建 runtime，工具面隔离必须和 create 保持同一安全边界（CUA 只放行 anet-cua 工具、
  // 禁 Bash 等）。否则 resume 后模型可见工具面/执行权限会比创建时更宽。
  toolAllowlist?: string[];
  toolDenylist?: string[];
}

export interface ANetAgentInitializeResult {
  available: boolean;
  workspaceKey: string;
  protocolName?: string;
  protocolVersion?: number;
  transportKind?: "stdio" | "websocket";
  reason?: string;
  reasonCode?: "provider_not_ready";
}

export interface ANetAgentRunAutomationNowResult {
  status: "queued" | "duplicate";
}

export interface ANetAgentWorkspaceRuntimeIdentity {
  generation: number;
  identity: string;
  processId?: number;
  workspaceKey: string;
}

export const ANET_AGENT_RUNTIME_UNAVAILABLE_CODE = "ANET_AGENT_RUNTIME_UNAVAILABLE";

export type ANetAgentRuntimePolicy = "start-if-needed" | "existing-only";

export interface ANetAgentRuntimeLifecycleEvent extends ANetAgentWorkspaceTarget {
  workspaceKey: string;
  runtimeIdentity: ANetAgentWorkspaceRuntimeIdentity;
  state: "available" | "unavailable";
}

export type ANetAgentCuaPermissionObservation = CuaPermissionObservation & ANetAgentWorkspaceTarget;

export interface ANetAgentCreateSessionParams extends ANetAgentWorkspaceTarget {
  projectId?: string | null;
  additionalDirectories?: string[];
  sessionId?: string;
  sessionTraceId?: TraceId;
  parentSessionId?: string;
  mode?: ANetSessionMode;
  model?: ModelSelection;
  persistence?: ANetSessionPersistence;
  thoughtLevel?: string;
  /** automation 执行会话关闭模型二次命名，保持首条用户 query 作为稳定标题。 */
  titleGenerationEnabled?: boolean;
  mcpServers?: ANetAgentMcpServer[];
  toolAllowlist?: string[];
  toolDenylist?: string[];
  importedHistory?: ANetSessionImportHistory;
}

export interface ANetAgentListSessionsParams extends ANetAgentWorkspaceTarget {
  sessionIds?: string[];
  runtimePolicy?: ANetAgentRuntimePolicy;
  limit?: number;
}

export interface ANetAgentListSessionSubagentsParams extends ANetAgentSessionTarget {
  endedCursor?: string;
  endedLimit?: number;
  /** 远程 workspace 的宿主连接身份；只用于选择现有 Host，不进入 CLI wire query。 */
  remoteSessionId?: string;
}

export interface ANetAgentAppUsageParams {
  range: AppUsageRange;
  timeZone?: string;
}

export interface ANetAgentTaskTokenUsageParams extends ANetAgentSessionTarget {}

export interface ANetAgentReadSessionParams extends ANetAgentSessionTarget {
  deliveryKind?: ANetDeliveryKind;
  messageLimit?: number;
  afterSeq?: number;
  /** 被动索引/观察者只能读取现有 runtime，禁止为了读快照拉起 session。 */
  runtimePolicy?: ANetAgentRuntimePolicy;
  /** "index" 仅供 task index：返回剥离大载荷的同结构 snapshot，禁止回写 UI 状态。 */
  contentProfile?: ANetSessionContentProfile;
}

export interface ANetAgentReadSessionMessagesParams extends ANetAgentSessionTarget {
  afterMessageId?: string;
  limit?: number;
}

export interface ANetAgentReadSessionEventsParams extends ANetAgentSessionTarget {
  afterSeq?: number;
  limit?: number;
}

export type ANetAgentReadWorkspacePresentationParams = ANetAgentWorkspaceTarget;

export interface ANetAgentGrantWorkspaceHookTrustParams extends ANetAgentWorkspaceTarget {
  bundleDigest: string;
  hookDeclarationDigest: string;
}

export interface ANetAgentSendPromptParamsBase extends ANetAgentSessionTarget {
  modelSelection?: ModelSelection;
  modelExecution?: import("@anet/shared/anet-protocol-v4").CommandPayloadMap["sendText"]["modelExecution"];
  inputId?: string;
  queryId?: string;
  messageId?: string;
  sessionTraceId?: TraceId;
  content: string;
  attachments?: Record<string, unknown>[];
  /** provider-only 的当前 IAB 状态；UI/session persistence 仍使用 content 原文。 */
  browserAmbientContext?: ANetBrowserAmbientContext;
  clientMode?: ANetTaskClientMode;
  expectedRevision?: number;
  expectedProviderRevision?: string;
  runtimeProviderHeaders?: Record<string, string>;
  toolDenylist?: string[];
  /** Bot 来源 turn 的稳定回推地址；只在当前 turn 内供 CronCreate 读取。 */
  botDeliveryTarget?: ANetAutomationBotDeliveryTarget;
}

export type ANetAgentSendPromptParams = ANetAgentSendPromptParamsBase &
  ANetBackgroundTurnAttribution;

export interface ANetAgentCompactParams extends ANetAgentSessionTarget {
  inputId?: string;
  instructions?: string;
  expectedRevision?: number;
}

export interface ANetAgentGoalParams extends ANetAgentSessionTarget {
  inputId?: string;
  action: ANetSessionGoalAction;
  objective?: string;
  expectedRevision?: number;
}

export interface ANetAgentSetModelParams extends ANetAgentSessionTarget {
  model: ModelSelection;
  expectedRevision?: number;
  persistAsWorkspaceLastUsed?: boolean;
}

export interface ANetAgentSetThoughtLevelParams extends ANetAgentSessionTarget {
  thoughtLevel?: string;
  expectedRevision?: number;
  persistAsWorkspaceLastUsed?: boolean;
}

export interface ANetAgentSetModeParams extends ANetAgentSessionTarget {
  mode: ANetSessionMode;
  expectedRevision?: number;
}

export interface ANetAgentGenerateWorkspaceTextParams extends ANetAgentWorkspaceTarget {
  selection: ANetWorkspaceGenerateTextParams["selection"];
  prompt?: string;
  messages?: ANetWorkspaceGenerateTextParams["messages"];
  tools?: ANetWorkspaceGenerateTextParams["tools"];
  querySource: string;
  maxOutputTokens?: number;
  signal?: AbortSignal;
  /**
   * 协议层 RPC 超时。thinking 模型的长请求会超过协议 client 默认的
   * 3 分钟；调用方必须把自身 deadline 透传到这里，否则默认超时先触发、
   * 还会被 onRequestTimeout 误判 stale 杀进程。
   */
  requestTimeoutMs?: number;
}

export interface ANetAgentTestModelConnectivityParams extends ANetAgentWorkspaceTarget {
  selection: ANetProviderTestModelConnectivityParams["selection"];
  signal?: AbortSignal;
}

// 合并时曾混用 Agent 完整鉴权响应；UI 只能回传请求校验，账号鉴权必须由 Host 合成。
export type ProviderRuntimeHeadersUiResponse =
  | { headersApplied: true; runtimeProviderHeaders: Record<string, string>; errorMessage?: string }
  | { headersApplied: false; errorMessage?: string };

export interface ANetAgentRespondProviderRuntimeHeadersParams extends ANetAgentSessionTarget {
  requestId: string;
  response: ProviderRuntimeHeadersUiResponse;
}

export interface ANetAgentSessionRuntimePreferencesRequest extends ANetSessionRequestRuntimePreferencesParams {
  requestId: string;
}

export interface ANetAgentRespondSessionRuntimePreferencesParams {
  requestId: string;
  resolution:
    | { status: "resolved"; preferences: ANetSessionRuntimePreferencesResult }
    | { status: "failed"; message: string };
}

export interface ANetAgentSessionSubscribeParams extends ANetAgentSessionTarget {
  deliveryKind: ANetDeliveryKind;
  afterSeq?: number;
  includeSnapshot?: boolean;
  eventCoalescing?: {
    mode: "background-summary";
    intervalMs?: number;
  };
}

// ── v4 conversation 通道（竖切）──
// host 只做转发：subscribe/unsubscribe/command 透传给 CLI v4 gateway，
// v4/conversation/frame 通知按 workspace fan-out 给 renderer。

export interface ANetAgentConversationSubscribeParams extends ANetAgentSessionTarget {
  retryInitialization?: string;
  /** 水位不变量：仅当客户端真持有该时刻一致状态才允许带。 */
  base?: { logEpoch: string; seq: number };
  visibility?: "foreground" | "background";
}

export interface ANetAgentConversationUnsubscribeParams extends ANetAgentWorkspaceTarget {
  subscriptionId: string;
  runtimePolicy?: ANetAgentRuntimePolicy;
}

export interface ANetAgentConversationResyncParams extends ANetAgentWorkspaceTarget {
  subscriptionId: string;
  base: { logEpoch: string; seq: number } | null;
  forceSnapshot?: boolean;
  runtimePolicy?: ANetAgentRuntimePolicy;
}

/** 行分页 query（rows/range）：按游标向上取一窗历史行。 */
export interface ANetAgentConversationRowsRangeParams extends ANetAgentSessionTarget {
  /** 取 rowId < beforeRowId 的行；缺省 = 从当前尾部向前。 */
  beforeRowId?: number;
  /** 1..rowsRangeMaxLimit（200）。 */
  limit: number;
  /**
   * 手机预加载：只读热会话。工作区 CLI 未运行、执行端不支持、会话不在内存都报
   * proto.sessionNotResident，不拉起进程、不冷恢复。
   */
  residency?: "resident-only";
}

/** 当前有效分支里的终态 ExitPlanMode 目录。 */
export type ANetAgentConversationPlansParams = ANetAgentSessionTarget;

/** 手机远控输入预测（ghost hint）；线格式见 docs/web-remote-control/mobile-input-prediction.md。 */
export interface ANetAgentConversationInputPredictionParams extends ANetAgentSessionTarget {
  /** 手机当前看到的会话 revision；参与 CLI 侧缓存键，回包据此丢弃过期结果。 */
  revision: number;
  /** 当前草稿；缺省/空 = 预测下一条输入，非空 = 续写草稿。 */
  draft?: string;
  /** 手机侧请求 id，原样回声，用于丢弃过期回包。 */
  requestId?: string;
}

/** workflow run 的事件日志分页（详情页审计面）；cursor = journal sequence。 */
export interface ANetAgentConversationWorkflowRunEventsParams extends ANetAgentSessionTarget {
  runId: string;
  afterSequence?: number;
  limit?: number;
}

/** dwf run 的枚举（重启后的发现查询）。 */
export interface ANetAgentConversationWorkflowRunsParams extends ANetAgentSessionTarget {
  limit?: number;
}

// ── dwf 用户面产物──
// ⚠ 术语：artifact = 脚本经 `artifact.*` 发布给**用户**看的产出（文件 / markdown / 预置看板），
// 不是 run 的顶层返回值（引擎内部对后者的同名叫法）。

/** 产物清单；UI 冷恢复与中枢详情的 durable 读法。 */
export interface ANetAgentConversationWorkflowRunArtifactsParams extends ANetAgentSessionTarget {
  runId: string;
}

/** 预置看板的取数面；cursor = journal sequence（严格大于）。 */
export interface ANetAgentConversationWorkflowRunArtifactDataParams extends ANetAgentSessionTarget {
  runId: string;
  artifactId: string;
  afterSequence?: number;
  limit?: number;
}

/** 内容产物的字节，一次一块（≤ 512 KiB，形状逐字照 attachmentRead）。 */
export interface ANetAgentConversationWorkflowRunArtifactReadParams extends ANetAgentSessionTarget {
  runId: string;
  artifactId: string;
  version: number;
  offset: number;
  limit: number;
}

// ── dwf 工作区 transcript──
/** 轻行清单：一个 run 的 files.* / git.* / world.run 行，不带正文。 */
export interface ANetAgentConversationWorkflowRunWorkspaceParams extends ANetAgentSessionTarget {
  runId: string;
}

/** 一个工作区节点的正文，按 maxBytes 保形有界化（缺省与上限在 CLI 网关侧）。 */
export interface ANetAgentConversationWorkflowRunNodeResultParams extends ANetAgentSessionTarget {
  runId: string;
  siteId: string;
  ordinal: number;
  maxBytes?: number;
}

export interface ANetAgentBackgroundBashOutputParams extends ANetAgentSessionTarget {
  workId: string;
}

export interface ANetAgentConversationFileChangesParams extends ANetAgentSessionTarget {
  target: ConversationRowTarget;
  baseRevision: number;
  baseLogEpoch: string;
}

export interface ANetAgentConversationFileRewindPreviewParams extends ANetAgentSessionTarget {
  target: ConversationRowTarget;
  baseRevision: number;
  baseLogEpoch: string;
}

export interface ANetAgentConversationCommandParams extends ANetAgentWorkspaceTarget {
  /** 仅 Host 消费；显式 NULL 表示全局任务，不向 CLI 发送项目概念。 */
  projectId?: string | null;
  envelope: CommandEnvelope;
  /** 仅 host 内部用于 Browser Use runtime 边界，不进入 v4 wire envelope。 */
  clientMode?: ANetTaskClientMode;
}

export interface ANetAgentCommandsQueryParams extends ANetAgentWorkspaceTarget {
  clock?: true;
  commands: CommandKey[];
}

/** UI 不携带 connectionId；connection scope 以 trusted carrier 注入 wire identity。 */
export interface ANetAgentAttachmentBeginParams extends ANetAgentSessionTarget {
  uploadId: string;
  fileName: string;
  mime: string;
  totalBytes: number;
  totalChunks: number;
  checksum: string;
}

export interface ANetAgentAttachmentChunkParams extends ANetAgentSessionTarget {
  uploadId: string;
  chunkIndex: number;
  dataBase64: string;
}

export interface ANetAgentAttachmentTerminalParams extends ANetAgentSessionTarget {
  uploadId: string;
}

export interface ANetAgentAttachmentReadParams extends ANetAgentSessionTarget {
  ref: string;
  target?: ConversationRowTarget;
  attachmentIndex?: number;
  offset: number;
  limit: number;
}

export interface ANetAgentConversationAttachmentReadParams extends ANetAgentSessionTarget {
  ref: string;
  target: ConversationRowTarget;
  attachmentIndex: number;
  offset: number;
  limit: number;
}

export interface ANetAgentConversationAttachmentStatParams extends ANetAgentSessionTarget {
  ref: string;
  target: ConversationRowTarget;
  attachmentIndex: number;
}

export interface ANetAgentAttachmentPreviewSourceParams extends ANetAgentSessionTarget {
  ref: string;
  target?: ConversationRowTarget;
  attachmentIndex?: number;
}

/** host scope 内部 transport 控制面；connectionId 只能经 trusted carrier 注入。 */
export interface ANetAgentConnectionFlowParams extends ANetAgentWorkspaceTarget {
  state: V4ConnectionFlowState;
}

/** sessions-index：workspace 级列表订阅（无 sessionId 维度）。 */
export interface ANetAgentSessionsIndexSubscribeParams extends ANetAgentWorkspaceTarget {
  base?: { logEpoch: string; seq: number };
  visibility?: "foreground" | "background";
  /**
   * 订阅者作用域后缀：CLI 侧重订阅替换按 (connectionId, topic) 判定，
   * host 进程内多个独立消费者（renderer 侧栏 / task-index syncer）订阅同一 topic 时
   * 必须用不同 connectionId，否则互相替换对方的订阅代际。缺省共享 host 连接 id。
   */
  subscriberScope?: string;
  /**
   * task-list 等被动观察者必须使用 existing-only；runtime 不存在时返回稳定 unavailable，
   * 禁止为了建立列表订阅而启动 Agent。缺省保持显式会话入口的旧行为。
   */
  runtimePolicy?: ANetAgentRuntimePolicy;
}

/** workspace-config：workspace 级配置目录订阅（config options + slash 目录）。 */
export interface ANetAgentWorkspaceConfigSubscribeParams extends ANetAgentWorkspaceTarget {
  base?: { logEpoch: string; seq: number };
  visibility?: "foreground" | "background";
  subscriberScope?: string;
  runtimePolicy?: ANetAgentRuntimePolicy;
}

/** Host 为 App 应答方绑定的本次配置；不扩展 Agent wire 协议。 */
export type ANetAgentProviderRuntimeHeadersRequest = ANetProviderRuntimeHeadersRequestParams & {
  requestVerificationConfig?: RequestVerificationConfig;
};

export type ANetAgentServiceEvent =
  | { type: "session.event"; event: ANetSessionEvent }
  | { type: "state.updated"; notification: ANetStateUpdatedNotification }
  | { type: "permission.request"; request: ANetPermissionRequestParams }
  | { type: "userInput.request"; request: ANetUserInputRequestParams }
  | {
      type: "userInput.response";
      requestId: string;
      response: ANetUserInputResponse;
    }
  | { type: "providerRuntimeHeaders.request"; request: ANetAgentProviderRuntimeHeadersRequest }
  | { type: "snapshot"; snapshot: ANetSessionStateSnapshot };

export interface ANetAgentAppRuntimePreferences {
  askUserQuestionAutoResolutionEnabled: boolean;
  modelIoFullRetentionEnabled?: boolean;
}

export interface ANetAgentLocalRuntimeChildProcesses {
  pid: number;
  provider: string;
  workspacePath: string;
  lane?: string;
  children: ANetProcessChildProcess[];
}

export interface ANetAgentStorageStartupSnapshot {
  generation: number;
  state: ANetStorageStartupState | null;
}

export interface IANetAgentService {
  /** 控制面不需要账号或模型，且不发送普通协议请求。 */
  prepareStorage(params: ANetAgentWorkspaceTarget): Promise<void>;
  getStorageStartupState(
    params: ANetAgentWorkspaceTarget,
  ): Promise<ANetAgentStorageStartupSnapshot | null>;
  onDynamicStorageStartupState(
    params: ANetAgentWorkspaceTarget,
  ): Event<ANetAgentStorageStartupSnapshot>;
  initialize(params: ANetAgentWorkspaceTarget): Promise<ANetAgentInitializeResult>;
  /**
   * 同步 App 全局运行时偏好到所有已活动 workspace；不得为此启动空闲 Agent。
   */
  syncAppRuntimePreferences(preferences: ANetAgentAppRuntimePreferences): Promise<void>;
  /**
   * 动态工作流用户选择变化的信号（docs/dynamic-workflow/launch.md「The user's choice」）：Host 重新计算
   * 生效模式并串行重发 workspace/updateDynamicWorkflowPolicy。有本机设置权威的 Host 以设置文件为准；
   * desktop-attached remote Host 以传入值为准（缺席 = 跟随服务端）。不得为此启动空闲 Agent。
   */
  syncDynamicWorkflowUserMode(params: { mode?: DynamicWorkflowMode }): Promise<void>;
  getWorkspaceRuntimeIdentity(
    params: ANetAgentWorkspaceTarget,
  ): Promise<ANetAgentWorkspaceRuntimeIdentity>;
  createSession(params: ANetAgentCreateSessionParams): Promise<ANetSessionStateSnapshot>;
  resumeSession(params: ANetAgentResumeSessionParams): Promise<ANetSessionStateSnapshot>;
  listSessions(params: ANetAgentListSessionsParams): Promise<ANetSessionInfo[]>;
  listSessionSubagents(
    params: ANetAgentListSessionSubagentsParams,
  ): Promise<ANetSessionSubagentsResult>;
  getAppUsageStats(params: ANetAgentAppUsageParams): Promise<AppUsageSnapshot>;
  /** 项目数据删除前的测量：只读，用本机已有 runtime 或管理面进程，不为某个项目拉起 Agent。 */
  measureSessionData?(params: V4SessionDataParams): Promise<V4SessionDataMeasureResult>;
  /**
   * 彻底删除会话与目录记忆。workspace 已有 Agent 进程时交给它（它持有会话运行态，能判断运行中
   * 并释放已加载会话）；否则交给管理面进程。只用于本机。
   */
  purgeSessionData?(
    params: V4SessionDataParams & { workspace: ANetAgentWorkspaceTarget },
  ): Promise<V4SessionDataPurgeResult>;
  getTaskTokenUsage(params: ANetAgentTaskTokenUsageParams): Promise<ANetTaskTokenUsageResult>;
  readSession(params: ANetAgentReadSessionParams): Promise<ANetSessionStateSnapshot>;
  readSessionMessages(params: ANetAgentReadSessionMessagesParams): Promise<ANetMessageWithParts[]>;
  readSessionDebug(params: ANetAgentSessionTarget): Promise<SessionDebugSnapshot>;
  readSessionEvents(params: ANetAgentReadSessionEventsParams): Promise<ANetSessionEvent[]>;
  readWorkspacePresentation(
    params: ANetAgentReadWorkspacePresentationParams,
  ): Promise<ANetWorkspacePresentation>;
  /** 无 task/session 的 Settings 预信任；Agent 会重新发现并校验 canonical snapshot。 */
  grantWorkspaceHookTrust(
    params: ANetAgentGrantWorkspaceHookTrustParams,
  ): Promise<ANetWorkspaceHookTrustGrantResult>;
  setWorkspaceMcpTrust(params: WorkspaceMcpTrustDecision): Promise<ANetWorkspaceMcpTrustResult>;
  listMcpServerStatuses(params: ANetAgentListMcpServerStatusesParams): Promise<ANetMcpListResult>;
  listPlugins(params: ANetAgentPluginViewParams): Promise<ANetPluginsListResult>;
  /**
   * Plugin 对话引用 catalog：session-scoped 只读投影。
   * 走 workspace 级 agent client（session 记录只存在于该进程），不走独立插件管理进程。
   */
  getPluginReferenceCatalog(
    params: ANetAgentPluginReferenceCatalogParams,
  ): Promise<ANetPluginsReferenceCatalogResult>;
  /** Composer Skill 引用 catalog；带 sessionId 时读取该 runtime 的冻结快照。 */
  getSkillReferenceCatalog(
    params: ANetAgentSkillReferenceCatalogParams,
  ): Promise<ANetSkillsReferenceCatalogResult>;
  /** 插件 UI：读取插件 MCP 的 `ui://` 资源；走 session 所在 workspace agent 进程。 */
  openMcpUiInstance(
    params: import("../plugin-ui-bridge/contract.js").PluginUiPrepareSandboxParams & {
      accountContext?: string;
    },
  ): Promise<import("@anet/shared/mcp-apps").McpAppInstance>;
  validateMcpUiInstance(
    params: import("../plugin-ui-bridge/contract.js").PluginUiPluginScope,
  ): Promise<void>;
  recycleMcpUiInstance(
    params: import("../plugin-ui-bridge/contract.js").PluginUiPluginScope,
  ): Promise<boolean>;
  closeMcpUiInstance(
    params: import("../plugin-ui-bridge/contract.js").PluginUiPluginScope,
  ): Promise<void>;
  readMcpResource(params: ANetAgentReadMcpResourceParams): Promise<ANetMcpReadResourceResult>;
  /** 插件 UI：UI 发起的工具调用；复用既有权限审批，不产生 transcript row。 */
  sampleMcpApp(
    params: import("../plugin-ui-bridge/samplingContract.js").PluginUiSamplingParams,
  ): Promise<import("@anet/shared/mcp-apps").McpAppsSamplingResult>;
  cancelMcpAppSampling(
    params: import("../plugin-ui-bridge/samplingContract.js").PluginUiCancelSamplingParams,
  ): Promise<{ cancelled: boolean }>;
  callMcpToolForUi(params: ANetAgentCallMcpToolForUiParams): Promise<ANetMcpUiCallToolResult>;
  /** 插件 UI 取消带 callId 的进行中 UI 工具调用；agent 侧 abort 到 MCP client。 */
  cancelMcpToolCallForUi(
    params: ANetAgentCancelMcpToolCallForUiParams,
  ): Promise<ANetMcpUiCancelCallResult>;
  /** 插件 UI 页面发起的 `resources/read`，agent 侧限同插件服务器、8 MiB、mimeType 白名单。 */
  readMcpResourceForUi(
    params: ANetAgentReadMcpResourceForUiParams,
  ): Promise<ANetMcpUiReadResourceResult>;
  /** 插件 UI 页面发起的 resources/list、resources/templates/list、subscribe、unsubscribe 代理。 */
  listMcpResourcesForUi(
    params: ANetAgentListMcpResourcesForUiParams,
  ): Promise<ANetMcpUiListResourcesResult>;
  listMcpResourceTemplatesForUi(
    params: ANetAgentListMcpResourcesForUiParams,
  ): Promise<ANetMcpUiListResourceTemplatesResult>;
  subscribeMcpResourceForUi(params: ANetAgentMcpResourceSubscriptionForUiParams): Promise<void>;
  unsubscribeMcpResourceForUi(params: ANetAgentMcpResourceSubscriptionForUiParams): Promise<void>;
  /** App-Provided Tools：页面工具登记 / 注销与模型调用的认领 / 回传（信箱投递走 v4 live 增量）。 */
  registerAppToolsForUi(
    params: ANetAgentRegisterAppToolsForUiParams,
  ): Promise<ANetMcpUiRegisterAppToolsResult>;
  unregisterAppToolsForUi(
    params: ANetAgentAppToolInstanceForUiParams,
  ): Promise<ANetMcpUiUnregisterAppToolsResult>;
  claimAppToolCallForUi(
    params: ANetAgentAppToolCallForUiParams,
  ): Promise<ANetMcpUiAppToolAcceptedResult>;
  resolveAppToolCallForUi(
    params: ANetAgentResolveAppToolCallForUiParams,
  ): Promise<ANetMcpUiAppToolAcceptedResult>;
  /** 插件 UI 工作区级面板入口（已启用插件清单 `ui.surfaces[]`）。 */
  listPluginUiSurfaces(params: ANetAgentWorkspaceTarget): Promise<ANetPluginsListUiSurfacesResult>;
  // 已保存工作流的 GUI 中枢：workspace 级、无会话，每次调用现扫 `<cwd>/.anet-one/workflows/`。
  // 全局档传 `scope: "global"`：带 workspace 就用它当载体，不带则由 services 层自选本机载体运行时。
  listSavedWorkflows(params: ANetAgentListSavedWorkflowsParams): Promise<ANetWorkflowsListResult>;
  getSavedWorkflow(params: ANetAgentGetSavedWorkflowParams): Promise<ANetWorkflowsGetResult>;
  updateSavedWorkflowMeta(
    params: ANetAgentUpdateSavedWorkflowMetaParams,
  ): Promise<ANetWorkflowsUpdateMetaResult>;
  deleteSavedWorkflow(
    params: ANetAgentDeleteSavedWorkflowParams,
  ): Promise<ANetWorkflowsDeleteResult>;
  listSavedWorkflowRuns(
    params: ANetAgentListSavedWorkflowRunsParams,
  ): Promise<ANetWorkflowsRunsResult>;
  // 在项目档 / 全局档之间移动同名文件：
  // `workspace` 是载体（移到项目传目标项目、移到全局传源项目），`to` 是落点档；不覆盖已存在的目标。
  moveSavedWorkflow(params: ANetAgentMoveSavedWorkflowParams): Promise<ANetWorkflowsMoveResult>;
  // 完成卡的「直接保存」（docs/dynamic-workflow/transcript-and-notifications.md）：按 runId 从
  // journal 取这次 run 实际跑过的脚本落盘，不经模型回合。两者都必带 workspace（journal 在那里）。
  saveSavedWorkflowFromRun(
    params: ANetAgentSaveSavedWorkflowFromRunParams,
  ): Promise<ANetWorkflowsSaveResult>;
  /** 这次 run 对应哪个已保存工作流（推导，不记忆）；顺带回 run 的实参供「再次运行」预填。 */
  findSavedWorkflowForRun(
    params: ANetAgentFindSavedWorkflowForRunParams,
  ): Promise<ANetWorkflowsForRunResult>;
  resolveSuggestedPluginReference(
    params: ANetAgentResolveSuggestedPluginReferenceParams,
  ): Promise<import("@anet/shared").ANetPluginsResolveSuggestedReferenceResult>;
  /** 推荐项 Plugin 首次本地检查缺失后的 operation-scoped 刷新进度。 */
  onDynamicPluginOperationProgress(
    operationId: string,
  ): Event<ANetPluginOperationProgressNotification>;
  getPluginsOverview(params: ANetAgentPluginViewParams): Promise<ANetPluginsOverviewResult>;
  /**
   * 资源管理器：枚举本 Host 内全部本地 Agent 进程（含 plugin / mcp-status 泳道），
   * 并向每个存活 runtime 请求 `process/childProcesses`；单个 runtime 失败只让它的 children 为空。
   */
  collectLocalRuntimeChildProcesses(
    signal?: AbortSignal,
  ): Promise<ANetAgentLocalRuntimeChildProcesses[]>;
  addPluginMarketplace(
    params: ANetAgentAddPluginMarketplaceParams,
  ): Promise<ANetPluginsMarketplaceMutationResult>;
  removePluginMarketplace(
    params: ANetAgentRemovePluginMarketplaceParams,
  ): Promise<ANetPluginsMarketplaceMutationResult>;
  updatePluginMarketplace(
    params: ANetAgentUpdatePluginMarketplaceParams,
  ): Promise<ANetPluginsMarketplaceMutationResult>;
  installPlugin(params: ANetAgentInstallPluginParams): Promise<ANetPluginsInstallResult>;
  cancelPluginOperation(
    params: ANetAgentCancelPluginOperationParams,
  ): Promise<ANetPluginsCancelOperationResult>;
  uninstallPlugin(params: ANetAgentUninstallPluginParams): Promise<ANetPluginsUninstallResult>;
  updatePlugin(params: ANetAgentUpdatePluginParams): Promise<ANetPluginsInstallResult>;
  restoreBuiltinPlugin(
    params: ANetAgentRestoreBuiltinPluginParams,
  ): Promise<ANetPluginsRestoreBuiltinResult>;
  configurePlugin(params: ANetAgentConfigurePluginParams): Promise<ANetPluginsConfigureResult>;
  resetPluginConfig(params: ANetAgentResetPluginConfigParams): Promise<ANetPluginsConfigureResult>;
  validatePlugin(params: ANetAgentValidatePluginParams): Promise<ANetPluginsValidateResult>;
  describePlugin(params: ANetAgentDescribePluginParams): Promise<ANetPluginsDescribeResult>;
  setPluginEnabled(params: ANetAgentSetPluginEnabledParams): Promise<ANetPluginsSetEnabledResult>;
  // ---- 定时任务(automation)管理 ----
  listAutomations(params: ANetAgentWorkspaceTarget): Promise<ANetAutomation[]>;
  listAllAutomations(): Promise<ANetAutomation[]>;
  createAutomation(params: ANetAgentCreateAutomationParams): Promise<ANetAutomation>;
  updateAutomation(params: ANetAgentUpdateAutomationParams): Promise<ANetAutomation | null>;
  deleteAutomation(params: ANetAgentAutomationIdParams): Promise<void>;
  setAutomationEnabled(params: ANetAgentSetAutomationEnabledParams): Promise<void>;
  restartAutomation(params: ANetAgentAutomationIdParams): Promise<void>;
  runAutomationNow(params: ANetAgentAutomationIdParams): Promise<ANetAgentRunAutomationNowResult>;
  listAutomationRuns(params: ANetAgentAutomationIdParams): Promise<ANetAutomationRun[]>;
  deleteAutomationRun(params: ANetAgentDeleteAutomationRunParams): Promise<void>;
  generateWorkspaceText(
    params: ANetAgentGenerateWorkspaceTextParams,
  ): Promise<ANetWorkspaceGenerateTextResult>;
  testModelConnectivity(
    params: ANetAgentTestModelConnectivityParams,
  ): Promise<ANetProviderTestModelConnectivityResult>;
  /**
   * @deprecated：send 主路径已收敛 v4 sendText 命令。仅剩两个消费点——
   * adapter 带附件输入回退（待附件命令面落地后移除）与 anetSessionService
   * pass-through；新代码禁止回用。
   */
  sendPrompt(params: ANetAgentSendPromptParams): Promise<ANetSessionSendResult>;
  compactSession(params: ANetAgentCompactParams): Promise<ANetSessionCompactResult>;
  goalSession(params: ANetAgentGoalParams): Promise<ANetSessionGoalResult>;
  closeSession(
    params: ANetAgentSessionTarget & { expectedPersistence?: "deferred" | "immediate" },
  ): Promise<boolean>;
  setModel(params: ANetAgentSetModelParams): Promise<ANetSessionStateSnapshot>;
  setThoughtLevel(params: ANetAgentSetThoughtLevelParams): Promise<ANetSessionStateSnapshot>;
  setMode(params: ANetAgentSetModeParams): Promise<ANetSessionStateSnapshot>;
  respondProviderRuntimeHeaders(
    params: ANetAgentRespondProviderRuntimeHeadersParams,
  ): Promise<void>;
  respondSessionRuntimePreferences(
    params: ANetAgentRespondSessionRuntimePreferencesParams,
  ): Promise<void>;
  /**
   * v4 UI 的 Start Plan runtime-auth bridge 只需要本地 pending request 事件，
   * 不能为此额外打开旧 `session/subscribe`，否则会把旧 replay/continuous 读路径
   * 重新带回 v4 pane。
   */
  onDynamicProviderRuntimeHeadersRequest(
    params: ANetAgentSessionTarget,
  ): Event<ANetAgentProviderRuntimeHeadersRequest>;
  /**
   * Start Plan runtime headers 的 workspace 级订阅入口（生产应答方使用）。
   * Bug 原因（2026-08-16 web 远控卡死）：session 级入口只随桌面 pane 挂载订阅，
   * web 远控新建会话在桌面没有 pane、web 端无应答方，请求校验请求滞留 pending，
   * 任务永久「工作中」。桌面窗口用本入口为每个打开的 workspace tab 维持常驻应答方；
   * 订阅时先注册 live listener 再按 workspaceKey 前缀补投 pending，与 session 级同语义。
   */
  onDynamicWorkspaceProviderRuntimeHeadersRequest(
    params: ANetAgentWorkspaceTarget,
  ): Event<ANetAgentProviderRuntimeHeadersRequest>;
  /** 只投递本 workspace 的校验取消，不属于 conversation stream。 */
  onDynamicWorkspaceProviderRuntimeHeadersCancelled(
    params: ANetAgentWorkspaceTarget,
  ): Event<ANetProviderRuntimeHeadersCancelled>;
  onDynamicSessionRuntimePreferencesRequest(): Event<ANetAgentSessionRuntimePreferencesRequest>;
  /**
   * CLI 进程级资源样本，带 services 打的 lane 标签（CLI 自己不知道 lane）。
   * 使用 dynamic event 避免 RPC 服务在无人订阅时缓冲周期事件；
   * 该事件不属于 session/conversation continuous 或 replayable 状态。
   */
  onDynamicProcessResourceSample(): Event<AgentLaneResourceSample>;
  /** MCP 进程生命周期与低频内存事件，仅供可信 Host relay 上报 ARMS。 */
  /** 仅 trusted Host relay 订阅；手机统计不依赖 renderer 生命周期。 */
  onDynamicRemoteConversationTelemetry(): Event<RemoteConversationTelemetryEvent>;

  onDynamicMcpTelemetry(): Event<ANetMcpTelemetryEvent>;
  /** MCP 进程树资源事实，只供可信 Host 汇总上报。 */
  onDynamicMcpResourceSamples(): Event<ANetMcpResourceSample[]>;
  /** Bash 完成事实，仅可信 Host 资源旁路订阅。 */
  onDynamicToolExecResource(): Event<ANetToolExecResource>;
  /**
   * @deprecated 旧协议订阅面（session/subscribe + session/event + state.updated）。
   * task-index syncer 已迁 v4 sessions-index/workspace-config 帧；
   * 仅剩 anetTaskServiceAdapter.onDynamicTaskEvent（replayable 读路径）消费。
   * 写路径已收敛 v4 命令面；本订阅是读路径投影源。
   */
  onDynamicSessionEvent(params: ANetAgentSessionSubscribeParams): Event<ANetAgentServiceEvent>;
  // ── v4 conversation 通道（竖切）──
  /** RPC attachment 建立后先读取 host 可信 hello。 */
  helloConversationV4(): Promise<HelloMessage>;
  /** hello 校验后回送 clientHello；metadata 不能覆盖 connection mode/profile。 */
  initializeConversationV4(clientHello: ClientHello): Promise<void>;
  /** 仅供 trusted host relay/facade；terminal RPC caller 必须被 connection scope 拒绝。 */
  setConnectionFlowStateV4(params: ANetAgentConnectionFlowParams): Promise<void>;
  subscribeConversationV4(
    params: ANetAgentConversationSubscribeParams,
  ): Promise<V4ConversationSubscribeResult>;
  resyncConversationV4(
    params: ANetAgentConversationResyncParams,
  ): Promise<V4ConversationResyncResult>;
  unsubscribeConversationV4(params: ANetAgentConversationUnsubscribeParams): Promise<void>;
  /** rows/range 行分页 query（loadOlder 游标向上补历史）。 */
  conversationRowsRangeV4(
    params: ANetAgentConversationRowsRangeParams,
  ): Promise<V4ConversationRowsRangeResult>;
  conversationPlansV4(params: ANetAgentConversationPlansParams): Promise<V4ConversationPlansResult>;
  /** 输入预测：只读、无状态；Host 开关关闭 / 无运行时 / 失败一律回空结果，不抛错。 */
  conversationInputPredictionV4(
    params: ANetAgentConversationInputPredictionParams,
  ): Promise<V4ConversationInputPredictionResult>;
  /** workflow run 事件日志分页；与 plans 同族（只读、无状态、超时重发安全）。 */
  conversationWorkflowRunEventsV4(
    params: ANetAgentConversationWorkflowRunEventsParams,
  ): Promise<V4ConversationWorkflowRunEventsResult>;
  /** workflow run 枚举；journal-backed 的重启后发现面。 */
  conversationWorkflowRunsV4(
    params: ANetAgentConversationWorkflowRunsParams,
  ): Promise<V4ConversationWorkflowRunsResult>;
  /** workflow run 的用户面产物清单；与 plans 同族（只读、无状态、超时重发安全）。 */
  conversationWorkflowRunArtifactsV4(
    params: ANetAgentConversationWorkflowRunArtifactsParams,
  ): Promise<V4ConversationWorkflowRunArtifactsResult>;
  /** 预置看板的条目分页；hook 以 itemCount 变化为信号增量拉取。 */
  conversationWorkflowRunArtifactDataV4(
    params: ANetAgentConversationWorkflowRunArtifactDataParams,
  ): Promise<V4ConversationWorkflowRunArtifactDataResult>;
  /** 内容产物的字节，一次一块；授权在 CLI 侧（journal 行才是取字节的依据）。 */
  conversationWorkflowRunArtifactReadV4(
    params: ANetAgentConversationWorkflowRunArtifactReadParams,
  ): Promise<V4ConversationWorkflowRunArtifactReadResult>;
  /** dwf 工作区 transcript 的清单。 */
  conversationWorkflowRunWorkspaceV4(
    params: ANetAgentConversationWorkflowRunWorkspaceParams,
  ): Promise<V4ConversationWorkflowRunWorkspaceResult>;
  /** 一个工作区节点的有界正文。 */
  conversationWorkflowRunNodeResultV4(
    params: ANetAgentConversationWorkflowRunNodeResultParams,
  ): Promise<V4ConversationWorkflowRunNodeResultResult>;
  backgroundBashOutputV4(
    params: ANetAgentBackgroundBashOutputParams,
  ): Promise<BackgroundBashOutputResult>;
  conversationFileChangesV4(
    params: ANetAgentConversationFileChangesParams,
  ): Promise<V4ConversationFileChangesResult>;
  conversationFileRewindPreviewV4(
    params: ANetAgentConversationFileRewindPreviewParams,
  ): Promise<V4ConversationFileRewindPreviewResult>;
  sendConversationCommandV4(params: ANetAgentConversationCommandParams): Promise<CommandAck>;
  queryConversationCommandsV4(params: ANetAgentCommandsQueryParams): Promise<CommandsQueryResult>;
  attachmentBeginV4(params: ANetAgentAttachmentBeginParams): Promise<V4AttachmentBeginResult>;
  attachmentChunkV4(params: ANetAgentAttachmentChunkParams): Promise<V4AttachmentChunkResult>;
  attachmentCommitV4(params: ANetAgentAttachmentTerminalParams): Promise<V4AttachmentCommitResult>;
  attachmentAbortV4(params: ANetAgentAttachmentTerminalParams): Promise<void>;
  /** Desktop local 已发送视频 source query；远端与 Web 返回 chunked。 */
  attachmentPreviewSourceV4(
    params: ANetAgentAttachmentPreviewSourceParams,
  ): Promise<V4AttachmentPreviewSourceResult>;
  /** 已发送 image/video 只读分块查询；connection scope 注入可信 workspace 连接。 */
  attachmentReadV4(params: ANetAgentAttachmentReadParams): Promise<V4AttachmentReadResult>;
  /** Share 读取 userInput 附件，允许 text/plain 等非媒体类型。 */
  conversationAttachmentReadV4(
    params: ANetAgentConversationAttachmentReadParams,
  ): Promise<V4ConversationAttachmentReadResult>;
  /** Share 选择阶段只读 userInput 附件元数据，不读取完整内容。 */
  conversationAttachmentStatV4(
    params: ANetAgentConversationAttachmentStatParams,
  ): Promise<V4ConversationAttachmentStatResult>;
  getSessionLifecycle(
    params: ANetAgentSessionTarget,
  ): Promise<import("@anet/shared").SessionLifecycleSnapshot | null>;
  ensureSessionReady(params: ANetAgentSessionTarget): Promise<void>;
  stopSessionRuntime(params: ANetAgentSessionTarget): Promise<void>;
  restartSessionRuntime(params: ANetAgentSessionTarget): Promise<void>;
  /** 独立于可被释放的 conversation publisher 的生命周期事实。 */
  onDynamicSessionLifecycle(
    params: ANetAgentWorkspaceTarget,
  ): Event<import("@anet/shared").SessionLifecycleSnapshot>;
  /** workspace 级下行帧流（v4/conversation/frame），renderer 侧按 topic 自行路由。 */
  onDynamicConversationFrame(
    params: ANetAgentWorkspaceTarget,
  ): Event<ConversationTopicWireCandidate>;
  /** workspace 级 live telemetry 事实；connection facade 仅向可信 desktop-continuous 下游暴露。 */
  onDynamicLocalTtftFacts(
    params: ANetAgentWorkspaceTarget,
  ): Event<import("@anet/shared").LocalTtftFacts>;
  onDynamicConversationTelemetryFact(
    params: ANetAgentWorkspaceTarget,
  ): Event<ConversationTelemetryFact>;
  /** Host 消费驻留 CLI 的闲时生命周期；不参与聊天快照恢复。 */
  onDynamicOffPeakLifecycle(
    params: ANetAgentWorkspaceTarget,
  ): Event<import("@anet/shared").OffPeakLifecycleNotification>;
  controlOffPeakExecutionV4(
    params: ANetAgentWorkspaceTarget & { control: import("@anet/shared").OffPeakControlParams },
  ): Promise<import("@anet/shared").OffPeakControlResult>;
  /** 当前窗口全部本地 live task 的 CUA 权限观察；历史、远程与 replayable 不在此事件面。 */
  onDynamicCuaPermissionObservation(): Event<ANetAgentCuaPermissionObservation>;
  /** 本地桌面窗口创建插件页面，不依赖 conversation 订阅。 */
  onDynamicPluginUiToolResult(): Event<
    PluginUiToolResultNotification & { workspacePath: string; workspaceIdentity?: string }
  >;
  /** 只读 CLI 持久事实；不恢复会话运行实例。旧远端可以不提供此能力。 */
  reconcileSessionsIndexV4?(
    params: ANetAgentWorkspaceTarget & { sessionIds: string[] },
  ): Promise<SessionsIndexReconcileResult>;
  // ── M5 sessions-index 通道（列表活性）──
  subscribeSessionsIndexV4(
    params: ANetAgentSessionsIndexSubscribeParams,
  ): Promise<V4SessionsIndexSubscribeResult>;
  resyncSessionsIndexV4(
    params: ANetAgentConversationResyncParams,
  ): Promise<V4ConversationResyncResult>;
  unsubscribeSessionsIndexV4(params: ANetAgentConversationUnsubscribeParams): Promise<void>;
  /** workspace 级 sessions-index 下行帧流（与 conversation 同一通知，按 topic 前缀分流）。 */
  onDynamicSessionsIndexFrame(
    params: ANetAgentWorkspaceTarget,
  ): Event<SessionsIndexTopicWireCandidate>;
  // ── workspace-config 通道（配置目录活性；task-index syncer 消费）──
  subscribeWorkspaceConfigV4(
    params: ANetAgentWorkspaceConfigSubscribeParams,
  ): Promise<V4WorkspaceConfigSubscribeResult>;
  resyncWorkspaceConfigV4(
    params: ANetAgentConversationResyncParams,
  ): Promise<V4ConversationResyncResult>;
  unsubscribeWorkspaceConfigV4(params: ANetAgentConversationUnsubscribeParams): Promise<void>;
  /** workspace 级 workspace-config 下行帧流（与 conversation 同一通知，按 topic 前缀分流）。 */
  onDynamicWorkspaceConfigFrame(
    params: ANetAgentWorkspaceTarget,
  ): Event<WorkspaceConfigTopicWireCandidate>;
  /**
   * （CLI 重连重订）：agent 进程换代通知（超时回收/崩溃后重新拉起）。
   * v4 订阅活在 CLI 进程内存，进程换代即失效；订阅方（task-index syncer 等）
   * 收到后必须对该 workspaceKey 重发 subscribe，否则帧流静默中断。
   */
  onAgentRuntimeRestarted(listener: (event: { workspaceKey: string }) => void): IDisposable;
  /**
   * Agent client 在 service 内完成登记后发布 available，当前 client 关闭后发布 unavailable。
   * 这是被动 observer attach/detach 的唯一生命周期信号，不表达用户使用租约。
   */
  onAgentRuntimeLifecycle?: (
    listener: (event: ANetAgentRuntimeLifecycleEvent) => void,
  ) => IDisposable;
  /** 当前 desktop-local CUA turn 是否仍在执行，用于 Helper recovery 避免中途回收 Agent。 */
  hasActiveCuaOperationTurn(): boolean;
  disposeWorkspace(
    params: ANetAgentWorkspaceTarget & { releasePreparation?: boolean },
  ): Promise<void>;
  disposeAll(): void;
}

export const IANetAgentService = createServiceDescriptor<IANetAgentService>(
  ServiceChannels.ANetAgent,
);
