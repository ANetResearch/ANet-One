import { ServiceChannels } from "@anet/shared";
import type {
  TraceId,
  ANetAgentMcpServer,
  ANetDeliveryKind,
  ANetMessageWithParts,
  ModelSelection,
  ANetPermissionRequestParams,
  ANetProviderRuntimeHeadersRequestParams,
  ANetUserInputRequestParams,
  ANetUserInputResponse,
  ANetSessionInfo,
  ANetSessionImportHistory,
  ANetSessionEvent,
  ANetSessionMode,
  ANetSessionPersistence,
  ANetSessionStateSnapshot,
  ANetStateUpdatedNotification,
  ANetWorkspacePresentation,
} from "@anet/shared";
import { createServiceDescriptor } from "#src/descriptors.js";
import type { ProviderRuntimeHeadersUiResponse } from "#src/anet-agent/anetAgent.js";

export interface ANetSessionWorkspaceTarget {
  workspacePath: string;
  workspaceIdentity?: string;
  remoteSessionId?: string;
}

export type ANetSessionReadWorkspacePresentationParams = ANetSessionWorkspaceTarget;

export interface ANetTaskTarget extends ANetSessionWorkspaceTarget {
  sessionId: string;
}

export interface ANetSessionCreateParams extends ANetSessionWorkspaceTarget {
  /** 仅导入事务使用的预分配 ID；普通新会话继续由 Agent 分配。 */
  sessionId?: string;
  sessionTraceId?: TraceId;
  parentSessionId?: string;
  mode?: ANetSessionMode;
  model?: ModelSelection;
  persistence?: ANetSessionPersistence;
  thoughtLevel?: string;
  mcpServers?: ANetAgentMcpServer[];
  importedHistory?: ANetSessionImportHistory;
}

export interface ANetSessionResumeParams extends ANetTaskTarget {
  model?: ModelSelection;
  thoughtLevel?: string;
  mcpServers?: ANetAgentMcpServer[];
  /**
   * 默认广播 resume 得到的历史快照，并让 shadow 订阅请求初始 snapshot。
   * 续聊发送前的 runtime 预恢复会关闭它，避免旧终态快照覆盖本地已开始的新输入运行态。
   */
  broadcastSnapshot?: boolean;
}

export interface ANetSessionListParams extends ANetSessionWorkspaceTarget {
  limit?: number;
}

export interface ANetSessionReadParams extends ANetTaskTarget {
  deliveryKind?: ANetDeliveryKind;
  messageLimit?: number;
  afterSeq?: number;
}

export interface ANetSessionMessagesParams extends ANetTaskTarget {
  afterMessageId?: string;
  limit?: number;
}

export interface ANetSessionEventsParams extends ANetTaskTarget {
  afterSeq?: number;
  limit?: number;
}

export interface ANetSessionSetModelParams extends ANetTaskTarget {
  model: ModelSelection;
  expectedRevision?: number;
  persistAsWorkspaceLastUsed?: boolean;
}

export interface ANetSessionSetThoughtLevelParams extends ANetTaskTarget {
  thoughtLevel?: string;
  expectedRevision?: number;
  persistAsWorkspaceLastUsed?: boolean;
}

export interface ANetSessionSetModeParams extends ANetTaskTarget {
  mode: ANetSessionMode;
  expectedRevision?: number;
}

export interface ANetSessionRespondProviderRuntimeHeadersParams extends ANetTaskTarget {
  requestId: string;
  response: ProviderRuntimeHeadersUiResponse;
}

export interface ANetSessionSubscribeParams extends ANetTaskTarget {
  deliveryKind: ANetDeliveryKind;
  afterSeq?: number;
  includeSnapshot?: boolean;
  eventCoalescing?: {
    mode: "background-summary";
    intervalMs?: number;
  };
}

export type ANetSessionServiceEvent =
  | { type: "session.event"; event: ANetSessionEvent }
  | { type: "state.updated"; notification: ANetStateUpdatedNotification }
  | { type: "permission.request"; request: ANetPermissionRequestParams }
  | { type: "userInput.request"; request: ANetUserInputRequestParams }
  | {
      type: "userInput.response";
      requestId: string;
      response: ANetUserInputResponse;
    }
  | { type: "providerRuntimeHeaders.request"; request: ANetProviderRuntimeHeadersRequestParams }
  | { type: "snapshot"; snapshot: ANetSessionStateSnapshot };

export interface ANetSessionInitializeResult {
  available: boolean;
  workspaceKey: string;
  protocolName?: string;
  protocolVersion?: number;
  transportKind?: "stdio" | "websocket";
  reason?: string;
  reasonCode?: "provider_not_ready";
}

export interface ANetSessionWorkspaceRuntimeIdentity {
  generation: number;
  identity: string;
  processId?: number;
  workspaceKey: string;
}

export interface IANetSessionService {
  initializeWorkspace(params: ANetSessionWorkspaceTarget): Promise<ANetSessionInitializeResult>;
  getWorkspaceRuntimeIdentity(
    params: ANetSessionWorkspaceTarget,
  ): Promise<ANetSessionWorkspaceRuntimeIdentity>;
  readWorkspacePresentation(
    params: ANetSessionReadWorkspacePresentationParams,
  ): Promise<ANetWorkspacePresentation>;
  createSession(params: ANetSessionCreateParams): Promise<ANetSessionStateSnapshot>;
  resumeSession(params: ANetSessionResumeParams): Promise<ANetSessionStateSnapshot>;
  listSessions(params: ANetSessionListParams): Promise<ANetSessionInfo[]>;
  readSession(params: ANetSessionReadParams): Promise<ANetSessionStateSnapshot>;
  readSessionMessages(params: ANetSessionMessagesParams): Promise<ANetMessageWithParts[]>;
  readSessionEvents(params: ANetSessionEventsParams): Promise<ANetSessionEvent[]>;
  promoteDeferredDraftSession(params: ANetTaskTarget): Promise<void>;
  closeSession(params: ANetTaskTarget): Promise<void>;
  closeDeferredDraftSession(params: ANetTaskTarget): Promise<boolean>;
  setModel(params: ANetSessionSetModelParams): Promise<ANetSessionStateSnapshot>;
  setThoughtLevel(params: ANetSessionSetThoughtLevelParams): Promise<ANetSessionStateSnapshot>;
  setMode(params: ANetSessionSetModeParams): Promise<ANetSessionStateSnapshot>;
  respondProviderRuntimeHeaders(
    params: ANetSessionRespondProviderRuntimeHeadersParams,
  ): Promise<void>;
  // M5 删波次 2：onDynamicSessionEvent（旧 session/subscribe 词表的 renderer 订阅面）
  // 已删除——v4 UI 走 agentService 的 conversation/sessions-index 帧通道，
  // 该方法在 renderer 侧已无任何调用者（grep packages/ui packages/desktop 为零）。
}

export const IANetSessionService = createServiceDescriptor<IANetSessionService>(
  ServiceChannels.ANetSession,
);
