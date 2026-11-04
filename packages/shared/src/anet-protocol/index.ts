import { requestVerificationReasons } from "../request-security-edition/verification-policy.js";
import { PROVIDER_ACCOUNT_ACCESS_TYPE } from "../config-schema.js";
import { anetProtocolTraceSchema } from "./trace.js";
// Bot 反向回复的名字解析/待澄清结果与 App、CLI 使用同一严格 schema。
export { channelReplyRequestSchema, channelReplyResultSchema } from "../channel-mention.js";
export { anetProtocolTraceSchema, type ANetProtocolTrace } from "./trace.js";
import {
  databaseMigrationFactsSchema,
  databaseStartupErrorCodeSchema,
  databaseStartupErrorDetailsSchema,
} from "../database-startup.js";
import {
  MCP_APPS_APP_TOOLS_MAX_PER_INSTANCE,
  MCP_APPS_APP_TOOL_CALL_ID_MAX_CHARS,
  MCP_APPS_APP_TOOL_ERROR_MESSAGE_MAX_CHARS,
  mcpAppsAppToolCallResultSchema,
  mcpAppsAppToolDescriptorSchema,
} from "../mcp-apps/appTools.js";
import { mcpAppsSamplingParamsSchema, mcpAppsSamplingResultSchema } from "../mcp-apps/sampling.js";
import { mcpAppInstanceSchema } from "../mcp-apps/instance.js";
export { conversationQuoteSchema, conversationQuotesSchema } from "../conversationSelection.js";
/* oxlint-disable eslint(max-lines) -- ANet Protocol schema 需要单文件导出，方便 app 与 agent 共享同一份协议契约。 */
// ── 旧协议删除边界──────────────────────
// 剩余 ~257 个导出：旧 ANet Protocol 方法契约、请求/响应/事件 schema、
// session/workspace state snapshot 投影等（承重类型已迁 anet-protocol-legacy-types.ts）。
// 已连根删除的死词（词表+schema+两侧实现）：session/steer、session/rewind、
// session/rewindCascade、session/previewFileRewind、session/applyFileRewind、
// prompt/enhance 全簇（含 promptEnhanceResult 通知）、plugins/marketplace/list；
// session/fork 客户端链已删（op+schema 留存 = v4 forkSessionAtMessage 钩子消费）。
// 消费者：services 旧栈（anetProtocolClient/anetAgent/anetAgentService/anetSession*）、
// CLI bootstrap 旧协议 server（anet-protocol/server-operations、plugins、session-mapper 等）、
// UI 旧投影（anetSessionProjection 等读路径）。
// 上述旧协议 client/server 组删除时，本文件整体删除。
// 注：外部零消费 schema 多为存活 schema 联合的内部依赖，随宿主文件一起处理，勿单删。
import { z } from "zod";
import { accountProviderUnavailableReasonSchema } from "../account-provider-state.js";
import { bashOutputDisplaySchema } from "../bash-output-display.js";
import { anetAutomationBotDeliveryTargetSchema } from "../bots.js";
import { executionOutputPreviewSchema } from "../execution-output-preview.js";
import { completeModelPropertiesDataSchema } from "../model-config.js";
import { modelExecutionSchema } from "../model-execution.js";
export type { ModelExecutionSelectionFallback } from "../model-execution.js";
export * from "../off-peak-execution.js";
import { modelSelectionSchema } from "../model-selection.js";
import { APP_USAGE_RANGES, appUsageSnapshotSchema } from "../usage-stats.js";
import { DYNAMIC_WORKFLOW_MODES } from "../dynamic-workflow-feature.js";
import { errorAttributionSchema } from "../anet-protocol-v4/snapshot.js";
// 后台详情共享精简的只读响应 schema，不携带命令或计时元数据。
export * from "../background-bash-output.js";
export * from "../process-diagnostic.js";
export { attachmentSourceKindSchema, type AttachmentSourceKind } from "../attachment-source.js";
import { PROTOCOL_V4_LIMITS } from "../anet-protocol-v4/core.js";

export const anetTopicResourceReadParamsSchema = z
  .object({
    requestId: z.string().min(1).max(256),
    taskId: z.string().min(1).max(256),
    inputId: z.string().min(1).max(256),
    authorizationId: z.string().min(1).max(256),
    messageId: z.string().min(1).max(256),
    resourceIndex: z.number().int().nonnegative(),
  })
  .strict();
export const anetTopicResourceReadResultSchema = z
  .object({
    ref: z.string().min(1),
    fileName: z.string().min(1).max(1024),
    mime: z.string().min(1).max(256),
    bytes: z.number().int().min(0).max(PROTOCOL_V4_LIMITS.attachmentMaxBytes),
  })
  .strict();
export const anetTopicResourceCancelParamsSchema = z
  .object({ requestId: z.string().min(1).max(256), taskId: z.string().min(1).max(256) })
  .strict();
export const anetTopicResourceCancelResultSchema = z.object({ cancelled: z.boolean() }).strict();
export type ANetTopicResourceReadParams = z.infer<typeof anetTopicResourceReadParamsSchema>;
export type ANetTopicResourceReadResult = z.infer<typeof anetTopicResourceReadResultSchema>;
export { activeWorkSummarySchema, type ActiveWorkSummary } from "../anet-protocol-v4/snapshot.js";
// browser-use 命令/结果契约单一来源：agent 构造、协议校验和 main executor 共用同一 schema。
import {
  browserBackendListResultSchema,
  browserSessionContextKindSchema,
} from "../browser-use/backend.js";
import { browserClientModeSchema, browserCommandSchema } from "../browser-use/commands.js";
import { browserCommandResultSchema } from "../browser-use/result.js";
import { appToolSearchModeSchema } from "../app-runtime-preferences.js";
import { integratedTerminalShellSelectionSchema } from "../validationAppSettings.js";
import { anetTaskModeSchema } from "../anet-task-mode-schema.js";
import {
  OFFICIAL_AUTH_CONSUMER_KINDS,
  OFFICIAL_MCP_AUTH_PORT_FAILURE_REASONS,
} from "../official-mcp-auth.js";
import {
  anetSyntheticUserMessageSourceSchema as legacyAnetSyntheticUserMessageSourceSchema,
  anetDeliveryKindSchema,
  anetInteractionRequestOriginSchema,
  anetMessagePartSchema,
  anetMessageVisibilitySchema,
  anetMessageWithPartsSchema,
  anetPermissionDecisionSchema,
  anetPermissionResponseSchema,
  anetPermissionUpdateSchema,
  anetSessionApiRetryStatusSchema,
  anetSessionContextUsageSchema,
  anetSessionGoalSchema,
  anetSessionGoalVerificationSchema,
  anetSessionGoalVerificationTimelineSchema,
  anetSessionInfoSchema,
  anetSessionKindSchema,
  anetSessionModeSchema,
  anetSessionRuntimeStateSchema,
  anetSessionStatusSchema,
  anetToolStateSchema,
  anetWorkspaceRefSchema,
} from "../anet-protocol-legacy-types.js";

export * from "../local-ttft/contract.js";
export {
  hookExecutionProjectionSchema,
  hookInvocationRowSchema,
  type HookExecutionProjection,
  type HookInvocationRow,
} from "../anet-protocol-v4/rows.js";

export {
  sessionsIndexReconcileParamsSchema,
  sessionsIndexReconcileResultSchema,
  type SessionsIndexReconcileParams,
  type SessionsIndexReconcileResult,
} from "../anet-protocol-v4/sessions-index.js";

export const ANET_PROTOCOL_NAME = "ANet Protocol" as const;
export const ANET_PROTOCOL_VERSION = 1 as const;
// V4 wire 与 legacy 主协议并存；禁止为了 V4 physical framing 改写 legacy 版本。
export const ANET_PROTOCOL_V4_WIRE_VERSION = 3 as const;
export const anetRuntimeCapabilitiesSchema = z.object({
  sessionDirectorySource: z.boolean().optional(),
  sessionWorkspaceRouting: z.boolean().optional(),
  genUiContext: z.boolean().optional(),
  historyFirst: z.boolean().optional(),
  independentPlanState: z.boolean().optional(),
  /** CLI 认识 rowsRange 的 residency 参数；旧 CLI 会剥掉它并冷恢复，Host 据此拒绝转发。 */
  residentRowsRange: z.boolean().optional(),
});
export const anetRuntimeCapabilitiesParamsSchema = z
  .object({
    hostCapabilities: z
      .object({
        sessionDirectorySource: z.boolean().optional(),
        sessionWorkspaceRouting: z.boolean().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export const anetProtocolErrorCodes = {
  sessionUnavailable: -32004,
} as const;

const nonEmptyString = z.string().trim().min(1);
const jsonObjectSchema = z.record(z.string(), z.unknown());
const timestampMsSchema = z.number().int().nonnegative();
const protocolInstantSchema = z.union([timestampMsSchema, nonEmptyString, z.date()]);

// Tool result display 不受模型文本 budget 约束；Node REPL 图片必须在 Agent/App 协议边界
// 做严格限长，避免截图把 continuous 或 replayable 消息扩成无界载荷。
export const anetNodeReplImageToolResultDisplaySchema = z
  .object({
    kind: z.literal("node_repl_images"),
    images: z
      .array(
        z
          .object({
            base64: z
              .string()
              .min(1)
              .max(200 * 1024),
            mimeType: z.string().regex(/^image\/[a-z0-9.+-]+$/iu),
          })
          .strict(),
      )
      .min(1)
      .max(2),
    truncated: z.boolean().optional(),
    source: z.literal("browser_turn_end").optional(),
  })
  .strict();

// 同理：CreateWorkflow 的类型检查诊断也是 display 通道，必须在协议边界限长，
// 避免大量诊断把 continuous/replayable 消息扩成无界载荷。
// causalityGraph 在工具输出边界已限长，这里镜像同一组上界（与 v4 rows 保持一致）。
// 图的词汇表刻意很小：step 卡片 + actor 车道 + 一种箭头（runs after，`back` 只标回边）+
// 返回物标记。分析器的 kind / certainty / exact / region 不进载荷。
// 名字只在运行时成形（`` agent(`研究员${i + 1}`) ``）时静态能拿到的形状：第一个洞之前的
// 字面量（head）与最后一个洞之后的字面量（tail）。至少一个在场，两者都已 trim 且含实义字符。
// Bug 修复：这两个字段随 0a8b059f40 落进 contracts 与 v4 镜像，v3 这份漏改——.strict()
// 之下带插值名的工作流会让整个 display 验证失败、图整块消失，所以这里必须与 v4 逐字段对齐。
const anetWorkflowNamePatternSchema = z
  .object({
    head: z.string().min(1).max(128).optional(),
    tail: z.string().min(1).max(128).optional(),
  })
  .strict();

// 一条边 = runs after；step 边与阶段边同形，`back` 只标循环回边。
const anetWorkflowEdgeSchema = z
  .object({
    from: z.string().min(1).max(64),
    to: z.string().min(1).max(64),
    back: z.literal(true).optional(),
  })
  .strict();

const anetCreateWorkflowCausalityGraphDisplaySchema = z
  .object({
    steps: z
      .array(
        z
          .object({
            id: z.string().min(1).max(64),
            // `hole`：开着的留白自己的站点（docs/dynamic-workflow/presentation.md「Holes on the timeline」）；镜像 v4。
            kind: z.enum(["ask", "world-read", "hole"]),
            label: z.string().min(1).max(128),
            // 内联 `agent()` receiver 让 label 落到兜底串时，那个名字的静态形状。
            labelPattern: anetWorkflowNamePatternSchema.optional(),
            line: z.number().int().positive().optional(),
            column: z.number().int().positive().optional(),
            lane: z.string().min(1).max(64),
            lanes: z.array(z.string().min(1).max(64)).max(32).optional(),
            // 展开自的站点 id，只出现在 may-set 车道展开的拷贝上（实时叠加的关联键）；
            // 加字段是 additive 的，不带它的旧载荷照常通过 .strict()。
            source: z.string().min(1).max(64).optional(),
            // 作者用 `phase("…")` 标记划入的阶段。
            // 与图的 phases / phaseEdges / exits 同进同退：全在场或全缺席。
            phase: z.string().min(1).max(64).optional(),
            repeat: z.enum(["stack", "serial"]).optional(),
            // 这个站点是某次补全写进来的：值是那个留白的站点 id；镜像 v4。
            fill: z.string().min(1).max(64).optional(),
          })
          .strict(),
      )
      .max(64),
    lanes: z
      .array(
        z
          .object({
            id: z.string().min(1).max(64),
            name: z.string().min(1).max(128).optional(),
            // `name` 缺席而 agent() 首参是带洞的模板串时的静态形状；与 name 互斥。
            namePattern: anetWorkflowNamePatternSchema.optional(),
            line: z.number().int().positive().optional(),
            column: z.number().int().positive().optional(),
          })
          .strict(),
      )
      .max(32),
    // 参与者与交接；镜像 v4。
    participants: z
      .array(
        z
          .object({
            id: z.string().min(1).max(64),
            phase: z.string().min(1).max(64),
            lane: z.string().min(1).max(64),
            steps: z.array(z.string().min(1).max(64)).min(1).max(64),
            member: z
              .object({ index: z.number().int().nonnegative(), of: z.number().int().positive() })
              .strict()
              .optional(),
            many: z.literal(true).optional(),
          })
          .strict(),
      )
      .max(64),
    handoffs: z
      .array(
        anetWorkflowEdgeSchema
          .extend({ types: z.array(z.string().min(1).max(128)).min(1).max(8).optional() })
          .strict(),
      )
      .max(256),
    // 阶段词汇表：作者施加的分组结构，主画面以它为节点。与 phaseEdges / exits / Step.phase
    // 全有或全无——零标记脚本全缺席，UI 据此退回 step/车道视图。零成员阶段也在表里。
    // `unphased` 无 name，显示名由 UI 本地化。
    phases: z
      .array(
        z
          .object({
            id: z.string().min(1).max(64),
            name: z.string().min(1).max(128).optional(),
            line: z.number().int().positive().optional(),
            column: z.number().int().positive().optional(),
            // 进入本阶段时还在跑的其他阶段（它们的 strand 尚未 join），阶段表序，不含自己，
            // 为空时缺席。是节点事实而不是边——控制没有从那里转移过来，所以不进 phaseEdges。
            // 时间轴据此把相邻阶段折成一条分叉的「带」，侧栏迷你轨道画成双线段。
            alongside: z.array(z.string().min(1).max(64)).min(1).max(32).optional(),
            // 这个阶段是某次补全写进来的：值是那个留白的站点 id；镜像 v4。
            fill: z.string().min(1).max(64).optional(),
          })
          .strict(),
      )
      .max(32)
      .optional(),
    phaseEdges: z.array(anetWorkflowEdgeSchema).max(128).optional(),
    // 阶段流（docs/dynamic-workflow/presentation.md「Streams」）：两端互为 alongside 的 data 边，
    // 只有 {from, to}——不是 runs after，不进 phaseEdges、不带 back。与词汇表同进同退。
    phaseStreams: z
      .array(z.object({ from: z.string().min(1).max(64), to: z.string().min(1).max(64) }).strict())
      .max(128)
      .optional(),
    // 还开着的留白，源码序（docs/dynamic-workflow/authoring.md「Holes」）；镜像 v4。
    holes: z
      .array(
        z
          .object({
            siteId: z.string().min(1).max(64),
            name: z.string().min(1).max(128),
            type: z.string().min(1).max(128),
            phase: z.string().min(1).max(64).optional(),
            tail: z.boolean().optional(),
          })
          .strict(),
      )
      .max(32)
      .optional(),
    // 控制流可在其后正常完成的阶段（阶段视图的「阶段 → 返回物」箭头）；组内可为空数组。
    exits: z.array(z.string().min(1).max(64)).max(32).optional(),
    sink: z.array(z.string().min(1).max(64)).max(64).optional(),
    truncated: z.boolean().optional(),
  })
  .strict();

export const anetCreateWorkflowToolResultDisplaySchema = z
  .object({
    kind: z.literal("create_workflow"),
    ok: z.boolean(),
    errorCount: z.number().int().nonnegative(),
    diagnostics: z
      .array(
        z
          .object({
            line: z.number().int().nonnegative(),
            column: z.number().int().nonnegative(),
            code: z.number().int().nonnegative(),
            message: z.string().min(1).max(2_048),
          })
          .strict(),
      )
      .max(100),
    causalityGraph: anetCreateWorkflowCausalityGraphDisplaySchema.optional(),
    truncated: z.boolean().optional(),
    // FillWorkflowHole 行补的是哪处留白（docs/dynamic-workflow/presentation.md「The fill row」）；镜像 v4。
    // 修复原因：dwf-recursive 只给 contracts 与 v4 加了留白字段，v3 的 .strict() 拒掉整条 tool.updated，
    // 桌面端 v3 订阅于是把含留白的 CreateWorkflow / FillWorkflowHole 结果当无效事件丢掉。
    fill: z
      .object({
        siteId: z.string().min(1).max(64),
        name: z.string().min(1).max(128),
        draftPath: z.string().min(1).max(1_024).optional(),
        line: z.number().int().positive().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

const anetToolResultObjectSchema = jsonObjectSchema.superRefine((result, context) => {
  const display = result.display;
  if (typeof display !== "object" || display === null || Array.isArray(display)) {
    return;
  }
  const kind = (display as Record<string, unknown>).kind;
  const schemaByKind: Record<string, z.ZodTypeAny> = {
    node_repl_images: anetNodeReplImageToolResultDisplaySchema,
    create_workflow: anetCreateWorkflowToolResultDisplaySchema,
    bash_output: bashOutputDisplaySchema,
  };
  const schema = typeof kind === "string" ? schemaByKind[kind] : undefined;
  if (!schema) return;
  const parsed = schema.safeParse(display);
  if (parsed.success) return;
  for (const issue of parsed.error.issues) {
    context.addIssue({ ...issue, path: ["display", ...issue.path] });
  }
});

export const anetProtocolRequestIdSchema = z.union([z.string(), z.number().int()]);
export type ANetProtocolRequestId = z.infer<typeof anetProtocolRequestIdSchema>;

// 远程历史附件仅通过现有连接的私有反向频道传输，单块保持在 RPC 帧预算内。
export const TOPIC_RESOURCE_RELAY_CHUNK_BYTES = 384 * 1024;
export const TOPIC_RESOURCE_RELAY_CHANNEL = "host-topic-resource";
export const anetTopicResourceRelayRequestSchema = anetTopicResourceReadParamsSchema
  .extend({
    workspacePath: z.string().min(1).max(4096),
    workspaceIdentity: z.string().min(1).max(4096),
    remoteSessionId: z.string().min(1).max(256),
    trace: anetProtocolTraceSchema.optional(),
  })
  .strict();
export type ANetTopicResourceRelayRequest = z.infer<typeof anetTopicResourceRelayRequestSchema>;
export const anetTopicResourceRelayKeySchema = anetTopicResourceCancelParamsSchema;
export const anetTopicResourceRelayChunkRequestSchema = anetTopicResourceRelayKeySchema
  .extend({
    index: z.number().int().nonnegative(),
  })
  .strict();
export const anetTopicResourceRelayMetadataSchema = z
  .object({
    fileName: z.string().min(1).max(1024),
    mime: z.string().min(1).max(256),
    bytes: z.number().int().min(0).max(PROTOCOL_V4_LIMITS.attachmentMaxBytes),
    totalChunks: z
      .number()
      .int()
      .min(0)
      .max(Math.ceil(PROTOCOL_V4_LIMITS.attachmentMaxBytes / TOPIC_RESOURCE_RELAY_CHUNK_BYTES)),
    checksum: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  })
  .strict();
export const anetTopicResourceRelayChunkSchema = z
  .object({
    dataBase64: z.string().max((TOPIC_RESOURCE_RELAY_CHUNK_BYTES / 3) * 4),
  })
  .strict();

export const anetProtocolRequestSchema = z
  .object({
    id: anetProtocolRequestIdSchema,
    method: nonEmptyString,
    params: z.unknown().optional(),
    trace: anetProtocolTraceSchema.optional(),
  })
  .strict();
export type ANetProtocolRequest = z.infer<typeof anetProtocolRequestSchema>;

export const anetProtocolNotificationSchema = z
  .object({
    method: nonEmptyString,
    params: z.unknown().optional(),
    trace: anetProtocolTraceSchema.optional(),
  })
  .strict();
export type ANetProtocolNotification = z.infer<typeof anetProtocolNotificationSchema>;

export const anetProtocolResponseSchema = z
  .object({
    id: anetProtocolRequestIdSchema,
    result: z.unknown(),
  })
  .strict();
export type ANetProtocolResponse = z.infer<typeof anetProtocolResponseSchema>;

export const anetProtocolErrorSchema = z
  .object({
    id: anetProtocolRequestIdSchema,
    error: z
      .object({
        code: z.number().int(),
        message: nonEmptyString,
        data: z.unknown().optional(),
      })
      .strict(),
  })
  .strict();
export type ANetProtocolError = z.infer<typeof anetProtocolErrorSchema>;

export const anetProtocolMessageSchema = z.union([
  anetProtocolRequestSchema,
  anetProtocolNotificationSchema,
  anetProtocolResponseSchema,
  anetProtocolErrorSchema,
]);
export type ANetProtocolMessage = z.infer<typeof anetProtocolMessageSchema>;

export const anetProtocolNotifications = {
  storageStartup: "startup/storageState",
  providerRuntimeHeadersCancelled: "interaction/providerRuntimeHeadersCancelled",
  mcpTelemetry: "process/mcpTelemetry",
  mcpResourceSamples: "process/mcpResourceSamples",
  toolExecResource: "process/toolExecResource",
  pluginOperationProgress: "plugins/operationProgress",
  processResourceSample: "process/resourceSample",
  processNetworkRequests: "process/networkRequests",
} as const;

/** 启动控制面独立于 task stream；数据库身份不可携带路径/凭据。 */
export const anetStorageStartupStateSchema = z
  .object({
    schemaVersion: z.literal(1),
    attemptId: z.string().min(1).max(128),
    sequence: z.number().int().positive(),
    databaseId: z.string().min(1).max(128),
    databaseKind: z.enum(["session", "tasks-index"]),
    phase: z.enum(["checking", "waiting_for_lock", "migrating", "committing", "ready", "failed"]),
    // 包含锁内、版本 SQL 之前的可选 lastAppliedMigrationId；旧通知仍可解析。
    migration: databaseMigrationFactsSchema.optional(),
    elapsedMs: z.number().nonnegative().finite(),
    completed: z.number().int().nonnegative().optional(),
    total: z.number().int().nonnegative().optional(),
    errorCode: databaseStartupErrorCodeSchema.optional(),
    ...databaseStartupErrorDetailsSchema.shape,
  })
  .strict()
  .superRefine((state, context) => {
    if (state.phase === "failed" && !state.errorCode)
      context.addIssue({ code: "custom", message: "failed requires errorCode" });
  });
export type ANetStorageStartupState = z.infer<typeof anetStorageStartupStateSchema>;

const anetMcpTelemetryPlatformSchema = z.enum([
  "aix",
  "android",
  "darwin",
  "freebsd",
  "haiku",
  "linux",
  "netbsd",
  "openbsd",
  "sunos",
  "win32",
  "cygwin",
]);
const anetMcpTelemetryArchSchema = z.enum([
  "arm",
  "arm64",
  "ia32",
  "loong64",
  "mips",
  "mipsel",
  "ppc",
  "ppc64",
  "riscv64",
  "s390",
  "s390x",
  "x64",
]);
const anetMcpTelemetryBaseSchema = z
  .object({
    arch: anetMcpTelemetryArchSchema,
    occurredAt: z.number().int().nonnegative(),
    platform: anetMcpTelemetryPlatformSchema,
  })
  .strict();
const anetMcpProcessTelemetryBaseShape = {
  mcpId: z
    .string()
    .regex(
      /^(?:builtin:(?:[A-Za-z0-9._~-]|%[0-9A-F]{2})+(?::(?:[A-Za-z0-9._~-]|%[0-9A-F]{2})+)*|(?:plugin|custom):[a-f0-9]{12})$/,
    ),
  mcpInstanceId: nonEmptyString,
  mcpIsolation: z.enum(["session", "workspace"]),
  mcpSource: z.enum(["builtin", "plugin", "custom"]),
} as const;

export const anetMcpTelemetryEventSchema = z.discriminatedUnion("kind", [
  anetMcpTelemetryBaseSchema
    .extend({
      kind: z.literal("process_start"),
      ...anetMcpProcessTelemetryBaseShape,
    })
    .strict(),
  anetMcpTelemetryBaseSchema
    .extend({
      kind: z.literal("process_crash"),
      ...anetMcpProcessTelemetryBaseShape,
      affectedSessionCount: z.number().int().nonnegative().max(10_000),
      exitCode: z.number().int().nullable(),
      signal: nonEmptyString.nullable(),
      uptimeMs: z.number().finite().nonnegative().max(Number.MAX_SAFE_INTEGER),
    })
    .strict(),
  anetMcpTelemetryBaseSchema
    .extend({
      kind: z.literal("session_startup"),
      configuredCount: z.number().int().nonnegative().max(10_000),
      connectedCount: z.number().int().nonnegative().max(10_000),
      failedCount: z.number().int().nonnegative().max(10_000),
      processCount: z.number().int().nonnegative().max(10_000),
      sessionId: nonEmptyString,
    })
    .strict(),
  anetMcpTelemetryBaseSchema
    .extend({
      kind: z.literal("memory"),
      ...anetMcpProcessTelemetryBaseShape,
      memoryKb: z.number().finite().nonnegative().max(Number.MAX_SAFE_INTEGER),
      memoryScope: z.enum(["process_tree", "direct_process"]),
      orphanSuspected: z.boolean(),
      ownerSessionCount: z.number().int().nonnegative().max(10_000),
      unownedSeconds: z.number().finite().nonnegative().max(Number.MAX_SAFE_INTEGER),
    })
    .strict(),
]);
export type ANetMcpTelemetryEvent = z.infer<typeof anetMcpTelemetryEventSchema>;

/** MCP 每五分钟只探测一次，周期由生产者与设备总量过期判据共用。 */
export const ANET_MCP_RESOURCE_SAMPLE_INTERVAL_MS = 5 * 60_000;

export const anetMcpResourceSampleSchema = z
  .object({
    mcpId: anetMcpProcessTelemetryBaseShape.mcpId,
    instanceToken: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
    sampledAt: z.number().int().nonnegative(),
    intervalMs: z.number().finite().positive(),
    processCount: z.number().int().positive().max(100_000),
    rssKbTotal: z.number().finite().nonnegative().max(Number.MAX_SAFE_INTEGER),
    rssKbMaxProcess: z.number().finite().nonnegative().max(Number.MAX_SAFE_INTEGER),
    cpuTimeMsDelta: z.number().finite().nonnegative().max(Number.MAX_SAFE_INTEGER),
    uptimeMinutes: z.number().int().nonnegative(),
    platform: anetMcpTelemetryPlatformSchema,
    arch: anetMcpTelemetryArchSchema,
    logicalCpuCount: z.number().int().positive().max(4_096),
    totalMemoryGb: z.number().int().nonnegative().max(1_048_576),
  })
  .strict();
export type ANetMcpResourceSample = z.infer<typeof anetMcpResourceSampleSchema>;
// 通知输入有界；main 另按每个上报窗口的 32 个 MCP 分组执行事件额度。
export const anetMcpResourceSamplesSchema = z.array(anetMcpResourceSampleSchema).max(1_024);

export const BASH_RESOURCE_SAMPLE_INTERVAL_MS = 15_000;
export const BASH_RESOURCE_MAX_SAMPLES = 20;

/** Bash 子进程的有界完成事实；禁止命令、路径与会话标识进入遥测旁路。 */
export const anetToolExecResourceSchema = z
  .object({
    // 同一完成事实可能经多个 Host 转发；随机标识仅供 main 去重，旧 CLI 缺字段仍兼容。
    completionToken: z.string().uuid().optional(),
    platform: anetMcpTelemetryPlatformSchema,
    toolName: z.literal("bash"),
    durationMs: z.number().finite().min(BASH_RESOURCE_SAMPLE_INTERVAL_MS),
    exitKind: z.enum(["completed", "timeout", "killed", "error"]),
    treeRssKbPeak: z.number().finite().nonnegative().optional(),
    treeCpuTimeMs: z.number().finite().nonnegative().optional(),
    sampleCount: z.number().int().nonnegative().max(BASH_RESOURCE_MAX_SAMPLES),
    cliRssKb: z.number().finite().nonnegative(),
    systemFreeMemoryKb: z.number().finite().nonnegative(),
  })
  .strict();
export type ANetToolExecResource = z.infer<typeof anetToolExecResourceSchema>;

export const anetProcessResourceSampleSchema = z
  .object({
    platform: z.enum([
      "aix",
      "android",
      "darwin",
      "freebsd",
      "haiku",
      "linux",
      "netbsd",
      "openbsd",
      "sunos",
      "win32",
      "cygwin",
    ]),
    arch: z.enum([
      "arm",
      "arm64",
      "ia32",
      "loong64",
      "mips",
      "mipsel",
      "ppc",
      "ppc64",
      "riscv64",
      "s390",
      "s390x",
      "x64",
    ]),
    logicalCpuCount: z.number().int().positive().max(4_096),
    intervalMs: z
      .number()
      .int()
      .positive()
      .max(7 * 24 * 60 * 60 * 1_000),
    cpuCores: z.number().finite().nonnegative().max(4_096),
    cpuPercent: z.number().finite().nonnegative().max(100_000),
    rssKb: z.number().finite().nonnegative().max(Number.MAX_SAFE_INTEGER),
    /**
     * 以下四项为遥测新增字段，全部可选：旧 CLI 发来的样本仍能通过校验，因此
     * **不递增协议握手版本号**（握手版本是兼容性开关，不是字段版本）。
     */
    heapUsedKb: z.number().finite().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
    uptimeMinutes: z
      .number()
      .int()
      .nonnegative()
      .max(10 * 365 * 24 * 60)
      .optional(),
    totalMemoryGb: z.number().int().nonnegative().max(1_048_576).optional(),
    /**
     * CLI 进程启动时随机生成的实例标识，仅供 app 侧 main 统计「同时存活几个 CLI 进程」
     * 与「最大单进程 RSS」。不进 ARMS 属性、不含 pid。收紧字符集是隐私红线的机械保障：
     * 路径、workspace 标识这类内容不可能通过校验。
     */
    instanceToken: z
      .string()
      .regex(/^[A-Za-z0-9_-]{8,64}$/)
      .optional(),
  })
  .strict();
export type ANetProcessResourceSample = z.infer<typeof anetProcessResourceSampleSchema>;

export const anetProcessChildProcessesParamsSchema = z.object({}).strict();
export const anetProcessChildProcessSchema = z
  .object({
    pid: z.number().int().positive(),
    serverName: nonEmptyString,
    mcpSource: z.enum(["builtin", "plugin", "custom"]),
    /** 官方/第三方插件的插件名（`plugin:<name>:<key>` 的 name，或官方 host MCP 对应插件）；custom 无 */
    pluginName: nonEmptyString.optional(),
  })
  .strict();
export const anetProcessChildProcessesResultSchema = z
  .object({
    processes: z.array(anetProcessChildProcessSchema).max(10_000),
  })
  .strict();
export type ANetProcessChildProcess = z.infer<typeof anetProcessChildProcessSchema>;
export type ANetProcessChildProcessesResult = z.infer<typeof anetProcessChildProcessesResultSchema>;

export type ANetDeliveryKind = z.infer<typeof anetDeliveryKindSchema>;
// TurnStarted 与持久 message 必须共用同一来源词表；否则 live event 能通过而 cold
// message 在 app/agent 边界被拒绝，造成 continuous/replayable 语义分叉。
// 持久消息与输入沿用同一 source schema；agent_listing_delta 只作 provider context，不触发新 turn。
const anetTurnInputSourceSchema = legacyAnetSyntheticUserMessageSourceSchema;
export const anetSessionPersistenceSchema = z.enum(["immediate", "deferred"]);
export type ANetSessionPersistence = z.infer<typeof anetSessionPersistenceSchema>;
export type ANetWorkspaceRef = z.infer<typeof anetWorkspaceRefSchema>;
export const anetPermissionOptionSchema = z
  .object({
    optionId: nonEmptyString,
    kind: nonEmptyString,
    name: nonEmptyString,
    description: z.string().optional(),
    response: anetPermissionResponseSchema,
  })
  .strict();

const anetProtocolMcpEntrySchema = z
  .object({
    name: nonEmptyString,
    value: z.string(),
  })
  .strict();

const anetProtocolMcpOAuthSchema = z.union([
  z
    .object({
      type: z.literal("client_credentials"),
      clientId: nonEmptyString,
      clientSecret: nonEmptyString,
      clientName: nonEmptyString.optional(),
      scope: z.string().optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("authorization_code"),
      clientId: nonEmptyString.optional(),
      clientSecret: nonEmptyString.optional(),
      clientName: nonEmptyString.optional(),
      redirectPath: nonEmptyString.optional(),
      scope: z.string().optional(),
    })
    .strict(),
]);

export const anetProtocolMcpServerSchema = z.union([
  z
    .object({
      name: nonEmptyString,
      scope: z.enum(["user", "workspace"]).optional(),
      command: nonEmptyString,
      cwd: nonEmptyString.optional(),
      args: z.array(z.string()),
      env: z.array(anetProtocolMcpEntrySchema),
      isolation: z.enum(["session", "workspace"]).optional(),
      protocolVersion: z.enum(["legacy", "auto", "2026-07-28"]).optional(),
      alwaysLoad: z.boolean().optional(),
      timeoutMs: z.number().int().positive().optional(),
    })
    .strict(),
  z
    .object({
      name: nonEmptyString,
      scope: z.enum(["user", "workspace"]).optional(),
      type: z.enum(["http", "sse"]),
      url: nonEmptyString,
      headers: z.array(anetProtocolMcpEntrySchema),
      oauth: anetProtocolMcpOAuthSchema.optional(),
      isolation: z.enum(["session", "workspace"]).optional(),
      protocolVersion: z.enum(["legacy", "auto", "2026-07-28"]).optional(),
      alwaysLoad: z.boolean().optional(),
      timeoutMs: z.number().int().positive().optional(),
    })
    .strict(),
]);
export type ANetProtocolMcpServer = z.infer<typeof anetProtocolMcpServerSchema>;

export const anetMcpServerStatusKindSchema = z.enum([
  "connecting",
  "connected",
  "disabled",
  "disconnected",
  "failed",
  "untrusted",
]);
export const MCP_SERVER_FAILURE_KINDS = [
  "config_invalid",
  "runtime_unavailable",
  "process_start_failed",
  "network_unreachable",
  "connection_timeout",
  "protocol_negotiation_failed",
  "tool_list_failed",
  "unexpected_disconnect",
  "oauth_authorization_failed",
  "official_origin_untrusted",
  "not_authenticated",
  "coding_plan_required",
  "server_not_found",
  "server_unavailable",
  "rate_limited",
  "server_internal_error",
  "protocol_error",
  "status_unavailable",
  "connection_failed",
] as const;
export const mcpServerFailureKindSchema = z.enum(MCP_SERVER_FAILURE_KINDS);
export type McpServerFailureKind = z.infer<typeof mcpServerFailureKindSchema>;
export const workspaceMcpTrustReviewSchema = z
  .object({
    declarationDigest: z.string().regex(/^[a-f0-9]{64}$/u),
    sourcePaths: z.array(nonEmptyString),
    display: z.string(),
    trusted: z.boolean(),
    configuredEnabled: z.boolean(),
    transport: z.enum(["stdio", "http", "sse"]),
  })
  .strict();
export type WorkspaceMcpTrustReview = z.infer<typeof workspaceMcpTrustReviewSchema>;
export const anetWorkspaceMcpTrustParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    serverName: nonEmptyString,
    declarationDigest: z.string().regex(/^[a-f0-9]{64}$/u),
    trusted: z.boolean(),
  })
  .strict();
export const anetWorkspaceMcpTrustResultSchema = z
  .object({
    accepted: z.boolean(),
    reasonCode: z
      .enum(["workspace_mcp_declaration_changed", "workspace_mcp_trust_unavailable"])
      .optional(),
  })
  .strict();
export type ANetWorkspaceMcpTrustResult = z.infer<typeof anetWorkspaceMcpTrustResultSchema>;
export const anetMcpServerStatusSnapshotSchema = z
  .object({
    status: anetMcpServerStatusKindSchema,
    workspaceTrust: workspaceMcpTrustReviewSchema.optional(),
    transport: z.enum(["stdio", "http", "sse"]),
    toolCount: z.number().int().nonnegative(),
    updatedAt: nonEmptyString,
    error: z.string().optional(),
    failureKind: mcpServerFailureKindSchema.optional(),
    serverRequestId: nonEmptyString.optional(),
    protocolEra: z.enum(["legacy", "modern"]).optional(),
    authorization: z
      .object({
        type: z.literal("oauth_authorization_code"),
        authorizationUrl: nonEmptyString,
        startedAt: nonEmptyString,
      })
      .strict()
      .optional(),
  })
  .strict();
export type ANetMcpServerStatusSnapshot = z.infer<typeof anetMcpServerStatusSnapshotSchema>;

export const anetMcpListModeSchema = z.enum(["connect", "status"]);
export type ANetMcpListMode = z.infer<typeof anetMcpListModeSchema>;

export const anetMcpListParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    mcpServers: z.array(anetProtocolMcpServerSchema).optional(),
    mode: anetMcpListModeSchema.default("connect"),
  })
  .strict();
export const anetMcpListResultSchema = z
  .object({
    statuses: z.record(z.string(), anetMcpServerStatusSnapshotSchema),
  })
  .strict();
export type ANetMcpListResult = z.infer<typeof anetMcpListResultSchema>;

// 插件 UI：UI 发起的 MCP 资源读取与工具调用，
// 按 pluginId 限定 server 归属，agent 侧 fail closed。
export const anetMcpUiOpenInstanceParamsSchema = z
  .object({
    accountContext: z.string().max(256).optional(),
    workspace: anetWorkspaceRefSchema,
    sessionId: nonEmptyString,
    pluginId: nonEmptyString,
    serverName: nonEmptyString,
    scopeId: nonEmptyString.max(4096),
    resourceUri: nonEmptyString.max(2048),
    ownerWebContentsId: z.number().int().positive(),
  })
  .strict();
export const anetMcpUiOpenInstanceResultSchema = mcpAppInstanceSchema;
export type ANetMcpUiOpenInstanceParams = z.infer<typeof anetMcpUiOpenInstanceParamsSchema>;
const anetMcpUiPluginScopeShape = {
  instance: mcpAppInstanceSchema,

  workspace: anetWorkspaceRefSchema,
  sessionId: nonEmptyString,
  pluginId: nonEmptyString,
  serverName: nonEmptyString,
};
export const anetMcpUiCloseInstanceParamsSchema = z
  .object({ ...anetMcpUiPluginScopeShape, onlyIfIdle: z.boolean().optional() })
  .strict();
export const anetMcpUiCloseInstanceResultSchema = z.object({ closed: z.boolean() }).strict();
export const anetMcpReadResourceParamsSchema = z
  .object({ ...anetMcpUiPluginScopeShape, uri: nonEmptyString.max(2048) })
  .strict();
export type ANetMcpReadResourceParams = z.infer<typeof anetMcpReadResourceParamsSchema>;
export const anetMcpResourceContentSchema = z
  .object({
    uri: z.string(),
    mimeType: z.string().optional(),
    text: z.string().optional(),
    blob: z.string().optional(),
    _meta: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();
export const anetMcpReadResourceResultSchema = z
  .object({ contents: z.array(anetMcpResourceContentSchema) })
  .strict();
export type ANetMcpReadResourceResult = z.infer<typeof anetMcpReadResourceResultSchema>;

/**
 * 插件页面发起的 `resources/read` 代理。
 * 与 `mcp/readResource`（宿主取 ui:// HTML）参数同形，但结果去掉 `_meta`、受 8 MiB 与 mimeType 白名单约束。
 */
export const anetMcpUiReadResourceParamsSchema = anetMcpReadResourceParamsSchema;
export type ANetMcpUiReadResourceParams = z.infer<typeof anetMcpUiReadResourceParamsSchema>;
export const anetMcpUiResourceContentSchema = z
  .object({
    uri: z.string(),
    mimeType: z.string().optional(),
    text: z.string().optional(),
    blob: z.string().optional(),
  })
  .strict();
export const anetMcpUiReadResourceResultSchema = z
  .object({ contents: z.array(anetMcpUiResourceContentSchema) })
  .strict();
export type ANetMcpUiReadResourceResult = z.infer<typeof anetMcpUiReadResourceResultSchema>;

export const anetMcpUiSamplingParamsSchema = z
  .object({
    ...anetMcpUiPluginScopeShape,
    operationId: nonEmptyString.max(128),
    request: mcpAppsSamplingParamsSchema,
  })
  .strict();
export const anetMcpUiCancelSamplingParamsSchema = z
  .object({ ...anetMcpUiPluginScopeShape, operationId: nonEmptyString.max(128) })
  .strict();
export const anetMcpUiSamplingResultSchema = mcpAppsSamplingResultSchema;
export type ANetMcpUiSamplingParams = z.infer<typeof anetMcpUiSamplingParamsSchema>;
export type ANetMcpUiCancelSamplingParams = z.infer<typeof anetMcpUiCancelSamplingParamsSchema>;

export const anetMcpUiCallToolParamsSchema = z
  .object({
    ...anetMcpUiPluginScopeShape,
    toolName: nonEmptyString,
    arguments: z.record(z.string(), z.unknown()).optional(),
    /** 宿主生成的调用 id，配合 `mcp/uiCancelCall` 取消进行中的调用。 */
    callId: nonEmptyString.max(128),
  })
  .strict();
export type ANetMcpUiCallToolParams = z.infer<typeof anetMcpUiCallToolParamsSchema>;
/** 取消页面发起的工具调用（卡片卸载、会话切换）；agent 侧 abort 到 MCP client。 */
export const anetMcpUiCancelCallParamsSchema = z
  .object({ ...anetMcpUiPluginScopeShape, callId: nonEmptyString.max(128) })
  .strict();
export type ANetMcpUiCancelCallParams = z.infer<typeof anetMcpUiCancelCallParamsSchema>;
export const anetMcpUiCancelCallResultSchema = z.object({ cancelled: z.boolean() }).strict();
export type ANetMcpUiCancelCallResult = z.infer<typeof anetMcpUiCancelCallResultSchema>;
/** 页面发起的 resources/list、resources/templates/list、subscribe、unsubscribe 代理。 */
export const anetMcpUiListResourcesParamsSchema = z
  .object({ ...anetMcpUiPluginScopeShape, cursor: nonEmptyString.max(2048).optional() })
  .strict();
export type ANetMcpUiListResourcesParams = z.infer<typeof anetMcpUiListResourcesParamsSchema>;
const anetMcpUiResourceDescriptorSchema = z
  .object({
    uri: z.string(),
    name: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    mimeType: z.string().optional(),
    // MCP Resource 的标准字段；规范把资源级 csp / prefersBorder 放在这里，宿主读 HTML 项缺 _meta 时回退用。
    _meta: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();
export const anetMcpUiListResourcesResultSchema = z
  .object({
    resources: z.array(anetMcpUiResourceDescriptorSchema),
    nextCursor: z.string().optional(),
  })
  .strict();
export type ANetMcpUiListResourcesResult = z.infer<typeof anetMcpUiListResourcesResultSchema>;
export const anetMcpUiListResourceTemplatesResultSchema = z
  .object({
    resourceTemplates: z.array(
      z
        .object({
          uriTemplate: z.string(),
          name: z.string().optional(),
          title: z.string().optional(),
          description: z.string().optional(),
          mimeType: z.string().optional(),
        })
        .strict(),
    ),
    nextCursor: z.string().optional(),
  })
  .strict();
export type ANetMcpUiListResourceTemplatesResult = z.infer<
  typeof anetMcpUiListResourceTemplatesResultSchema
>;
/** 订阅者身份 = 会话 + 沙箱作用域 + 实例代际（initId）；dispose 只退订本代际，新实例不受影响。 */
export const anetMcpUiResourceSubscriptionParamsSchema = z
  .object({
    ...anetMcpUiPluginScopeShape,
    scopeId: nonEmptyString.max(256),
    generation: z.number().int().nonnegative(),
    uri: nonEmptyString.max(2048),
  })
  .strict();
export type ANetMcpUiResourceSubscriptionParams = z.infer<
  typeof anetMcpUiResourceSubscriptionParamsSchema
>;
export const anetMcpUiResourceSubscriptionResultSchema = z.object({}).strict();
/**
 * App-Provided Tools：实例身份 = 会话 + 沙箱作用域 + 代际（与资源订阅同一三元组）。
 * 登记按实例整体替换；调用认领 / 回传按 callId 幂等。
 */
const anetMcpUiAppToolInstanceShape = {
  ...anetMcpUiPluginScopeShape,
  scopeId: nonEmptyString.max(256),
  generation: z.number().int().nonnegative(),
};
export const anetMcpUiRegisterAppToolsParamsSchema = z
  .object({
    ...anetMcpUiAppToolInstanceShape,
    tools: z.array(mcpAppsAppToolDescriptorSchema).max(MCP_APPS_APP_TOOLS_MAX_PER_INSTANCE),
  })
  .strict();
export type ANetMcpUiRegisterAppToolsParams = z.infer<typeof anetMcpUiRegisterAppToolsParamsSchema>;
export const anetMcpUiRegisterAppToolsResultSchema = z
  .object({ tools: z.array(z.object({ name: z.string(), modelName: z.string() }).strict()) })
  .strict();
export type ANetMcpUiRegisterAppToolsResult = z.infer<typeof anetMcpUiRegisterAppToolsResultSchema>;
export const anetMcpUiUnregisterAppToolsParamsSchema = z
  .object(anetMcpUiAppToolInstanceShape)
  .strict();
export type ANetMcpUiUnregisterAppToolsParams = z.infer<
  typeof anetMcpUiUnregisterAppToolsParamsSchema
>;
export const anetMcpUiUnregisterAppToolsResultSchema = z
  .object({ removed: z.number().int().nonnegative() })
  .strict();
export type ANetMcpUiUnregisterAppToolsResult = z.infer<
  typeof anetMcpUiUnregisterAppToolsResultSchema
>;
export const anetMcpUiClaimAppToolCallParamsSchema = z
  .object({
    ...anetMcpUiAppToolInstanceShape,
    callId: nonEmptyString.max(MCP_APPS_APP_TOOL_CALL_ID_MAX_CHARS),
  })
  .strict();
export type ANetMcpUiClaimAppToolCallParams = z.infer<typeof anetMcpUiClaimAppToolCallParamsSchema>;
export const anetMcpUiAppToolAcceptedResultSchema = z.object({ accepted: z.boolean() }).strict();
export type ANetMcpUiAppToolAcceptedResult = z.infer<typeof anetMcpUiAppToolAcceptedResultSchema>;
export const anetMcpUiResolveAppToolCallParamsSchema = z
  .object({
    ...anetMcpUiAppToolInstanceShape,
    callId: nonEmptyString.max(MCP_APPS_APP_TOOL_CALL_ID_MAX_CHARS),
    result: mcpAppsAppToolCallResultSchema.optional(),
    error: z
      .object({ message: z.string().max(MCP_APPS_APP_TOOL_ERROR_MESSAGE_MAX_CHARS) })
      .strict()
      .optional(),
  })
  .strict()
  .refine((value) => (value.result === undefined) !== (value.error === undefined), {
    message: "exactly one of result or error is required",
  });
export type ANetMcpUiResolveAppToolCallParams = z.infer<
  typeof anetMcpUiResolveAppToolCallParamsSchema
>;
export const anetMcpUiCallToolResultSchema = z
  .object({
    content: z.array(z.record(z.string(), z.unknown())),
    structuredContent: z.unknown().optional(),
    isError: z.boolean().optional(),
    _meta: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();
export type ANetMcpUiCallToolResult = z.infer<typeof anetMcpUiCallToolResultSchema>;

export const anetSessionImportMessageSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    timestamp: timestampMsSchema.optional(),
  })
  .strict();
export type ANetSessionImportMessage = z.infer<typeof anetSessionImportMessageSchema>;

export const anetSessionImportHistorySchema = z.discriminatedUnion("source", [
  z
    .object({
      source: z.literal("claudeCode"),
      title: z.string().optional(),
      createdAt: timestampMsSchema.optional(),
      updatedAt: timestampMsSchema.optional(),
      messages: z.array(anetSessionImportMessageSchema).min(1),
    })
    .strict(),
  z
    .object({
      source: z.literal("sharedContext"),
      title: z.string().trim().min(1),
      createdAt: timestampMsSchema.optional(),
      markdown: z.string().min(1),
      provenance: z
        .object({
          shareId: z.string().trim().min(1),
          contextId: z.string().trim().min(1).optional(),
          shareUrl: z.string().url().optional(),
          status: z.enum(["pending", "reserved", "attached", "discarded"]).optional(),
          projectionSha256: z.string().regex(/^[0-9a-f]{64}$/u),
          artifactSetSha256: z.string().regex(/^[0-9a-f]{64}$/u),
          formatterVersion: z.literal(1),
          markdownSha256: z.string().regex(/^[0-9a-f]{64}$/u),
          installedArtifacts: z.array(
            z
              .object({
                artifactId: z.string().trim().min(1),
                workspaceRelativePath: z.string().trim().min(1),
              })
              .strict(),
          ),
        })
        .strict(),
    })
    .strict(),
]);
export type ANetSessionImportHistory = z.infer<typeof anetSessionImportHistorySchema>;

export const anetThoughtLevelOptionSchema = z
  .object({
    value: nonEmptyString,
    label: nonEmptyString,
    description: z.string().optional(),
  })
  .strict();
export const anetModelReasoningOptionsSchema = z
  .object({
    levels: z.array(anetThoughtLevelOptionSchema),
    defaultLevel: nonEmptyString.optional(),
  })
  .strict();
export type ANetModelReasoningOptions = z.infer<typeof anetModelReasoningOptionsSchema>;

export const anetModelFormatPropertiesSchema = completeModelPropertiesDataSchema.pick({
  inputFormat: true,
  outputFormat: true,
});
export type ANetModelFormatProperties = z.infer<typeof anetModelFormatPropertiesSchema>;

export const anetModelOptionSchema = z
  .object({
    ref: modelSelectionSchema,
    label: nonEmptyString,
    providerLabel: nonEmptyString.optional(),
    description: z.string().optional(),
    contextWindow: z.number().int().positive().optional(),
    maxOutputTokens: z.number().int().positive().optional(),
    reasoning: anetModelReasoningOptionsSchema.optional(),
    properties: anetModelFormatPropertiesSchema,
    disabledReason: z.string().optional(),
  })
  .strict();
export type ANetModelOption = z.infer<typeof anetModelOptionSchema>;

/**
 * 账号访问类别的取值。协议报文与 Provider 配置共用同一个判别值,
 * 取自 config-schema,否则协议下发的 access 写进配置后读不回来。
 */
export const ANET_ACCOUNT_ACCESS_TYPE = PROVIDER_ACCOUNT_ACCESS_TYPE;

const anetAccountAccessTypeSchema = z.literal(ANET_ACCOUNT_ACCESS_TYPE);

/** family id 由已注册的 provider family 决定,不再是固定的厂商两选一。 */
const anetAccountFamilySchema = z.string().min(1);

export const anetAccountAccessSchema = z.discriminatedUnion("planKind", [
  z
    .object({
      type: anetAccountAccessTypeSchema,
      family: anetAccountFamilySchema,
      planKind: z.literal("start-plan"),
    })
    .strict(),
  z
    .object({
      type: anetAccountAccessTypeSchema,
      family: anetAccountFamilySchema,
      planKind: z.literal("individual-coding-plan"),
    })
    .strict(),
  z
    .object({
      type: anetAccountAccessTypeSchema,
      family: anetAccountFamilySchema,
      planKind: z.literal("team-coding-plan"),
      productId: nonEmptyString,
      organizationId: nonEmptyString,
      projectId: nonEmptyString,
    })
    .strict(),
]);
export type ANetAccountAccess = z.infer<typeof anetAccountAccessSchema>;

/** Active Model 固定的账号访问类别；当前商品和 Team scope 由账号服务在请求期解析。 */
export const anetProviderAccountAccessSchema = z
  .object({
    type: anetAccountAccessTypeSchema,
    accountType: anetAccountFamilySchema,
    // `highspeed` 指加速卡这一账号访问类别（隐藏 Provider + 免签网关），与任何同名
    // 模型无关，仅字面重合。
    mode: z.enum([
      "start-plan",
      "individual-coding-plan",
      "team-coding-plan",
      "off-peak",
      "highspeed",
    ]),
    entitled: z.boolean(),
  })
  .strict();
export type ANetProviderAccountAccess = z.infer<typeof anetProviderAccountAccessSchema>;

export type ANetSessionMode = z.infer<typeof anetSessionModeSchema>;
export type ANetSessionKind = z.infer<typeof anetSessionKindSchema>;
export type ANetSessionGoal = z.infer<typeof anetSessionGoalSchema>;

export const anetSessionTodoItemSchema = z
  .object({
    content: nonEmptyString,
    status: z.enum(["pending", "in_progress", "completed"]),
    priority: z.enum(["high", "medium", "low"]),
  })
  .strict();
export const anetSessionGoalStatsSchema = z
  .object({
    timeUsedSeconds: z.number().int().nonnegative(),
    tokensUsed: z.number().int().nonnegative(),
    tokenBudget: z.number().int().positive().nullable(),
    contextUsed: z.number().int().nonnegative(),
    contextWindow: z.number().int().nonnegative(),
    toolCallCount: z.number().int().nonnegative(),
    iterationCount: z.number().int().nonnegative(),
  })
  .strict();
export type ANetSessionGoalStats = z.infer<typeof anetSessionGoalStatsSchema>;
export type ANetSessionGoalVerification = z.infer<typeof anetSessionGoalVerificationSchema>;
export type ANetSessionGoalVerificationTimeline = z.infer<
  typeof anetSessionGoalVerificationTimelineSchema
>;

export const anetSessionTodoGroupSchema = z
  .object({
    id: nonEmptyString,
    source: z.enum(["goal_iteration", "session"]),
    goalIteration: z.number().int().positive().optional(),
    targetId: nonEmptyString.optional(),
    startedAt: timestampMsSchema.optional(),
    updatedAt: timestampMsSchema.optional(),
    todos: z.array(anetSessionTodoItemSchema),
  })
  .strict();
export type ANetSessionTodoGroup = z.infer<typeof anetSessionTodoGroupSchema>;

export const anetSessionSettingsStateSchema = z
  .object({
    model: z
      .object({
        // 未绑定是合法恢复状态；不能为满足协议而伪造模型或阻断历史读取。
        current: modelSelectionSchema.optional(),
        available: z.array(anetModelOptionSchema),
        lastUsed: modelSelectionSchema.optional(),
      })
      .strict(),
    thoughtLevel: z
      .object({
        enabled: z.boolean(),
        current: nonEmptyString.optional(),
        defaultLevel: nonEmptyString.optional(),
        available: z.array(anetThoughtLevelOptionSchema),
      })
      .strict(),
    mode: z
      .object({
        current: anetSessionModeSchema,
      })
      .strict(),
    permission: z
      .object({
        mode: anetSessionModeSchema.optional(),
        rulesRevision: z.number().int().nonnegative().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type ANetSessionSettingsState = z.infer<typeof anetSessionSettingsStateSchema>;
export const anetPendingPermissionSchema = z
  .object({
    requestId: nonEmptyString,
    toolCallId: nonEmptyString,
    toolName: nonEmptyString,
    reason: z.string(),
    riskLevel: z.enum(["low", "medium", "high", "critical"]),
    input: z.unknown().optional(),
    origin: anetInteractionRequestOriginSchema.optional(),
    options: z.array(anetPermissionOptionSchema).min(1),
    requestedAt: timestampMsSchema,
  })
  .strict();
export type ANetPendingPermission = z.infer<typeof anetPendingPermissionSchema>;

export const anetActiveToolCallSchema = z
  .object({
    toolCallId: nonEmptyString,
    toolName: nonEmptyString,
    status: z.enum(["pending", "running", "completed", "failed", "denied"]),
    startedAt: timestampMsSchema.optional(),
  })
  .strict();
export type ANetActiveToolCall = z.infer<typeof anetActiveToolCallSchema>;

export const anetSessionProjectionSchema = z
  .object({
    sessionId: nonEmptyString,
    status: anetSessionStatusSchema,
    mode: anetSessionModeSchema,
    turnCount: z.number().int().nonnegative(),
    totalTokenCount: z.number().int().nonnegative(),
    contextUsed: z.number().int().nonnegative(),
    contextWindow: z.number().int().nonnegative(),
    currentTurnId: nonEmptyString.optional(),
    pendingPermissions: z.array(anetPendingPermissionSchema),
    activeToolCalls: z.array(anetActiveToolCallSchema),
    backgroundJobs: z.array(jsonObjectSchema),
    target: anetSessionGoalSchema.nullable().optional(),
    lastError: z
      .object({
        type: nonEmptyString,
        code: nonEmptyString.optional(),
        message: nonEmptyString,
        detail: z.string().optional(),
        attribution: errorAttributionSchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type ANetSessionProjection = z.infer<typeof anetSessionProjectionSchema>;
export type ANetToolState = z.infer<typeof anetToolStateSchema>;
export const anetSlashCommandSchema = z
  .object({
    name: nonEmptyString,
    description: z.string(),
    inputHint: z.string().optional(),
    source: z.enum(["builtin", "custom"]).optional(),
  })
  .strict();
export type ANetSessionApiRetryStatus = z.infer<typeof anetSessionApiRetryStatusSchema>;
export type ANetSessionContextUsage = z.infer<typeof anetSessionContextUsageSchema>;
export const anetModelStreamingKindSchema = z.enum([
  "start",
  "finish",
  "error",
  "text_start",
  "text_delta",
  "text_end",
  "reasoning_start",
  "reasoning_delta",
  "reasoning_end",
  "tool_input_start",
  "tool_input_delta",
  "tool_input_end",
  "tool_call",
]);
export const anetModelStreamingEventPayloadSchema = z
  .object({
    assistantMessageId: z.string().optional(),
    delta: z.string().optional(),
    done: z.boolean().optional(),
    input: z.unknown().optional(),
    kind: anetModelStreamingKindSchema,
    partId: z.string().optional(),
    providerExecuted: z.boolean().optional(),
    toolCallId: z.string().optional(),
    toolName: z.string().optional(),
  })
  .strict();
export const anetSessionStateSnapshotSchema = z
  .object({
    protocol: z
      .object({
        name: z.literal(ANET_PROTOCOL_NAME),
        version: z.literal(ANET_PROTOCOL_VERSION),
      })
      .strict(),
    session: anetSessionInfoSchema,
    settings: anetSessionSettingsStateSchema,
    projection: anetSessionProjectionSchema,
    runtime: anetSessionRuntimeStateSchema,
    messages: z.array(anetMessageWithPartsSchema),
    goalStats: anetSessionGoalStatsSchema.optional(),
    todos: z.array(anetSessionTodoItemSchema).optional(),
    todoGroups: z.array(anetSessionTodoGroupSchema).optional(),
    slashCommands: z.array(anetSlashCommandSchema).optional(),
  })
  .strict();
export type ANetSessionStateSnapshot = z.infer<typeof anetSessionStateSnapshotSchema>;

export const anetEventEnvelopeSchema = z
  .object({
    eventId: nonEmptyString,
    sessionId: nonEmptyString,
    turnId: nonEmptyString.optional(),
    seq: z.number().int().nonnegative(),
    traceId: nonEmptyString.optional(),
    timestamp: timestampMsSchema,
    deliveryKind: anetDeliveryKindSchema.optional(),
  })
  .strict();

const anetComputerUseOperationEventBaseSchema = z
  .object({
    eventId: nonEmptyString,
    sequenceNumber: z.number().int().nonnegative(),
    sessionId: nonEmptyString,
    timestamp: timestampMsSchema,
  })
  .strict();

const anetComputerUseTurnStartedEventSchema = anetComputerUseOperationEventBaseSchema.extend({
  kind: z.literal("turn-started"),
  turnId: nonEmptyString,
});
const anetComputerUseTurnCompletedEventSchema = anetComputerUseOperationEventBaseSchema.extend({
  kind: z.literal("turn-completed"),
  turnId: nonEmptyString,
});
const anetComputerUseTurnFailedEventSchema = anetComputerUseOperationEventBaseSchema.extend({
  kind: z.literal("turn-failed"),
  turnId: nonEmptyString,
});
const anetComputerUseToolScheduledEventSchema = anetComputerUseOperationEventBaseSchema.extend({
  kind: z.literal("tool-scheduled"),
  turnId: nonEmptyString,
  toolCallId: nonEmptyString,
  toolName: nonEmptyString,
  // 这个 cell 是否在用 Computer Use。只表达布尔事实，不再携带动作名——旧的
  // operationAction 靠从模型源码里抽取动作名得到，SDK 面一变就整体失配（见
  // bootstrap/src/anet-protocol/computer-use-operation-event.ts 的 usesComputerUse）。
  // 只挂在 scheduled 上：ToolCallStartedPayload 没有 input，start 时已拿不到模型源码。
  computerUse: z.literal(true).optional(),
});
const anetComputerUseToolStartedEventSchema = anetComputerUseOperationEventBaseSchema.extend({
  kind: z.literal("tool-started"),
  turnId: nonEmptyString.optional(),
  toolCallId: nonEmptyString,
  toolName: nonEmptyString.optional(),
});
const anetComputerUseSessionClosedEventSchema = anetComputerUseOperationEventBaseSchema.extend({
  kind: z.literal("session-closed"),
});

export const anetComputerUseOperationEventSchema = z.discriminatedUnion("kind", [
  anetComputerUseTurnStartedEventSchema,
  anetComputerUseTurnCompletedEventSchema,
  anetComputerUseTurnFailedEventSchema,
  anetComputerUseToolScheduledEventSchema,
  anetComputerUseToolStartedEventSchema,
  anetComputerUseSessionClosedEventSchema,
]);
export type ANetComputerUseOperationEvent = z.infer<typeof anetComputerUseOperationEventSchema>;

export const anetSessionEventTypeSchema = z.enum([
  "session.created",
  "session.resumed",
  "session.updated",
  "session.titleUpdated",
  "session.closed",
  "turn.started",
  "turn.steerQueued",
  "turn.steerDrained",
  "turn.completed",
  "turn.failed",
  "message.upserted",
  "message.removed",
  "part.started",
  "part.delta",
  "part.upserted",
  "part.removed",
  "model.streaming",
  "tool.updated",
  "permission.requested",
  "permission.resolved",
  "userInput.requested",
  "userInput.resolved",
  "checkpoint.created",
  "rewind.triggered",
  "streamRecovery.updated",
]);
export type ANetSessionEventType = z.infer<typeof anetSessionEventTypeSchema>;

export const anetProtocolErrorDetailSchema = z
  .object({
    type: nonEmptyString,
    message: nonEmptyString,
    stack: z.string().optional(),
    code: z.string().optional(),
    detail: z.string().optional(),
    underlyingErrorMessage: z.string().optional(),
    underlyingErrorDetail: z.string().optional(),
    attribution: errorAttributionSchema.optional(),
    retryable: z.boolean().optional(),
    data: z.unknown().optional(),
  })
  .strict();
export const anetSessionCreatedEventPayloadSchema = z
  .object({
    mode: anetSessionModeSchema,
    contextWindow: z.number().int().nonnegative(),
  })
  .strict();
export const anetSessionResumedEventPayloadSchema = z
  .object({
    directory: nonEmptyString,
    interruptedToolCount: z.number().int().nonnegative(),
    messageCount: z.number().int().nonnegative(),
    partCount: z.number().int().nonnegative(),
    recoveredCompactTimelineCount: z.number().int().nonnegative().optional(),
    recoveredSteerInputCount: z.number().int().nonnegative().optional(),
    resumedTodoCount: z.number().int().nonnegative().optional(),
  })
  .strict();
export const anetSessionTitleUpdatedEventPayloadSchema = z
  .object({
    messageID: nonEmptyString.optional(),
    previousTitle: z.string(),
    source: z.enum(["default", "first_input", "generated", "custom"]),
    title: z.string(),
  })
  .strict();
export const anetTurnStartedEventPayloadSchema = z
  .object({
    // CLI 的高精度执行时间可含小数；漏声明会使 strict 校验丢弃整条开始事件，Bot 因此无法清空上一轮回复。
    executionStartedAt: z.number().nonnegative().optional(),
    turnNumber: z.number().int().nonnegative(),
    input: z.string(),
    inputId: nonEmptyString.optional(),
    queryId: nonEmptyString.optional(),
    // Bugfix：CLI 会把 Host 准入的后台执行归因写入 turn.started。这里漏声明时，
    // strict 校验会丢弃整条开始事件，复用中的 Bot 私聊订阅就无法切换到新轮次。
    automationId: nonEmptyString.optional(),
    offPeakTaskId: nonEmptyString.optional(),
    offPeakRunType: z.enum(["init", "resume"]).optional(),
    inputSource: anetTurnInputSourceSchema.optional(),
    inputVisibility: anetMessageVisibilitySchema.optional(),
    executionKind: z.enum(["agent", "controlOnly"]).optional(),
    targetId: nonEmptyString.optional(),
    messageId: nonEmptyString.optional(),
    foregroundExecutionId: nonEmptyString.optional(),
    intent: jsonObjectSchema.optional(),
    originMeta: jsonObjectSchema.optional(),
    // runtime 会透传后台唤醒来源，strict schema 必须同步声明以免丢弃整条事件。
    backgroundSource: z.enum(["bash", "subagent"]).optional(),
    attachments: z.array(jsonObjectSchema).optional(),
  })
  .strict();
const anetTurnSteerSourceSchema = z.enum(["plan_approval_feedback", "workflow_refine_feedback"]);
const anetTurnSteerCommandKindSchema = z.enum(["sendText", "sendGoalCommand", "compact"]);
const anetTurnSteerDeliverySchema = z.enum(["queue", "guide"]);

export const anetTurnSteerQueuedEventPayloadSchema = z
  .object({
    pendingInputId: nonEmptyString,
    inputId: nonEmptyString.optional(),
    queryId: nonEmptyString.optional(),
    input: z.string(),
    inputPreview: z.string(),
    inputSize: z.number().int().nonnegative(),
    commandKind: anetTurnSteerCommandKindSchema.optional(),
    source: anetTurnSteerSourceSchema.optional(),
    toolDisallowlist: z.array(nonEmptyString).optional(),
    delivery: anetTurnSteerDeliverySchema.optional(),
    targetTurnId: nonEmptyString,
    queueLength: z.number().int().nonnegative(),
    intent: jsonObjectSchema.optional(),
  })
  .strict();
export const anetTurnSteerDrainedEventPayloadSchema = z
  .object({
    pendingInputIds: z.array(nonEmptyString),
    queryIds: z.array(nonEmptyString).optional(),
    targetTurnId: nonEmptyString,
    injectedMessageIds: z.array(nonEmptyString),
    drainedInputs: z
      .array(
        z
          .object({
            pendingInputId: nonEmptyString,
            messageId: nonEmptyString,
            text: z.string(),
            delivery: anetTurnSteerDeliverySchema.optional(),
            intent: jsonObjectSchema.optional(),
            toolDisallowlist: z.array(nonEmptyString).optional(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();
export const anetTurnCompletedEventPayloadSchema = z
  .object({
    response: z.string(),
    tokenCount: z.number().int().nonnegative(),
    usage: z.unknown().optional(),
    toolCallCount: z.number().int().nonnegative(),
    historyRoundCount: z.number().int().nonnegative().optional(),
    duration: z.number().nonnegative(),
    // runtime turn.completed 会附带 cacheStats，协议 schema 之前漏掉该字段。
    // strict 校验失败会让桌面端丢掉终态事件，表现为消息已完成但 UI 一直没有回复。
    cacheStats: z
      .object({
        totalMessages: z.number().int().nonnegative(),
        cachedMessages: z.number().int().nonnegative(),
        lastCacheHit: z.boolean(),
        cacheReadTokens: z.number().int().nonnegative().optional(),
      })
      .strict()
      .optional(),
    inputId: nonEmptyString.optional(),
    resultType: z.enum([
      "success",
      // "cancelled": 用户主动中断属于正常结束，复用 turn.completed 上报，避免被映射成 turn.failed。
      "cancelled",
      "error_max_turns",
      "error_max_budget",
      "error_during_execution",
      "error_max_tool_calls",
    ]),
    backgroundSubagentResultConsumed: z.boolean().optional(),
  })
  .strict();
export const anetTurnFailedEventPayloadSchema = z
  .object({
    error: anetProtocolErrorDetailSchema,
    turnPhase: z.string(),
    inputId: nonEmptyString.optional(),
    backgroundSubagentResultConsumed: z.boolean().optional(),
  })
  .strict();
export const anetMessageUpsertedEventPayloadSchema = z
  .object({
    content: z.string(),
    attachments: z.array(z.unknown()).optional(),
    toolCalls: z.array(z.unknown()).optional(),
    type: z.string().optional(),
    compactBoundary: z.unknown().optional(),
  })
  .strict();
export const anetMessageRemovedEventPayloadSchema = z
  .object({
    messageId: nonEmptyString,
    reason: z.string().optional(),
  })
  .strict();
export const anetMessagePartDeltaEventPayloadSchema = z
  .object({
    messageId: nonEmptyString,
    partId: nonEmptyString,
    field: z.enum(["text", "reasoning", "input", "output"]).optional(),
    delta: z.string(),
  })
  .strict();
export const anetMessagePartUpsertedEventPayloadSchema = z
  .object({
    part: anetMessagePartSchema,
  })
  .strict();
export const anetMessagePartRemovedEventPayloadSchema = z
  .object({
    messageId: nonEmptyString,
    partId: nonEmptyString,
    reason: z.string().optional(),
  })
  .strict();
const anetToolCallBasePayloadSchema = z
  .object({
    toolCallId: nonEmptyString,
    toolName: z.string().optional(),
    parentToolCallId: nonEmptyString.optional(),
    source: z.enum(["subagent"]).optional(),
    agentId: nonEmptyString.optional(),
    agentType: nonEmptyString.optional(),
    // subagent mirror 会携带后台归因；strict schema 漏字段会让 session/event 整条被丢弃。
    background: z.boolean().optional(),
    childSessionId: nonEmptyString.optional(),
    childToolCallId: nonEmptyString.optional(),
    description: z.string().optional(),
  })
  .strict();

export const anetToolUpdatedEventPayloadSchema = z.discriminatedUnion("kind", [
  anetToolCallBasePayloadSchema
    .extend({
      kind: z.literal("scheduled"),
      // 修复：CLI 调度事件已携带所属消息 ID；漏声明会让严格校验丢弃整条事件。
      assistantMessageId: nonEmptyString.optional(),
      toolName: nonEmptyString,
      input: z.unknown().optional(),
      inputByteLength: z.number().int().nonnegative().optional(),
      inputOmitted: z.boolean().optional(),
      inputRef: z.literal("model_stream").optional(),
      dependencies: z.array(nonEmptyString).optional(),
      parallelGroupIndex: z.number().int().nonnegative().optional(),
      canRunParallel: z.boolean().optional(),
      schedule: jsonObjectSchema.optional(),
    })
    .strict(),
  anetToolCallBasePayloadSchema
    .extend({
      kind: z.literal("started"),
      startedAt: protocolInstantSchema,
    })
    .strict(),
  anetToolCallBasePayloadSchema
    .extend({
      kind: z.literal("progress"),
      elapsedMs: z.number().nonnegative().optional(),
      pid: z.number().int().optional(),
      stdoutBytes: z.number().int().nonnegative().optional(),
      stderrBytes: z.number().int().nonnegative().optional(),
      outputBytes: z.number().int().nonnegative().optional(),
      outputPreview: executionOutputPreviewSchema.optional(),
      stdoutTail: z.string().optional(),
      stderrTail: z.string().optional(),
    })
    .strict(),
  anetToolCallBasePayloadSchema
    .extend({
      kind: z.literal("result"),
      result: anetToolResultObjectSchema,
      duration: z.number().nonnegative(),
    })
    .strict(),
  anetToolCallBasePayloadSchema
    .extend({
      kind: z.literal("error"),
      error: anetProtocolErrorDetailSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("batch"),
      toolCallIds: z.array(nonEmptyString),
      successCount: z.number().int().nonnegative(),
      errorCount: z.number().int().nonnegative(),
    })
    .strict(),
  anetToolCallBasePayloadSchema
    .extend({
      kind: z.literal("raw"),
      payload: jsonObjectSchema,
    })
    .strict(),
]);
export const anetPermissionRequestedEventPayloadSchema = z
  .object({
    requestId: nonEmptyString.optional(),
    toolCallId: nonEmptyString,
    toolName: nonEmptyString,
    riskLevel: z.enum(["low", "medium", "high", "critical"]),
    reason: z.string(),
    input: z.unknown(),
    suggestedPermissionUpdates: z.array(anetPermissionUpdateSchema).optional(),
    approvalMode: z.literal("user-once").optional(),
    origin: anetInteractionRequestOriginSchema.optional(),
    options: z.array(anetPermissionOptionSchema).min(1),
    childSessionId: nonEmptyString.optional(),
    background: z.boolean().optional(),
  })
  .strict();
export const anetPermissionResolvedEventPayloadSchema = z
  .object({
    requestId: nonEmptyString.optional(),
    toolCallId: nonEmptyString,
    toolName: nonEmptyString.optional(),
    decision: anetPermissionDecisionSchema.optional(),
    reason: z.string().optional(),
    modifiedInput: z.unknown().optional(),
    inputSummary: z.unknown().optional(),
    childSessionId: nonEmptyString.optional(),
    background: z.boolean().optional(),
  })
  .strict();
export const anetUserInputRequestedEventPayloadSchema = z
  .object({
    requestId: nonEmptyString,
    prompt: z.string(),
    inputType: z.enum(["text", "choice", "confirm"]).optional(),
    choices: z.array(z.string()).optional(),
  })
  .strict();
export const anetUserInputResolvedEventPayloadSchema = z
  .object({
    requestId: nonEmptyString,
    value: z.unknown().optional(),
    cancelled: z.boolean().optional(),
  })
  .strict();
export const anetSessionClosedEventPayloadSchema = z
  .object({
    reason: z.string().optional(),
  })
  .strict();

function anetSessionEventEnvelopeFor<T extends ANetSessionEventType>(
  type: T,
  payload: z.ZodTypeAny,
) {
  return anetEventEnvelopeSchema.extend({
    type: z.literal(type),
    payload: payload.optional(),
  });
}

export const anetSessionEventSchema = z.discriminatedUnion("type", [
  anetSessionEventEnvelopeFor("session.created", anetSessionCreatedEventPayloadSchema),
  anetSessionEventEnvelopeFor("session.resumed", anetSessionResumedEventPayloadSchema),
  anetSessionEventEnvelopeFor("session.updated", jsonObjectSchema),
  anetSessionEventEnvelopeFor("session.titleUpdated", anetSessionTitleUpdatedEventPayloadSchema),
  anetSessionEventEnvelopeFor("session.closed", anetSessionClosedEventPayloadSchema),
  anetSessionEventEnvelopeFor("turn.started", anetTurnStartedEventPayloadSchema),
  anetSessionEventEnvelopeFor("turn.steerQueued", anetTurnSteerQueuedEventPayloadSchema),
  anetSessionEventEnvelopeFor("turn.steerDrained", anetTurnSteerDrainedEventPayloadSchema),
  anetSessionEventEnvelopeFor("turn.completed", anetTurnCompletedEventPayloadSchema),
  anetSessionEventEnvelopeFor("turn.failed", anetTurnFailedEventPayloadSchema),
  anetSessionEventEnvelopeFor("message.upserted", anetMessageUpsertedEventPayloadSchema),
  anetSessionEventEnvelopeFor("message.removed", anetMessageRemovedEventPayloadSchema),
  anetSessionEventEnvelopeFor("part.started", anetMessagePartUpsertedEventPayloadSchema),
  anetSessionEventEnvelopeFor("part.delta", anetMessagePartDeltaEventPayloadSchema),
  anetSessionEventEnvelopeFor("part.upserted", anetMessagePartUpsertedEventPayloadSchema),
  anetSessionEventEnvelopeFor("part.removed", anetMessagePartRemovedEventPayloadSchema),
  anetSessionEventEnvelopeFor("model.streaming", anetModelStreamingEventPayloadSchema),
  anetSessionEventEnvelopeFor("tool.updated", anetToolUpdatedEventPayloadSchema),
  anetSessionEventEnvelopeFor("permission.requested", anetPermissionRequestedEventPayloadSchema),
  anetSessionEventEnvelopeFor("permission.resolved", anetPermissionResolvedEventPayloadSchema),
  anetSessionEventEnvelopeFor("userInput.requested", anetUserInputRequestedEventPayloadSchema),
  anetSessionEventEnvelopeFor("userInput.resolved", anetUserInputResolvedEventPayloadSchema),
  anetSessionEventEnvelopeFor("checkpoint.created", jsonObjectSchema),
  anetSessionEventEnvelopeFor("rewind.triggered", jsonObjectSchema),
  anetSessionEventEnvelopeFor("streamRecovery.updated", jsonObjectSchema),
]);
export type ANetSessionEvent = z.infer<typeof anetSessionEventSchema>;

export const anetSessionEventsResultSchema = z
  .object({
    events: z.array(anetSessionEventSchema),
  })
  .strict();
export const anetSessionMessagesResultSchema = z
  .object({
    messages: z.array(anetMessageWithPartsSchema),
  })
  .strict();
export const anetStateUpdatedNotificationSchema = z
  .object({
    type: z.literal("state.updated"),
    scope: z.enum(["server", "workspace", "session"]),
    workspace: anetWorkspaceRefSchema.optional(),
    sessionId: nonEmptyString.optional(),
    revision: z.number().int().nonnegative(),
    reason: z.string().optional(),
    patch: z.unknown(),
  })
  .strict();
export type ANetStateUpdatedNotification = z.infer<typeof anetStateUpdatedNotificationSchema>;

export const anetSessionSubscribeParamsSchema = z
  .object({
    sessionId: nonEmptyString,
    deliveryKind: anetDeliveryKindSchema,
    afterSeq: z.number().int().nonnegative().optional(),
    includeSnapshot: z.boolean().default(false),
  })
  .strict();
export type ANetSessionSubscribeParams = z.infer<typeof anetSessionSubscribeParamsSchema>;

export const anetSessionSubscribeResultSchema = z
  .object({
    sessionId: nonEmptyString,
    eventSeq: z.number().int().nonnegative(),
    events: z.array(anetSessionEventSchema),
    snapshot: anetSessionStateSnapshotSchema.optional(),
  })
  .strict();
export const anetSessionListResultSchema = z
  .object({
    sessions: z.array(anetSessionInfoSchema),
  })
  .strict();

const anetSessionSubagentBaseSchema = z
  .object({
    childSessionId: nonEmptyString,
    agentId: nonEmptyString.optional(),
    toolCallId: nonEmptyString.optional(),
    subagentType: nonEmptyString,
    title: nonEmptyString,
    summary: z.string().optional(),
    startedAt: z.number().int().nonnegative().optional(),
    endedAt: z.number().int().nonnegative().optional(),
  })
  .strict();

export const anetSessionRunningSubagentSchema = anetSessionSubagentBaseSchema.extend({
  status: z.enum(["running", "waiting", "blocked"]),
});
export type ANetSessionRunningSubagent = z.infer<typeof anetSessionRunningSubagentSchema>;

export const anetSessionEndedSubagentSchema = anetSessionSubagentBaseSchema.extend({
  status: z.enum(["success", "failed", "cancelled", "lost"]),
});
export type ANetSessionEndedSubagent = z.infer<typeof anetSessionEndedSubagentSchema>;

export const anetSessionSubagentsResultSchema = z
  .object({
    revision: z.number().int().nonnegative(),
    childSessionIds: z.array(nonEmptyString),
    running: z.array(anetSessionRunningSubagentSchema),
    ended: z
      .object({
        total: z.number().int().nonnegative(),
        items: z.array(anetSessionEndedSubagentSchema),
        nextCursor: nonEmptyString.optional(),
      })
      .strict(),
  })
  .strict();
export type ANetSessionSubagentsResult = z.infer<typeof anetSessionSubagentsResultSchema>;
/** 服务端 feature key 的取值域在协议里的 zod 形态（packages/shared/src/dynamic-workflow-feature.ts）。 */
export const anetDynamicWorkflowModeSchema = z.enum(DYNAMIC_WORKFLOW_MODES);

export const anetSessionCreateParamsSchema = z
  .object({
    additionalDirectories: z.array(nonEmptyString).max(256).optional(),
    sessionId: nonEmptyString.optional(),
    workspace: anetWorkspaceRefSchema,
    parentSessionId: nonEmptyString.optional(),
    mode: anetSessionModeSchema.optional(),
    model: modelSelectionSchema.optional(),
    persistence: anetSessionPersistenceSchema.optional(),
    thoughtLevel: nonEmptyString.optional(),
    titleGenerationEnabled: z.boolean().optional(),
    mcpServers: z.array(anetProtocolMcpServerSchema).optional(),
    toolAllowlist: z.array(nonEmptyString).optional(),
    toolDenylist: z.array(nonEmptyString).optional(),
    importedHistory: anetSessionImportHistorySchema.optional(),
    // host 只按本地服务装配/远程/端形态决定是否注册工具，不读取灰度；
    // 缺省不下发 = 不注册；灰度与套餐准入在实际创建的 Host handler 校验。
    offPeakToolEnabled: z.boolean().optional(),
    // 动态工作流灰度：与 offPeakToolEnabled 同一
    // 模式——host 裁决后下发，缺省不下发 = 不注册工作流工具簇（fail-closed）。
    dynamicWorkflowEnabled: z.boolean().optional(),
    // 灰度 mode 随布尔同行下发（launch.md「On demand: activation」）：`onDemand` 让 CLI 把十个
    // 工具推迟到会话首次 `/workflow` 才注册；缺席 = 按布尔行事（alwaysOn），供旧 Host 配对。
    dynamicWorkflowMode: anetDynamicWorkflowModeSchema.optional(),
  })
  .strict();
export type ANetSessionCreateParams = z.infer<typeof anetSessionCreateParamsSchema>;

export const anetSessionResumeParamsSchema = z
  .object({
    additionalDirectories: z.array(nonEmptyString).max(256).optional(),
    sessionId: nonEmptyString,
    workspace: anetWorkspaceRefSchema.optional(),
    // 旧 session 尚无 runtime/model_selection entry 时，由同 task 的索引元数据提供迁移 hint。
    thoughtLevel: nonEmptyString.optional(),
    mcpServers: z.array(anetProtocolMcpServerSchema).optional(),
    // 冷恢复重建 runtime 时必须沿用 create 的工具面约束（否则会绕过 allow/deny，尤其 CUA 会话）。
    toolAllowlist: z.array(nonEmptyString).optional(),
    toolDenylist: z.array(nonEmptyString).optional(),
    // 与 create 同语义；resume 不带会导致冷恢复丢 Off-Peak 工具面。
    offPeakToolEnabled: z.boolean().optional(),
    // 与 create 同语义；resume 不带会导致冷恢复丢工作流工具簇。
    dynamicWorkflowEnabled: z.boolean().optional(),
    dynamicWorkflowMode: anetDynamicWorkflowModeSchema.optional(),
  })
  .strict();
export type ANetSessionResumeParams = z.infer<typeof anetSessionResumeParamsSchema>;

export const anetSessionListParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema.optional(),
    sessionIds: z.array(nonEmptyString).min(1).max(64).optional(),
    limit: z.number().int().positive().optional(),
  })
  .strict();
export type ANetSessionListParams = z.infer<typeof anetSessionListParamsSchema>;

export const anetSessionSubagentsParamsSchema = z
  .object({
    sessionId: nonEmptyString,
    endedCursor: nonEmptyString.optional(),
    endedLimit: z.number().int().positive().max(100).default(20),
  })
  .strict();
export type ANetSessionSubagentsParams = z.infer<typeof anetSessionSubagentsParamsSchema>;

export const anetUsageStatsParamsSchema = z
  .object({
    range: z.enum(APP_USAGE_RANGES),
    timeZone: z.string().optional(),
  })
  .strict();
export const anetUsageStatsResultSchema = appUsageSnapshotSchema;
export const anetTaskTokenUsageParamsSchema = z
  .object({
    sessionId: nonEmptyString,
  })
  .strict();
export const anetTaskTokenUsageResultSchema = z
  .object({
    sessionId: nonEmptyString,
    totalTokens: z.number().int().nonnegative(),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    reasoningTokens: z.number().int().nonnegative(),
    cacheCreationTokens: z.number().int().nonnegative(),
    cacheReadTokens: z.number().int().nonnegative(),
    modelRequestCount: z.number().int().nonnegative(),
    modelErrorCount: z.number().int().nonnegative(),
    inputBaselineBySource: z.record(z.string(), z.number().int().nonnegative()),
  })
  .strict();
export type ANetTaskTokenUsageResult = z.infer<typeof anetTaskTokenUsageResultSchema>;

export const anetSessionReadParamsSchema = z
  .object({
    sessionId: nonEmptyString,
    deliveryKind: anetDeliveryKindSchema.optional(),
    messageLimit: z.number().int().positive().optional(),
    afterSeq: z.number().int().nonnegative().optional(),
    // "index"：仅 task index resync 使用，返回剥离 tool/reasoning/data URL 大载荷的同结构 snapshot，
    // 结果禁止回写 UI 状态；缺省等同 "full"。
    contentProfile: z.enum(["full", "index"]).optional(),
  })
  .strict();
export type ANetSessionReadParams = z.infer<typeof anetSessionReadParamsSchema>;

export const anetSessionMessagesParamsSchema = z
  .object({
    sessionId: nonEmptyString,
    afterMessageId: nonEmptyString.optional(),
    limit: z.number().int().positive().optional(),
  })
  .strict();
export type ANetSessionMessagesParams = z.infer<typeof anetSessionMessagesParamsSchema>;

export const anetSessionEventsParamsSchema = z
  .object({
    sessionId: nonEmptyString,
    afterSeq: z.number().int().nonnegative().optional(),
    limit: z.number().int().positive().optional(),
  })
  .strict();
export type ANetSessionEventsParams = z.infer<typeof anetSessionEventsParamsSchema>;

export const anetSessionRuntimePreferencesScopeSchema = z.enum([
  "runtime-materialization",
  "user-execution",
]);
export type ANetSessionRuntimePreferencesScope = z.infer<
  typeof anetSessionRuntimePreferencesScopeSchema
>;

// subagents/readRuntimeConfig 返回 Host 已解析的完整快照或显式内置回退，不再传 Markdown。
export {
  subagentRuntimeConfigSchema,
  type SubagentRuntimeConfig,
} from "../subagent-runtime-config.js";
export const anetSubagentsReadRuntimeConfigParamsSchema = z
  .object({ sessionId: nonEmptyString, workspace: anetWorkspaceRefSchema.optional() })
  .strict();

export const ANET_SESSION_RUNTIME_PREFERENCES_REQUEST_TIMEOUT_MS = 15_000;

export const anetSessionRequestRuntimePreferencesParamsSchema = z
  .object({
    sessionId: nonEmptyString,
    scope: anetSessionRuntimePreferencesScopeSchema,
    workspace: anetWorkspaceRefSchema.optional(),
    // CLI 依据持久化父链给出目录来源；目标 sessionId 仍保留 child 身份。
    directorySessionId: nonEmptyString.optional(),
  })
  .strict();
export type ANetSessionRequestRuntimePreferencesParams = z.infer<
  typeof anetSessionRequestRuntimePreferencesParamsSchema
>;

export const DEFAULT_ANET_MODEL_CONTEXT_BUDGET_STRATEGY = "preflight-v1" as const;

// 3.12.2：legacy 仅为旧协议接收兼容；Runtime 一律归一为上面的共享默认策略。
export const anetModelContextBudgetStrategySchema = z.enum(["legacy", "preflight-v1"]);
export type ANetModelContextBudgetStrategy = z.infer<typeof anetModelContextBudgetStrategySchema>;

export const anetSessionRuntimePreferencesResultSchema = z
  .object({
    additionalDirectories: z.array(nonEmptyString).max(256).optional(),
    nativeSearchEnhancementsEnabled: z.boolean(),
    toolSearchMode: appToolSearchModeSchema.default("off"),
    subagentRuntimeConfigEnabled: z.boolean().optional(),
    memoryEnabled: z.boolean().default(false),
    askUserQuestionAutoResolutionEnabled: z.boolean().default(true),
    integratedTerminalShell: integratedTerminalShellSelectionSchema.optional(),
    // 兼容旧 Host：缺少字段时在协议解析边界使用当前默认策略。
    modelContextBudgetStrategy: anetModelContextBudgetStrategySchema.default(
      DEFAULT_ANET_MODEL_CONTEXT_BUDGET_STRATEGY,
    ),
  })
  .strict();
export type ANetSessionRuntimePreferencesResult = z.infer<
  typeof anetSessionRuntimePreferencesResultSchema
>;

/**
 * App 在提交 prompt 前只读采集的 IAB 可见状态。该字段只用于 provider-visible
 * ambient context，不进入用户可见 transcript；内容有界，禁止携带页面正文或凭据。
 */
export const anetBrowserAmbientContextSchema = z
  .object({
    tabCount: z.number().int().positive().max(100),
    currentUrl: z.string().trim().min(1).max(4096).optional(),
  })
  .strict();
export type ANetBrowserAmbientContext = z.infer<typeof anetBrowserAmbientContextSchema>;

export const anetSessionSendParamsSchema = z
  .object({
    sessionId: nonEmptyString,
    modelSelection: modelSelectionSchema.optional(),
    modelExecution: modelExecutionSchema.optional(),
    inputId: nonEmptyString.optional(),
    queryId: nonEmptyString.optional(),
    content: z.string(),
    attachments: z.array(jsonObjectSchema).optional(),
    browserAmbientContext: anetBrowserAmbientContextSchema.optional(),
    expectedRevision: z.number().int().nonnegative().optional(),
    expectedProviderRevision: nonEmptyString.optional(),
    automationId: nonEmptyString.optional(),
    offPeakTaskId: nonEmptyString.optional(),
    offPeakRunType: z.enum(["init", "resume"]).optional(),
    botDeliveryTarget: anetAutomationBotDeliveryTargetSchema.optional(),
    toolDenylist: z.array(nonEmptyString).optional(),
  })
  .strict()
  .superRefine((payload, context) => {
    if (payload.automationId && payload.offPeakTaskId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "automationId and offPeakTaskId are mutually exclusive",
      });
    }
    if (payload.offPeakRunType && !payload.offPeakTaskId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "offPeakRunType requires offPeakTaskId",
        path: ["offPeakRunType"],
      });
    }
    if (payload.modelExecution && !payload.modelSelection) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "modelExecution requires modelSelection",
        path: ["modelExecution"],
      });
    }
  });
export const anetSessionSendResultSchema = z
  .object({
    sessionId: nonEmptyString,
    accepted: z.literal(true),
    stateRevision: z.number().int().nonnegative(),
  })
  .strict();
export type ANetSessionSendResult = z.infer<typeof anetSessionSendResultSchema>;

export const anetSessionHistoryTargetSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("turn"),
      turnIndex: z.number().int().nonnegative(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("message"),
      messageId: nonEmptyString,
    })
    .strict(),
  z
    .object({
      kind: z.literal("checkpoint"),
      checkpointId: nonEmptyString,
    })
    .strict(),
  z
    .object({
      kind: z.literal("latestCheckpoint"),
    })
    .strict(),
]);
export type ANetSessionHistoryTarget = z.infer<typeof anetSessionHistoryTargetSchema>;

export const anetSessionForkParamsSchema = z
  .object({
    sessionId: nonEmptyString,
    target: anetSessionHistoryTargetSchema.default({
      kind: "latestCheckpoint",
    }),
    expectedRevision: z.number().int().nonnegative().optional(),
  })
  .strict();
export type ANetSessionForkParams = z.infer<typeof anetSessionForkParamsSchema>;

export const anetSessionForkResultSchema = z
  .object({
    forkedSessionId: nonEmptyString,
    parentSessionId: nonEmptyString.optional(),
    targetMessageId: nonEmptyString.optional(),
    targetCheckpointId: nonEmptyString.optional(),
    response: z.string(),
    snapshot: anetSessionStateSnapshotSchema,
  })
  .strict();
export type ANetSessionForkResult = z.infer<typeof anetSessionForkResultSchema>;

export const anetSessionCompactParamsSchema = z
  .object({
    sessionId: nonEmptyString,
    inputId: nonEmptyString.optional(),
    instructions: z.string().optional(),
    expectedRevision: z.number().int().nonnegative().optional(),
  })
  .strict();
export type ANetSessionCompactParams = z.infer<typeof anetSessionCompactParamsSchema>;

export const anetSessionCompactResultSchema = z
  .object({
    response: z.string(),
    snapshot: anetSessionStateSnapshotSchema,
    compact: z
      .object({
        state: z.enum(["accepted", "already_running"]),
        inputId: nonEmptyString.optional(),
        operationId: nonEmptyString.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type ANetSessionCompactResult = z.infer<typeof anetSessionCompactResultSchema>;

export const anetSessionGoalActionSchema = z.enum([
  "show",
  "set",
  "replace",
  "pause",
  "resume",
  "clear",
]);
export type ANetSessionGoalAction = z.infer<typeof anetSessionGoalActionSchema>;

export const anetSessionGoalParamsSchema = z
  .object({
    sessionId: nonEmptyString,
    inputId: nonEmptyString.optional(),
    action: anetSessionGoalActionSchema,
    objective: z.string().optional(),
    expectedRevision: z.number().int().nonnegative().optional(),
  })
  .strict();
export type ANetSessionGoalParams = z.infer<typeof anetSessionGoalParamsSchema>;

export const anetSessionGoalResultSchema = z
  .object({
    response: z.string(),
    snapshot: anetSessionStateSnapshotSchema,
    startedTurn: z.boolean().optional(),
  })
  .strict();
export type ANetSessionGoalResult = z.infer<typeof anetSessionGoalResultSchema>;

export const anetSessionStopParamsSchema = z
  .object({
    sessionId: nonEmptyString,
  })
  .strict();
const anetBackgroundTaskInfoStatusSchema = z.enum([
  "running",
  "completed",
  "failed",
  "timed_out",
  "cancelled",
  "spawn_error",
  "lost",
]);

export const anetBackgroundTaskInfoSchema = z
  .object({
    taskId: nonEmptyString,
    toolCallId: nonEmptyString.optional(),
    toolName: nonEmptyString.optional(),
    taskKind: z.enum(["bash", "subagent"]).optional(),
    blocked: z.boolean().optional(),
    blockedReason: z.string().optional(),
    cancellable: z.boolean().optional(),
    cancelRequestedAt: protocolInstantSchema.optional(),
    command: z.string().optional(),
    description: z.string().optional(),
    status: anetBackgroundTaskInfoStatusSchema,
    pid: z.number().int().positive().optional(),
    startedAt: protocolInstantSchema.optional(),
    completedAt: protocolInstantSchema.optional(),
    outputPath: z.string().optional(),
    stderrPersistedOutputPath: z.string().optional(),
    stdoutPersistedOutputPath: z.string().optional(),
    outputBytes: z.number().int().nonnegative().optional(),
    outputTruncated: z.boolean().optional(),
    outputTail: z.string().optional(),
    stderrBytes: z.number().int().nonnegative().optional(),
    stderrTail: z.string().optional(),
    stdoutBytes: z.number().int().nonnegative().optional(),
    stdoutTail: z.string().optional(),
    terminalId: nonEmptyString.optional(),
  })
  .strict();
export const anetSessionCancelBackgroundTaskParamsSchema = z
  .object({
    sessionId: nonEmptyString,
    taskId: nonEmptyString,
  })
  .strict();
export type ANetSessionCancelBackgroundTaskParams = z.infer<
  typeof anetSessionCancelBackgroundTaskParamsSchema
>;

export const anetSessionCancelBackgroundTaskResultSchema = z
  .object({
    cancelled: z.boolean(),
    reason: z.string().optional(),
    snapshot: anetBackgroundTaskInfoSchema.optional(),
    status: anetBackgroundTaskInfoStatusSchema,
    taskId: nonEmptyString,
  })
  .strict();
export type ANetSessionCancelBackgroundTaskResult = z.infer<
  typeof anetSessionCancelBackgroundTaskResultSchema
>;

export const anetSessionSetModelParamsSchema = z
  .object({
    sessionId: nonEmptyString,
    model: modelSelectionSchema,
    expectedRevision: z.number().int().nonnegative().optional(),
    persistAsWorkspaceLastUsed: z.boolean().default(true),
  })
  .strict();
export type ANetSessionSetModelParams = z.infer<typeof anetSessionSetModelParamsSchema>;

export const anetSessionSetThoughtLevelParamsSchema = z
  .object({
    sessionId: nonEmptyString,
    thoughtLevel: nonEmptyString.optional(),
    expectedRevision: z.number().int().nonnegative().optional(),
    persistAsWorkspaceLastUsed: z.boolean().default(true),
  })
  .strict();
export type ANetSessionSetThoughtLevelParams = z.infer<
  typeof anetSessionSetThoughtLevelParamsSchema
>;

export const anetSessionSetModeParamsSchema = z
  .object({
    sessionId: nonEmptyString,
    mode: anetSessionModeSchema,
    expectedRevision: z.number().int().nonnegative().optional(),
  })
  .strict();
export type ANetSessionSetModeParams = z.infer<typeof anetSessionSetModeParamsSchema>;

export const anetSessionCloseParamsSchema = z
  .object({
    sessionId: nonEmptyString,
    expectedPersistence: anetSessionPersistenceSchema.optional(),
  })
  .strict();
export type ANetSessionCloseParams = z.infer<typeof anetSessionCloseParamsSchema>;
export const anetSessionCloseResultSchema = z
  .object({
    closed: z.boolean().optional(),
  })
  .strict();
export type ANetSessionCloseResult = z.infer<typeof anetSessionCloseResultSchema>;
export const anetWorkspaceReadPresentationParamsSchema = z
  .object({ workspace: anetWorkspaceRefSchema })
  .strict();
export const anetWorkspacePresentationSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    mode: anetSessionModeSchema,
    slashCommands: z.array(anetSlashCommandSchema),
  })
  .strict();
export type ANetWorkspacePresentation = z.infer<typeof anetWorkspacePresentationSchema>;
const workspaceHookSha256DigestSchema = z.string().regex(/^[a-f0-9]{64}$/u);
export const anetWorkspaceHookTrustGrantParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    bundleDigest: workspaceHookSha256DigestSchema,
    hookDeclarationDigest: workspaceHookSha256DigestSchema,
  })
  .strict();
export type ANetWorkspaceHookTrustGrantParams = z.infer<
  typeof anetWorkspaceHookTrustGrantParamsSchema
>;
export const anetWorkspaceHookTrustGrantReasonCodeSchema = z.enum([
  "workspace_hooks_blocked_by_policy",
  "workspace_hooks_bundle_changed",
  "workspace_hooks_snapshot_mismatch",
  "workspace_hooks_policy_requires_pretrust",
  "workspace_hooks_trust_store_corrupt",
  "workspace_hooks_config_unreadable",
]);
export type ANetWorkspaceHookTrustGrantReasonCode = z.infer<
  typeof anetWorkspaceHookTrustGrantReasonCodeSchema
>;
export const anetWorkspaceHookTrustGrantResultSchema = z
  .object({
    accepted: z.boolean(),
    reasonCode: anetWorkspaceHookTrustGrantReasonCodeSchema.optional(),
  })
  .strict();
export type ANetWorkspaceHookTrustGrantResult = z.infer<
  typeof anetWorkspaceHookTrustGrantResultSchema
>;
const anetWorkspaceModelToolCallSchema = z
  .object({
    id: nonEmptyString,
    name: nonEmptyString,
    input: z.unknown(),
  })
  .strict();
const anetWorkspaceModelMessageSchema = z.discriminatedUnion("role", [
  z.object({ role: z.literal("system"), content: z.string() }).strict(),
  z.object({ role: z.literal("user"), content: z.string() }).strict(),
  z
    .object({
      role: z.literal("assistant"),
      content: z.string(),
      toolCalls: z.array(anetWorkspaceModelToolCallSchema).optional(),
    })
    .strict(),
  z
    .object({
      role: z.literal("tool"),
      content: z.string(),
      toolCallId: nonEmptyString,
      toolName: nonEmptyString,
      isError: z.boolean().optional(),
    })
    .strict(),
]);
const anetWorkspaceModelToolSchema = z
  .object({
    name: nonEmptyString,
    description: z.string().optional(),
    inputSchema: z.record(z.string(), z.unknown()),
  })
  .strict();

export const anetWorkspaceGenerateTextParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    selection: modelSelectionSchema,
    prompt: nonEmptyString.optional(),
    messages: z.array(anetWorkspaceModelMessageSchema).min(1).optional(),
    tools: z.array(anetWorkspaceModelToolSchema).optional(),
    querySource: nonEmptyString,
    maxOutputTokens: z.number().int().positive().optional(),
    operationId: nonEmptyString.optional(),
  })
  .strict()
  .refine((value) => value.prompt !== undefined || value.messages !== undefined, {
    message: "prompt 或 messages 至少需要提供一个",
  });
export const anetWorkspaceGenerateTextResultSchema = z
  .object({
    text: z.string(),
    selection: modelSelectionSchema,
    toolCalls: z.array(anetWorkspaceModelToolCallSchema).optional(),
    // 可选以兼容仍在运行的旧 app-server；新 CLI 始终返回结构化结束原因。
    finishReason: z.string().optional(),
    usage: z
      .object({
        inputTokens: z.number().nonnegative().optional(),
        outputTokens: z.number().nonnegative().optional(),
        totalTokens: z.number().nonnegative().optional(),
        cacheReadTokens: z.number().nonnegative().optional(),
        cacheWriteTokens: z.number().nonnegative().optional(),
        reasoningTokens: z.number().nonnegative().optional(),
        serverToolUse: z
          .object({
            webSearchRequests: z.number().nonnegative().optional(),
            webFetchRequests: z.number().nonnegative().optional(),
          })
          .strict()
          .optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type ANetWorkspaceGenerateTextParams = z.infer<typeof anetWorkspaceGenerateTextParamsSchema>;
export type ANetWorkspaceModelMessage = z.infer<typeof anetWorkspaceModelMessageSchema>;
export type ANetWorkspaceModelTool = z.infer<typeof anetWorkspaceModelToolSchema>;
export type ANetWorkspaceGenerateTextResult = z.infer<typeof anetWorkspaceGenerateTextResultSchema>;
export const anetWorkspaceCancelGenerateTextParamsSchema = z
  .object({ operationId: nonEmptyString })
  .strict();
export const anetWorkspaceCancelGenerateTextResultSchema = z
  .object({ operationId: nonEmptyString, cancelled: z.boolean() })
  .strict();

export const anetProviderTestModelConnectivityParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    selection: modelSelectionSchema,
  })
  .strict();
export const anetProviderTestModelConnectivityResultSchema = z
  .object({ success: z.literal(true) })
  .strict();
export type ANetProviderTestModelConnectivityParams = z.infer<
  typeof anetProviderTestModelConnectivityParamsSchema
>;
export type ANetProviderTestModelConnectivityResult = z.infer<
  typeof anetProviderTestModelConnectivityResultSchema
>;

export const anetProviderUpdateAccountConfigParamsSchema = z
  .object({
    revision: nonEmptyString,
    basedOnANetBuiltinRevision: nonEmptyString,
    // Provider Config 的字段校验由 @anet/provider 负责；协议层只约束可传输信封。
    providers: z.record(z.string(), z.unknown()),
    // 账号状态与 Overlay 必须一起传递，否则 Worker 会丢失非当前套餐的执行门禁。
    states: z.record(
      z.string(),
      z
        .object({
          availability: z.enum(["available", "pending", "unavailable", "unknown"]),
          entitled: z.boolean(),
          unavailableReason: accountProviderUnavailableReasonSchema.optional(),
          current: z.boolean().optional(),
          connectionKey: z.string().optional(),
          effectiveAt: z.number().finite().optional(),
        })
        .strict(),
    ),
  })
  .strict();
export const anetProviderUpdateAccountConfigResultSchema = z
  .object({
    // 收到账号结果不代表配套 Built-in 已到达；应用版本只能读取 Registry 快照。
    receivedRevision: nonEmptyString,
    providerCount: z.number().int().nonnegative(),
    status: z.enum(["received", "unchanged"]),
  })
  .strict();
export type ANetProviderUpdateAccountConfigResult = z.infer<
  typeof anetProviderUpdateAccountConfigResultSchema
>;
/** Worker 从所属 Environment 的正式 Config Store 重建进程内 Provider Registry。 */
export const anetProviderRefreshRegistryParamsSchema = z
  .object({
    reason: nonEmptyString,
  })
  .strict();
export const anetProviderRefreshRegistryResultSchema = z
  .object({
    refreshed: z.literal(true),
  })
  .strict();
export type ANetProviderRefreshRegistryParams = z.infer<
  typeof anetProviderRefreshRegistryParamsSchema
>;
export type ANetProviderRefreshRegistryResult = z.infer<
  typeof anetProviderRefreshRegistryResultSchema
>;
export const anetInteractionPreferencesSchema = z
  .object({
    askUserQuestionAutoResolutionEnabled: z.boolean(),
  })
  .strict();
export type ANetInteractionPreferences = z.infer<typeof anetInteractionPreferencesSchema>;

export const anetWorkspaceUpdateInteractionPreferencesParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    preferences: anetInteractionPreferencesSchema,
  })
  .strict();
export type ANetWorkspaceUpdateInteractionPreferencesParams = z.infer<
  typeof anetWorkspaceUpdateInteractionPreferencesParamsSchema
>;

export const anetWorkspaceUpdateInteractionPreferencesResultSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    askUserQuestionAutoResolutionEnabled: z.boolean(),
    snoozedInteractionCount: z.number().int().nonnegative(),
  })
  .strict();
export type ANetWorkspaceUpdateInteractionPreferencesResult = z.infer<
  typeof anetWorkspaceUpdateInteractionPreferencesResultSchema
>;

export const anetModelIoPreferencesSchema = z
  .object({
    fullRetentionEnabled: z.boolean(),
  })
  .strict();
export type ANetModelIoPreferences = z.infer<typeof anetModelIoPreferencesSchema>;

export const anetWorkspaceUpdateModelIoPreferencesParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    preferences: anetModelIoPreferencesSchema,
  })
  .strict();
export type ANetWorkspaceUpdateModelIoPreferencesParams = z.infer<
  typeof anetWorkspaceUpdateModelIoPreferencesParamsSchema
>;

export const anetWorkspaceUpdateModelIoPreferencesResultSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    fullRetentionEnabled: z.boolean(),
    updatedSessionCount: z.number().int().nonnegative(),
  })
  .strict();
export type ANetWorkspaceUpdateModelIoPreferencesResult = z.infer<
  typeof anetWorkspaceUpdateModelIoPreferencesResultSchema
>;

export const anetWorkspaceUpdateOffPeakToolPolicyParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    enabled: z.boolean(),
  })
  .strict();
export type ANetWorkspaceUpdateOffPeakToolPolicyParams = z.infer<
  typeof anetWorkspaceUpdateOffPeakToolPolicyParamsSchema
>;

export const anetWorkspaceUpdateOffPeakToolPolicyResultSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    enabled: z.boolean(),
  })
  .strict();
export type ANetWorkspaceUpdateOffPeakToolPolicyResult = z.infer<
  typeof anetWorkspaceUpdateOffPeakToolPolicyResultSchema
>;

// 动态工作流灰度门禁：workspace 级事实，
// 与 Off-Peak 同一套 host→CLI 同步模式；旧 CLI method-not-found → host 降级忽略。
export const anetWorkspaceUpdateDynamicWorkflowPolicyParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    enabled: z.boolean(),
    // launch.md「On demand: activation」：mode 与布尔同行；缺席时 CLI 按布尔行事（alwaysOn）。
    mode: anetDynamicWorkflowModeSchema.optional(),
  })
  .strict();
export type ANetWorkspaceUpdateDynamicWorkflowPolicyParams = z.infer<
  typeof anetWorkspaceUpdateDynamicWorkflowPolicyParamsSchema
>;

export const anetWorkspaceUpdateDynamicWorkflowPolicyResultSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    enabled: z.boolean(),
  })
  .strict();
export type ANetWorkspaceUpdateDynamicWorkflowPolicyResult = z.infer<
  typeof anetWorkspaceUpdateDynamicWorkflowPolicyResultSchema
>;

export const anetPermissionRequestParamsSchema = z
  .object({
    requestId: nonEmptyString,
    sessionId: nonEmptyString,
    turnId: nonEmptyString.optional(),
    toolCallId: nonEmptyString,
    toolName: nonEmptyString,
    reason: z.string(),
    riskLevel: z.enum(["low", "medium", "high", "critical"]),
    input: z.unknown(),
    origin: anetInteractionRequestOriginSchema.optional(),
    options: z.array(anetPermissionOptionSchema).min(1),
  })
  .strict();
export type ANetPermissionRequestParams = z.infer<typeof anetPermissionRequestParamsSchema>;

/** Agent 请求 app 枚举当前 workspace/session 可达且已完成握手的 browser backend。 */
export const anetBrowserListParamsSchema = z
  .object({
    requestId: nonEmptyString,
    sessionId: nonEmptyString,
    turnId: nonEmptyString.optional(),
    workspaceKey: nonEmptyString,
    workspacePath: nonEmptyString,
    workspaceIdentity: nonEmptyString.optional(),
    remoteSessionId: nonEmptyString.optional(),
    clientMode: browserClientModeSchema,
    sessionContext: browserSessionContextKindSchema,
  })
  .strict();
export type ANetBrowserListParams = z.infer<typeof anetBrowserListParamsSchema>;

export const anetBrowserListResultSchema = browserBackendListResultSchema;
export type ANetBrowserListResult = z.infer<typeof anetBrowserListResultSchema>;

/** Agent 把一条 browser-use 命令发送给 app 执行。 */
export const anetBrowserExecuteParamsSchema = z
  .object({
    controlScopeId: nonEmptyString.optional(),
    requestId: nonEmptyString,
    sessionId: nonEmptyString,
    turnId: nonEmptyString.optional(),
    browserId: nonEmptyString.optional(),
    browserGeneration: z.number().int().nonnegative().optional(),
    workspaceKey: nonEmptyString.optional(),
    workspacePath: nonEmptyString.optional(),
    workspaceIdentity: nonEmptyString.optional(),
    remoteSessionId: nonEmptyString.optional(),
    clientMode: browserClientModeSchema.optional(),
    sessionContext: browserSessionContextKindSchema.optional(),
    command: browserCommandSchema,
  })
  .strict();
export type ANetBrowserExecuteParams = z.infer<typeof anetBrowserExecuteParamsSchema>;

// browser command result 是 app/agent 的同源协议结果；其中 duplicate_request_id 用于在真正维护
// pending/running 生命周期的边界拒绝 correlation key 冲突，不能依赖上游 UUID 概率保证。
export const anetBrowserExecuteResultSchema = browserCommandResultSchema;
export type ANetBrowserExecuteResult = z.infer<typeof anetBrowserExecuteResultSchema>;

export const anetUserInputOptionSchema = z
  .object({
    value: nonEmptyString,
    label: nonEmptyString,
    description: z.string().optional(),
    preview: z.string().optional(),
  })
  .strict();
export const anetUserInputQuestionSchema = z
  .object({
    question: nonEmptyString,
    header: nonEmptyString,
    options: z.array(anetUserInputOptionSchema).min(1),
    multiSelect: z.boolean().optional(),
  })
  .strict();
export type ANetUserInputQuestion = z.infer<typeof anetUserInputQuestionSchema>;

export const anetUserInputRequestParamsSchema = z
  .object({
    requestId: nonEmptyString,
    sessionId: nonEmptyString,
    turnId: nonEmptyString.optional(),
    toolCallId: nonEmptyString.optional(),
    toolName: nonEmptyString.optional(),
    prompt: z.string().optional(),
    questions: z.array(anetUserInputQuestionSchema).min(1).optional(),
    input: z.unknown().optional(),
    origin: anetInteractionRequestOriginSchema.optional(),
    schema: z.unknown().optional(),
  })
  .strict();
export type ANetUserInputRequestParams = z.infer<typeof anetUserInputRequestParamsSchema>;

export const anetUserInputResponseSchema = z
  .object({
    action: z.enum(["accept", "decline", "cancel"]),
    content: jsonObjectSchema.optional(),
    reason: z.string().optional(),
  })
  .strict();
export type ANetUserInputResponse = z.infer<typeof anetUserInputResponseSchema>;

export const anetProviderRuntimeHeadersRequestReasonSchema = z.enum(requestVerificationReasons);
export const anetProviderRuntimeHeadersRequestParamsSchema = z
  .object({
    requestId: nonEmptyString,
    sessionId: nonEmptyString,
    turnId: nonEmptyString.optional(),
    workspace: anetWorkspaceRefSchema,
    modelSelection: modelSelectionSchema,
    providerId: nonEmptyString,
    accountAccess: anetProviderAccountAccessSchema.optional(),
    expectedAccountScope: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    rejectedProjectTokenFingerprint: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    reason: anetProviderRuntimeHeadersRequestReasonSchema,
  })
  .strict();
export type ANetProviderRuntimeHeadersRequestParams = z.infer<
  typeof anetProviderRuntimeHeadersRequestParamsSchema
>;

/** 请求取消只作用于同 workspace/session 的这一轮凭据刷新。 */
export const anetProviderRuntimeHeadersCancelledSchema = z
  .object({
    requestId: nonEmptyString,
    sessionId: nonEmptyString,
    workspace: anetWorkspaceRefSchema,
  })
  .strict();
export type ANetProviderRuntimeHeadersCancelled = z.infer<
  typeof anetProviderRuntimeHeadersCancelledSchema
>;

// 标准 JSON-RPC error 保留旧版 schema 兼容，不向严格校验的 response 增加字段。
export const ANET_PROVIDER_CONFIG_NETWORK_ERROR = -32032;

export const anetProviderRuntimeHeadersErrorCode = {
  configNetwork: "request_verification_config_network",
  configInvalid: "request_verification_config_invalid",
} as const;

export const anetProviderRuntimeHeadersResponseSchema = z.discriminatedUnion("headersApplied", [
  z
    .object({
      headersApplied: z.literal(true),
      // 合并重接：成功必须携带当前请求的鉴权材料，不依赖旧 Registry 已被写入。
      requestAuth: z
        .object({
          apiKey: nonEmptyString.optional(),
          apiKeyId: z.string().trim().min(1).optional(),
          accountScope: z
            .string()
            .regex(/^[a-f0-9]{64}$/)
            .optional(),
          headers: z.record(nonEmptyString, nonEmptyString).optional(),
        })
        .strict(),
      errorMessage: nonEmptyString.optional(),
    })
    .strict(),
  z
    .object({
      headersApplied: z.literal(false),
      errorMessage: nonEmptyString.optional(),
    })
    .strict(),
]);
export type ANetProviderRuntimeHeadersResponse = z.infer<
  typeof anetProviderRuntimeHeadersResponseSchema
>;

// ── 官方 Server MCP 鉴权──
// Agent 进程不是用户身份权威：它把 (pluginId, mcpKey, targetOrigin) 报给 host，由 host
// 解析当前 Coding Plan 凭证并回传本次请求的身份头。请求侧不含任何秘密。
// 与 interaction/requestProviderRuntimeHeaders 同类：Agent 发起、host 自动响应、零 UI。
//
// `consumer` 缺省为 `mcp-server`（旧版 agent 不带该字段），此时必须带 `mcpKey`；
// `plugin-command` 是官方插件命令进程经 agent 代理端点发起的请求，没有 MCP，不带 `mcpKey`，
// host 按「套餐可选」解析：没有套餐时只给 ANet 登录身份（技术方案 5.8）。
export const anetOfficialMcpAuthHeadersRequestParamsSchema = z
  .object({
    requestId: nonEmptyString,
    workspace: anetWorkspaceRefSchema,
    pluginId: nonEmptyString,
    consumer: z.enum(OFFICIAL_AUTH_CONSUMER_KINDS).optional(),
    mcpKey: nonEmptyString.optional(),
    targetOrigin: nonEmptyString,
  })
  .strict()
  .superRefine((params, ctx) => {
    const isCommand = params.consumer === "plugin-command";
    if (isCommand && params.mcpKey !== undefined) {
      ctx.addIssue({
        code: "custom",
        message: "plugin-command must not carry mcpKey",
        path: ["mcpKey"],
      });
    }
    if (!isCommand && params.mcpKey === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "mcpKey is required for mcp-server",
        path: ["mcpKey"],
      });
    }
  });
export type ANetOfficialMcpAuthHeadersRequestParams = z.infer<
  typeof anetOfficialMcpAuthHeadersRequestParamsSchema
>;

/**
 * 失败原因必须可枚举，避免调用方按文本分流；因此响应不含 errorMessage。
 *
 * `official_mcp_origin_untrusted` 是 host 侧二次校验的拒绝原因：`targetOrigin` 不等于当前
 * ANet API origin。判定只看 origin，`pluginId` / `mcpKey` 仅用于日志归属。与"未登录/无凭据"
 * 分开，才能在排查时区分"被拒绝"和"没身份"。
 */
export const anetOfficialMcpAuthFailureReasonSchema = z.enum(
  OFFICIAL_MCP_AUTH_PORT_FAILURE_REASONS,
);

export const anetOfficialMcpAuthHeadersResponseSchema = z.discriminatedUnion("ok", [
  z
    .object({
      ok: z.literal(true),
      headers: z.record(z.string(), z.string()),
    })
    .strict(),
  z
    .object({
      ok: z.literal(false),
      reason: anetOfficialMcpAuthFailureReasonSchema,
    })
    .strict(),
]);
export type ANetOfficialMcpAuthHeadersResponse = z.infer<
  typeof anetOfficialMcpAuthHeadersResponseSchema
>;

// ── Plugin management (list + enable/disable) ──
// 镜像 @anet/contracts 的 PluginMetadata, 仅保留 UI 需要的可序列化字段。
export const anetPluginOptionValueSchema = z.union([z.string(), z.number(), z.boolean()]);
export type ANetPluginOptionValue = z.infer<typeof anetPluginOptionValueSchema>;
export const anetPluginScopeSchema = z.enum(["user", "workspace"]);
export type ANetPluginScope = z.infer<typeof anetPluginScopeSchema>;
export const anetPluginHookDetailSchema = z
  .object({
    event: nonEmptyString,
    matcher: z.string().optional(),
    type: z.enum(["command", "process"]),
    command: nonEmptyString,
    args: z.array(z.string()).optional(),
    async: z.boolean().optional(),
    shell: z.union([z.literal(true), z.string()]).optional(),
    timeout: z.number().positive().optional(),
    timeoutMs: z.number().int().positive().optional(),
    statusMessage: z.string().optional(),
    sourcePath: z.string(),
    runnable: z.boolean(),
  })
  .strict();
export const anetPluginUserConfigOptionSchema = z
  .object({
    default: anetPluginOptionValueSchema.optional(),
    description: z.string().optional(),
    required: z.boolean().optional(),
    sensitive: z.boolean().optional(),
    title: z.string().optional(),
    type: z.enum(["string", "number", "boolean", "directory", "file"]).optional(),
  })
  .strict();
export type ANetPluginUserConfigOption = z.infer<typeof anetPluginUserConfigOptionSchema>;

// 组件类型与详情弹窗/市场详情共用的分组顺序保持一致：agent / command / skill / hook / mcp。
// 注意：这三个 schema 必须定义在 anetPluginInfoSchema 之前，因为后者（.strict()）的 components 字段引用了它们。
export const anetPluginComponentKindSchema = z.enum(["agent", "command", "skill", "hook", "mcp"]);
export type ANetPluginComponentKind = z.infer<typeof anetPluginComponentKindSchema>;

export const anetPluginComponentItemSchema = z
  .object({
    name: nonEmptyString,
    // 描述来自组件 frontmatter（SKILL.md / command / agent）或 manifest；缺失时省略，不伪造。
    description: z.string().optional(),
  })
  .strict();
export const anetPluginComponentGroupSchema = z
  .object({
    kind: anetPluginComponentKindSchema,
    items: z.array(anetPluginComponentItemSchema),
  })
  .strict();
export type ANetPluginComponentGroup = z.infer<typeof anetPluginComponentGroupSchema>;

export const anetPluginUiSurfaceSchema = z
  .object({
    pluginId: nonEmptyString,
    pluginName: nonEmptyString,
    id: nonEmptyString.max(128),
    title: z.union([nonEmptyString, z.record(z.string(), z.string())]),
    icon: z.string().optional(),
    // 运行时 namespaced server 名（plugin:<name>:<server>），可直接用于 mcp/uiReadResource。
    server: nonEmptyString,
    resourceUri: nonEmptyString.max(2048),
    availability: z.literal("session"),
  })
  .strict();
export type ANetPluginUiSurface = z.infer<typeof anetPluginUiSurfaceSchema>;

export const anetPluginInfoSchema = z
  .object({
    id: nonEmptyString,
    name: nonEmptyString,
    description: z.string().optional(),
    version: z.string().optional(),
    enabled: z.boolean(),
    source: nonEmptyString,
    marketplace: nonEmptyString,
    // manifest（plugin.json）的作者/主页回退字段；商店 listing 缺失时详情页信息区用它兜底。
    author: z.string().optional(),
    authorUrl: z.string().optional(),
    homepage: z.string().optional(),
    skillCount: z.number().int().nonnegative().optional(),
    skillRootCount: z.number().int().nonnegative(),
    commandRootCount: z.number().int().nonnegative(),
    // 权威组件清单（名称 + 可选描述），由 CLI 对插件根目录枚举得出，与启用态无关。
    // 详情 UI 直接展示，取代旧的「数量取协议、名称靠 UI 侧 join」脆弱方案。optional 兼容旧 payload。
    components: z.array(anetPluginComponentGroupSchema).optional(),
    uiSurfaces: z.array(anetPluginUiSurfaceSchema).optional(),
    declaredMcpServerNames: z.array(z.string()).optional(),
    hostMcpServerNames: z.array(z.string()).optional(),
    mcpServerNames: z.array(z.string()),
    hookDetails: z.array(anetPluginHookDetailSchema).optional(),
    rootPath: z.string(),
    userConfig: z.record(z.string(), anetPluginUserConfigOptionSchema).optional(),
    configuredOptions: z.record(z.string(), anetPluginOptionValueSchema).optional(),
    // 缺省表示 package 可用；missing 用于保留已声明但目标 Host 尚未物化的配置行。
    packageStatus: z.literal("missing").optional(),
    rootSource: anetPluginScopeSchema.optional(),
    enabledSource: anetPluginScopeSchema.optional(),
    optionSources: z.record(z.string(), anetPluginScopeSchema).optional(),
  })
  .strict();
export type ANetPluginInfo = z.infer<typeof anetPluginInfoSchema>;

export const anetPluginDiagnosticSchema = z
  .object({
    code: z.string(),
    message: z.string(),
    severity: z.enum(["warning", "error"]).optional(),
    pluginId: z.string().optional(),
  })
  .strict();
export type ANetPluginDiagnostic = z.infer<typeof anetPluginDiagnosticSchema>;

export const anetPluginsListParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    configScope: anetPluginScopeSchema.optional(),
  })
  .strict();
export const anetPluginsListResultSchema = z
  .object({
    plugins: z.array(anetPluginInfoSchema),
    diagnostics: z.array(anetPluginDiagnosticSchema),
  })
  .strict();
export type ANetPluginsListResult = z.infer<typeof anetPluginsListResultSchema>;

// ── 插件 UI 面板入口──
// 工作区级只读投影：已启用插件清单 `ui.surfaces[]` 的合法条目；插件启停后 host 重新拉取。
export const anetPluginsListUiSurfacesParamsSchema = z
  .object({ workspace: anetWorkspaceRefSchema })
  .strict();
export type ANetPluginsListUiSurfacesParams = z.infer<typeof anetPluginsListUiSurfacesParamsSchema>;
export const anetPluginsListUiSurfacesResultSchema = z
  .object({ surfaces: z.array(anetPluginUiSurfaceSchema) })
  .strict();
export type ANetPluginsListUiSurfacesResult = z.infer<typeof anetPluginsListUiSurfacesResultSchema>;

// ── Plugin 对话引用 catalog（docs/plugin-reference-mention.md）──
// Session-scoped 只读投影：带 sessionId → 该 Session 创建时冻结的身份 catalog；
// 不带 → workspace 当前 catalog（新建草稿 Picker）。身份与能力字段保持
// identifiers-only，不携带 rootPath/配置等；可选 icon/displayName(I18n)/description(I18n)
// 仅供 UI 展示与 Picker 搜索，不参与身份、权限或 runtime reminder。
export const anetPluginReferenceCatalogEntrySchema = z
  .object({
    // 仅 referenceCatalogWithCategory 返回；旧入口保持原结构。
    category: nonEmptyString.optional(),
    pluginId: nonEmptyString,
    name: nonEmptyString,
    marketplace: nonEmptyString,
    icon: z.string().optional(),
    // 商店 listing 的 display-only 本地化显示名投影（沿 icon 先例）：让 Picker 能按
    // 中文显示名搜索/展示；locale 解析复用 shared 的 plugin-display-name helper。
    displayName: z.string().optional(),
    displayNameI18n: z.record(z.string(), z.string()).optional(),
    // 仅供 Picker 展示，不进入能力身份或 model-only reminder。
    description: z.string().optional(),
    descriptionI18n: z.record(z.string(), z.string()).optional(),
    enabled: z.boolean(),
    // 非空 = 与其他 enabled Plugin 共享 manifest name 的 V1 fail closed 冲突：
    // Picker 禁选并展示原因，runtime 解析按 ambiguous 跳过。
    conflictingPluginIds: z.array(nonEmptyString),
    skillQualifiedNames: z.array(nonEmptyString),
    mcpServerNames: z.array(nonEmptyString),
    // 旧 Host 不投影该字段时按空数组兼容；只有新 Agent 会把它用于 reminder live 交集。
    subagentNames: z.array(nonEmptyString).default([]),
  })
  .strict();
export type ANetPluginReferenceCatalogEntry = z.infer<typeof anetPluginReferenceCatalogEntrySchema>;

export const anetPluginsReferenceCatalogParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    // 已有 Session 的 Picker 必须带 sessionId 才能拿到 session-owned catalog；
    // session 不存在时按协议错误 fail closed，禁止静默回退 workspace authority。
    sessionId: nonEmptyString.optional(),
  })
  .strict();
export type ANetPluginsReferenceCatalogParams = z.infer<
  typeof anetPluginsReferenceCatalogParamsSchema
>;
export const anetPluginsReferenceCatalogResultSchema = z
  .object({
    authority: z.enum(["session", "workspace"]),
    plugins: z.array(anetPluginReferenceCatalogEntrySchema),
  })
  .strict();
export type ANetPluginsReferenceCatalogResult = z.infer<
  typeof anetPluginsReferenceCatalogResultSchema
>;

// ── Skill 对话引用 catalog──
// 新草稿读取 workspace 当前目录；已有 Session 读取 AgentRuntime 首次 context
// 初始化时冻结的发现结果。该协议只承载 Composer 的只读引用投影，不替代 Settings
// 的 Skill 管理接口，也不持久化 runtime 快照。
export const anetSkillReferenceCatalogEntrySchema = z
  .object({
    id: nonEmptyString,
    name: nonEmptyString,
    description: z.string(),
    path: nonEmptyString,
    scope: z.enum(["workspace", "user", "plugin"]),
    enabled: z.literal(true),
    pluginName: nonEmptyString.optional(),
  })
  .strict();
export type ANetSkillReferenceCatalogEntry = z.infer<typeof anetSkillReferenceCatalogEntrySchema>;

export const anetSkillsReferenceCatalogParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    // 带 sessionId 时必须命中该进程内的 resident Session；未知 Session fail closed，
    // 禁止回退到 workspace 当前目录而把新 Skill 泄漏进旧对话。
    sessionId: nonEmptyString.optional(),
  })
  .strict();
export type ANetSkillsReferenceCatalogParams = z.infer<
  typeof anetSkillsReferenceCatalogParamsSchema
>;
export const anetSkillsReferenceCatalogResultSchema = z
  .object({
    authority: z.enum(["session", "workspace"]),
    skills: z.array(anetSkillReferenceCatalogEntrySchema),
  })
  .strict();
export type ANetSkillsReferenceCatalogResult = z.infer<
  typeof anetSkillsReferenceCatalogResultSchema
>;

// ── 已保存工作流的 GUI 中枢──
// workspace 级、无会话的五个方法，照 skills/referenceCatalog 的先例：每次调用现扫
// `<cwd>/.anet-one/workflows/`（挂载时快照会漏掉手改的文件）。形状与 @anet/contracts 的
// saved-workflow.ts 逐字对齐——依赖方向是 contracts → shared，所以这里结构化地再声明一遍，
// 而不是 import；两边的 strict 形状由 bootstrap 侧的协议测试互相钉住。
export const anetSavedWorkflowArgTypeSchema = z.enum(["string", "number", "boolean", "json"]);
export type ANetSavedWorkflowArgType = z.infer<typeof anetSavedWorkflowArgTypeSchema>;
export const anetSavedWorkflowArgDeclarationSchema = z
  .object({
    type: anetSavedWorkflowArgTypeSchema,
    description: z.string().optional(),
    required: z.boolean().optional(),
    default: z.unknown().optional(),
  })
  .strict();
export type ANetSavedWorkflowArgDeclaration = z.infer<typeof anetSavedWorkflowArgDeclarationSchema>;
export const anetSavedWorkflowArgsDeclarationSchema = z.record(
  z.string(),
  anetSavedWorkflowArgDeclarationSchema,
);
export type ANetSavedWorkflowArgsDeclaration = z.infer<
  typeof anetSavedWorkflowArgsDeclarationSchema
>;
export const anetSavedWorkflowMetaSchema = z
  .object({
    description: nonEmptyString,
    whenToUse: nonEmptyString.optional(),
    args: anetSavedWorkflowArgsDeclarationSchema.optional(),
  })
  .strict();
export type ANetSavedWorkflowMeta = z.infer<typeof anetSavedWorkflowMetaSchema>;
// 作用域两档：项目档落 `<cwd>/.anet-one/workflows/`、全局档落 agent 机器的 `~/.anet-one/workflows/`。作用域由文件所在目录推得，frontmatter 不存 scope。
export const anetSavedWorkflowScopeSchema = z.enum(["project", "global"]);
export type ANetSavedWorkflowScope = z.infer<typeof anetSavedWorkflowScopeSchema>;
export const anetSavedWorkflowEntrySchema = z
  .object({
    name: nonEmptyString,
    description: z.string(),
    whenToUse: z.string().optional(),
    args: anetSavedWorkflowArgsDeclarationSchema.optional(),
    scope: anetSavedWorkflowScopeSchema,
    path: nonEmptyString,
  })
  .strict();
export type ANetSavedWorkflowEntry = z.infer<typeof anetSavedWorkflowEntrySchema>;
export const anetSavedWorkflowInvalidEntrySchema = z
  .object({ path: nonEmptyString, reason: nonEmptyString })
  .strict();
export type ANetSavedWorkflowInvalidEntry = z.infer<typeof anetSavedWorkflowInvalidEntrySchema>;
/** 名字非法 / 未找到 / frontmatter 坏 / 读错——与 core store 的 resolve 失败四态逐字对应。 */
export const anetSavedWorkflowFailureReasonSchema = z.enum([
  "invalid_name",
  "not_found",
  "parse_error",
  "read_error",
]);
export type ANetSavedWorkflowFailureReason = z.infer<typeof anetSavedWorkflowFailureReasonSchema>;
const anetSavedWorkflowFailureSchema = z
  .object({
    ok: z.literal(false),
    reason: anetSavedWorkflowFailureReasonSchema,
    detail: z.string().optional(),
  })
  .strict();

export const anetWorkflowsListParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    // 缺省即 `project`（本项目档）。给 `global` 时改扫本机 `~/.anet-one/workflows/`；此时 `workspace`
    // 仍必填，但只是**载体运行时**——协议处理器对全局档不读它的路径。
    scope: anetSavedWorkflowScopeSchema.optional(),
  })
  .strict();
export type ANetWorkflowsListParams = z.infer<typeof anetWorkflowsListParamsSchema>;
export const anetWorkflowsListResultSchema = z
  .object({
    workflows: z.array(anetSavedWorkflowEntrySchema),
    invalid: z.array(anetSavedWorkflowInvalidEntrySchema),
    // 扫过的目录（本地绝对路径），即使目录还不存在也回：GUI 的文件监听靠它 watch。
    dir: nonEmptyString,
  })
  .strict();
export type ANetWorkflowsListResult = z.infer<typeof anetWorkflowsListResultSchema>;

export const anetWorkflowsGetParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    name: nonEmptyString,
    // 缺省 `project`；`global` 时只查本机全局根。`workspace` 语义同 list（全局档只当载体）。
    scope: anetSavedWorkflowScopeSchema.optional(),
  })
  .strict();
export type ANetWorkflowsGetParams = z.infer<typeof anetWorkflowsGetParamsSchema>;
export const anetWorkflowsGetResultSchema = z.union([
  z
    .object({
      ok: z.literal(true),
      name: nonEmptyString,
      path: nonEmptyString,
      scope: anetSavedWorkflowScopeSchema,
      meta: anetSavedWorkflowMetaSchema,
      /** 脚本本体（frontmatter 之后逐字节），即被类型检查与执行的那一份。 */
      script: z.string(),
    })
    .strict(),
  anetSavedWorkflowFailureSchema,
]);
export type ANetWorkflowsGetResult = z.infer<typeof anetWorkflowsGetResultSchema>;

export const anetWorkflowsUpdateMetaParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    name: nonEmptyString,
    meta: anetSavedWorkflowMetaSchema,
    // 缺省 `project`；`global` 时只写本机全局根那一份。`workspace` 语义同 list。
    scope: anetSavedWorkflowScopeSchema.optional(),
  })
  .strict();
export type ANetWorkflowsUpdateMetaParams = z.infer<typeof anetWorkflowsUpdateMetaParamsSchema>;
export const anetWorkflowsUpdateMetaResultSchema = z.union([
  z.object({ ok: z.literal(true), path: nonEmptyString }).strict(),
  anetSavedWorkflowFailureSchema,
]);
export type ANetWorkflowsUpdateMetaResult = z.infer<typeof anetWorkflowsUpdateMetaResultSchema>;

export const anetWorkflowsDeleteParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    name: nonEmptyString,
    // 缺省 `project`；`global` 时按 scope 选根删除（不再写死 roots[0]）。`workspace` 语义同 list。
    scope: anetSavedWorkflowScopeSchema.optional(),
  })
  .strict();
export type ANetWorkflowsDeleteParams = z.infer<typeof anetWorkflowsDeleteParamsSchema>;
export const anetWorkflowsDeleteResultSchema = z.union([
  z.object({ ok: z.literal(true), path: nonEmptyString }).strict(),
  anetSavedWorkflowFailureSchema,
]);
export type ANetWorkflowsDeleteResult = z.infer<typeof anetWorkflowsDeleteResultSchema>;

export const ANET_WORKFLOWS_RUNS_MAX_LIMIT = 50;
export const anetWorkflowsRunsParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    /** 只要这个名字的 run（`dwf_run.name` 字面等值）；缺省即本项目全部 run。 */
    name: nonEmptyString.optional(),
    limit: z.number().int().min(1).max(ANET_WORKFLOWS_RUNS_MAX_LIMIT),
    // 缺省 `project`：只查 `dwf_run.cwd === workspacePath` 的 run。`global` 时**不**按 cwd 过滤，
    // 跨所有项目取该名字的运行历史（全局工作流在任何项目里跑，历史因此跨 cwd）；结果行带 `cwd`
    // 供 GUI 标项目。`workspace` 语义同 list（全局档只当载体）。
    scope: anetSavedWorkflowScopeSchema.optional(),
  })
  .strict();
export type ANetWorkflowsRunsParams = z.infer<typeof anetWorkflowsRunsParamsSchema>;
// 三终态词汇：errored = 脚本之错，stopped = 被停下（可恢复）。
export const anetSavedWorkflowRunStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "errored",
  "stopped",
]);
export type ANetSavedWorkflowRunStatus = z.infer<typeof anetSavedWorkflowRunStatusSchema>;
export const anetSavedWorkflowRunStopReasonSchema = z.enum([
  "user",
  "model",
  "provider",
  "interrupted",
  "superseded",
]);
export const anetSavedWorkflowRunSchema = z
  .object({
    runId: nonEmptyString,
    name: z.string().optional(),
    status: anetSavedWorkflowRunStatusSchema,
    // `status === "stopped"` 才在场。
    stopReason: anetSavedWorkflowRunStopReasonSchema.optional(),
    createdAt: z.number(),
    updatedAt: z.number(),
    spentTokens: z.number(),
    /** 发起它的会话与 CreateWorkflow 工具调用：有这两个才能从中枢打开实例详情。老行可缺。 */
    parentSessionId: z.string().optional(),
    toolCallId: z.string().optional(),
    args: z.record(z.string(), z.unknown()).optional(),
    // 实际运行的项目目录（`dwf_run.cwd`）。全局档的 `workflows/runs` 跨 cwd 查询，GUI 用它给
    // 每行标项目；项目档变体里它恒等于 workspacePath，GUI 可忽略。老行可缺。
    cwd: z.string().optional(),
    // 这次运行发布的**用户面产物**：中枢的运行历史行在
    // 状态词之后画一串 kind chips，详情页头部的「最近产物」条取最近一次 completed run 的这一份。
    // ⚠ 术语：这里的 artifact 是脚本经 `artifact.*` 发布给用户看的产出，不是脚本的顶层返回值。
    // 只带 chip 画得下的字段（≤ 8 件，取最新版的元数据）；字节与条目经 v4 查询按需读。
    // optional，照上面 `cwd` 的先例：老 CLI 不发，少一个键是退化不是错误。
    artifacts: z
      .array(
        z
          .object({
            id: nonEmptyString,
            kind: z.enum(["file", "markdown", "chart", "table", "metrics", "board"]),
            title: z.string().optional(),
            version: z.number(),
            contentType: z.string().optional(),
          })
          .strict(),
      )
      .max(8)
      .optional(),
  })
  .strict();
export type ANetSavedWorkflowRun = z.infer<typeof anetSavedWorkflowRunSchema>;
export const anetWorkflowsRunsResultSchema = z
  .object({
    runs: z.array(anetSavedWorkflowRunSchema),
    /** 为真时才在场：还有更多 run 没进这一页（多取一条判定，不是 length === limit）。 */
    truncated: z.literal(true).optional(),
  })
  .strict();
export type ANetWorkflowsRunsResult = z.infer<typeof anetWorkflowsRunsResultSchema>;

// workflows/move：把本机全局根的同名文件搬到 `workspace` 项目根。**只此一向**：项目→全局不是搬文件而是模型的概括（「提升为
// 全局」在该项目开新会话、经 SaveWorkflow 另存），所以没有 `to` 参数。同机同用户，rename 优先、EXDEV
// 回落 copy+unlink；逐字节搬，不改内容（frontmatter 不存 scope）；`move` 不覆盖——目标已存在即拒绝
// （覆盖是 SaveWorkflow 经确认窗才有的动作，不变式 7）。`workspace` 既是载体运行时也是目标项目。
export const anetWorkflowsMoveParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    name: nonEmptyString,
  })
  .strict();
export type ANetWorkflowsMoveParams = z.infer<typeof anetWorkflowsMoveParamsSchema>;
export const anetWorkflowsMoveResultSchema = z.union([
  z
    .object({
      ok: z.literal(true),
      /** 源落点路径（全局根，搬走前）。 */
      from: nonEmptyString,
      /** 目标落点路径（项目根，搬到处）。 */
      to: nonEmptyString,
    })
    .strict(),
  z
    .object({
      ok: z.literal(false),
      // target_exists：目标档已有同名（move 不覆盖）；not_found：源档没有这个名字；
      // read_error / write_error：搬运时的 I/O 失败；invalid_name：名字先验没过。
      reason: z.enum(["invalid_name", "not_found", "target_exists", "read_error", "write_error"]),
      path: z.string().optional(),
      detail: z.string().optional(),
    })
    .strict(),
]);
export type ANetWorkflowsMoveResult = z.infer<typeof anetWorkflowsMoveResultSchema>;

// ── 从一次 run 保存工作流（docs/dynamic-workflow/transcript-and-notifications.md「Saving the
// run, and running it again」）──
// 完成卡的「直接保存」走这条：**不收脚本，只收 runId**——要写的那份正文是这次 run 实际执行的
// 脚本，agent 从 journal 记录（`scriptText`）里读。脚本不经 GUI 走一圈有两个后果值得写下来：
// 修订过的 run 存下的是**结算它的**那一份，而工具行入参被快照裁成预览的老对话也照样存得出
// 同样的字节。名字合法性、覆盖、遮��与类型检查全部复用 SaveWorkflow 的同一套实现（不变式 3）。
/** 另一档已有同名定义（遮蔽事实）；与 contracts 的 SavedWorkflowShadowing 逐字对齐。 */
export const anetSavedWorkflowShadowingSchema = z.enum(["hides_global", "hidden_by_project"]);
export type ANetSavedWorkflowShadowing = z.infer<typeof anetSavedWorkflowShadowingSchema>;

export const anetWorkflowsSaveParamsSchema = z
  .object({
    // 两用：既是载体运行时，也是这次 run 的项目——journal 在它那里，项目根也在它那里。
    // 全局档同样带它（与 list/get 的「全局只当载体」不同）：脚本必须从这个 agent 的 journal 读。
    workspace: anetWorkspaceRefSchema,
    runId: nonEmptyString,
    name: nonEmptyString,
    meta: anetSavedWorkflowMetaSchema,
    // 缺省 `project`。
    scope: anetSavedWorkflowScopeSchema.optional(),
    // 只有 GUI 已经把覆盖警告摆给用户看过时才为 true；缺省即「目标已存在就拒绝」——
    // 覆盖是用户的决定，不是一次保存的副作用（与 `workflows/move` 不覆盖同一条纪律）。
    overwrite: z.boolean().optional(),
  })
  .strict();
export type ANetWorkflowsSaveParams = z.infer<typeof anetWorkflowsSaveParamsSchema>;
export const anetWorkflowsSaveResultSchema = z.union([
  z
    .object({
      ok: z.literal(true),
      name: nonEmptyString,
      scope: anetSavedWorkflowScopeSchema,
      path: nonEmptyString,
      /** 写的那一刻重新判定，不回抄入参里的 `overwrite`（与 SaveWorkflow 的 `overwritten` 同源）。 */
      overwritten: z.boolean(),
      shadowing: anetSavedWorkflowShadowingSchema.optional(),
    })
    .strict(),
  z
    .object({
      ok: z.literal(false),
      // run_not_found：journal 里没有这条 run；script_missing：老记录没存脚本原文；
      // target_exists：目标已存在而调用方没说覆盖；compile_failed：类型检查没过，一个字节都没写。
      reason: z.enum([
        "invalid_name",
        "run_not_found",
        "script_missing",
        "target_exists",
        "compile_failed",
        "write_error",
      ]),
      path: z.string().optional(),
      detail: z.string().optional(),
    })
    .strict(),
]);
export type ANetWorkflowsSaveResult = z.infer<typeof anetWorkflowsSaveResultSchema>;

// ── 一次 run 对应哪个已保存工作流 ──
// 完成卡的「已保存」芯片与「再次运行」都问这一个问题，而答案**推导得来、不记在卡上**：重开
// 会话、换一个窗口保存、在对话里保存，都走同一条判定。判定住在 agent 一侧，因为两份事实
// （run 的 journal 记录与磁盘上的定义）都在那里；返回解析好的 entry，用户后来删掉的那一份
// 因此会自动不再算数。
/** 转写自对话的候选：模型用 `SaveWorkflow` 存过、并在入参里认领了这次 run。 */
export const anetWorkflowsForRunCandidateSchema = z
  .object({ name: nonEmptyString, scope: anetSavedWorkflowScopeSchema.optional() })
  .strict();
export type ANetWorkflowsForRunCandidate = z.infer<typeof anetWorkflowsForRunCandidateSchema>;
/** 候选上界：一次 run 在一段对话里被存过的次数远小于它。 */
export const ANET_WORKFLOWS_FOR_RUN_MAX_CANDIDATES = 8;
export const anetWorkflowsForRunParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    runId: nonEmptyString,
    candidates: z
      .array(anetWorkflowsForRunCandidateSchema)
      .max(ANET_WORKFLOWS_FOR_RUN_MAX_CANDIDATES)
      .optional(),
  })
  .strict();
export type ANetWorkflowsForRunParams = z.infer<typeof anetWorkflowsForRunParamsSchema>;
export const anetWorkflowsForRunResultSchema = z
  .object({
    /** 命中的定义；缺席即这次 run 还没有对应的已保存工作流。 */
    entry: anetSavedWorkflowEntrySchema.optional(),
    /** 命中的是哪一条规则（诊断与测试用；UI 只看 entry 在不在）。 */
    match: z.enum(["candidate", "script", "name"]).optional(),
    /** 这次 run 跑时用的实参（journal 原样），供「再次运行」预填实参窗。 */
    runArgs: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();
export type ANetWorkflowsForRunResult = z.infer<typeof anetWorkflowsForRunResultSchema>;

// 推荐 Prompt 的可信插件解析：UI 不拆解 stableId，也不从旧目录快照推断可安装性。
export const anetPluginSuggestedReferenceStatusSchema = z.enum([
  "ready",
  "disabled",
  "missing",
  "conflict",
  "unavailable",
]);
export type ANetPluginSuggestedReferenceStatus = z.infer<
  typeof anetPluginSuggestedReferenceStatusSchema
>;
export const anetPluginOperationStateSchema = z.enum([
  "checking",
  "refreshing",
  "installing",
  "enabling",
  "cancelling",
  "cancelled",
  "complete",
  "failed",
]);
export type ANetPluginOperationState = z.infer<typeof anetPluginOperationStateSchema>;
export const anetPluginOperationProgressNotificationSchema = z
  .object({
    operationId: nonEmptyString,
    state: z.literal("refreshing"),
  })
  .strict();
export type ANetPluginOperationProgressNotification = z.infer<
  typeof anetPluginOperationProgressNotificationSchema
>;
export const anetPluginsResolveSuggestedReferenceParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    stableId: nonEmptyString,
    operationId: nonEmptyString,
    clientMode: anetDeliveryKindSchema,
    deliveryKind: anetDeliveryKindSchema,
  })
  .strict();
export type ANetPluginsResolveSuggestedReferenceParams = z.infer<
  typeof anetPluginsResolveSuggestedReferenceParamsSchema
>;
export const anetPluginsSetEnabledParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    pluginId: nonEmptyString,
    enabled: z.boolean(),
    operationId: nonEmptyString.optional(),
    scope: anetPluginScopeSchema.optional(),
  })
  .strict();
export const anetPluginsSetEnabledResultSchema = z
  .object({
    plugin: anetPluginInfoSchema,
    enabled: z.boolean(),
  })
  .strict();
export type ANetPluginsSetEnabledResult = z.infer<typeof anetPluginsSetEnabledResultSchema>;

// 商店信息（Store Listing）：目录条目携带的展示性元数据（显示名/icon/分类/作者/链接/hero/
// 示例提示词），全部可选，UI 缺失时按降级矩阵处理（字母头像/隐藏区块/省略信息行）。
// i18n 采用 `<字段>I18n` map，locale 解析复用 shared 的 plugin-display-name helper。
export const anetPluginStoreListingSchema = z
  .object({
    displayName: z.string().optional(),
    displayNameI18n: z.record(z.string(), z.string()).optional(),
    descriptionI18n: z.record(z.string(), z.string()).optional(),
    icon: z.string().optional(),
    category: z.string().optional(),
    publisherType: z.enum(["official", "community"]).optional(),
    author: z.string().optional(),
    authorUrl: z.string().optional(),
    homepage: z.string().optional(),
    privacyPolicy: z.string().optional(),
    termsOfService: z.string().optional(),
    heroImage: z.string().optional(),
    examplePrompts: z.array(z.string()).optional(),
    examplePromptsI18n: z.record(z.string(), z.array(z.string())).optional(),
    /**
     * 需要付费套餐才好用的插件：市场目录条目声明 `requiresPaidPlan: true`，
     * UI 在标题右侧展示提示图标。描述的是「使用条件」而非「插件是收费商品」——
     * 不参与安装门禁与计费，命名也不绑定具体套餐商品名。
     */
    requiresPaidPlan: z.boolean().optional(),
  })
  .strict();
export type ANetPluginStoreListing = z.infer<typeof anetPluginStoreListingSchema>;

export const anetPluginsResolveSuggestedReferenceResultSchema = z
  .object({
    stableId: nonEmptyString,
    status: anetPluginSuggestedReferenceStatusSchema,
    marketplace: nonEmptyString.optional(),
    pluginName: nonEmptyString.optional(),
    sourceTrust: z.literal("official").optional(),
    // 官方 Marketplace listing 的可选展示投影；不参与身份、安装或权限判断。
    icon: z.string().optional(),
    listing: anetPluginStoreListingSchema.optional(),
    diagnostics: z.array(anetPluginDiagnosticSchema),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status !== "ready" && value.status !== "disabled" && value.status !== "missing") {
      return;
    }
    if (!value.marketplace || !value.pluginName || value.sourceTrust !== "official") {
      context.addIssue({
        code: "custom",
        message: "actionable suggested Plugin results require trusted install identity",
      });
    }
  });
export type ANetPluginsResolveSuggestedReferenceResult = z.infer<
  typeof anetPluginsResolveSuggestedReferenceResultSchema
>;

export const anetPluginMarketplaceSummarySchema = z
  .object({
    id: nonEmptyString,
    name: nonEmptyString,
    source: jsonObjectSchema,
    description: z.string().optional(),
    lastUpdated: z.string().optional(),
    pluginCount: z.number().int().nonnegative(),
    isOfficial: z.boolean().optional(),
    // 目录顶层 featured 策展名单（商店「公开」分段 Featured 区）。
    featured: z.array(z.string()).optional(),
    refreshFailure: z
      .object({
        code: z.string(),
        failedAt: z.string(),
        message: z.string(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type ANetPluginMarketplaceSummary = z.infer<typeof anetPluginMarketplaceSummarySchema>;

export const anetAvailablePluginSummarySchema = z
  .object({
    id: nonEmptyString,
    name: nonEmptyString,
    marketplace: nonEmptyString,
    description: z.string().optional(),
    version: z.string().optional(),
    installed: z.boolean(),
    componentTypes: z.array(z.string()).optional(),
    listing: anetPluginStoreListingSchema.optional(),
  })
  .strict();
export type ANetAvailablePluginSummary = z.infer<typeof anetAvailablePluginSummarySchema>;

export const anetInstalledPluginSummarySchema = z
  .object({
    id: nonEmptyString,
    name: nonEmptyString,
    marketplace: nonEmptyString,
    description: z.string().optional(),
    version: z.string().optional(),
    enabled: z.boolean(),
    scope: anetPluginScopeSchema,
    installPath: z.string().optional(),
    installedAt: z.string().optional(),
    componentTypes: z.array(z.string()).optional(),
    hookDetails: z.array(anetPluginHookDetailSchema).optional(),
    updateStatus: z.enum(["none", "update-available", "version-changed"]).optional(),
    latestVersion: z.string().optional(),
    listing: anetPluginStoreListingSchema.optional(),
  })
  .strict();
export type ANetInstalledPluginSummary = z.infer<typeof anetInstalledPluginSummarySchema>;

export const anetPluginsOverviewParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    configScope: anetPluginScopeSchema.optional(),
  })
  .strict();
export const anetPluginsOverviewResultSchema = z
  .object({
    marketplaces: z.array(anetPluginMarketplaceSummarySchema),
    availablePlugins: z.array(anetAvailablePluginSummarySchema),
    installedPlugins: z.array(anetInstalledPluginSummarySchema),
    restorableBuiltins: z.array(anetAvailablePluginSummarySchema),
    diagnostics: z.array(anetPluginDiagnosticSchema),
    capability: z
      .object({
        supported: z.boolean(),
        reason: z.string().optional(),
      })
      .strict(),
  })
  .strict();
export type ANetPluginsOverviewResult = z.infer<typeof anetPluginsOverviewResultSchema>;

export const anetPluginsMarketplaceAddParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    source: nonEmptyString,
    dryRun: z.boolean().optional(),
    operationId: nonEmptyString.optional(),
  })
  .strict();
export const anetPluginsMarketplaceRemoveParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    marketplace: nonEmptyString,
  })
  .strict();
export const anetPluginsMarketplaceUpdateParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    marketplace: nonEmptyString.optional(),
    operationId: nonEmptyString.optional(),
  })
  .strict();
export const anetPluginsMarketplaceMutationResultSchema = z
  .object({
    marketplace: anetPluginMarketplaceSummarySchema.optional(),
    marketplaces: z.array(anetPluginMarketplaceSummarySchema).optional(),
    diagnostics: z.array(anetPluginDiagnosticSchema).optional(),
  })
  .strict();
export type ANetPluginsMarketplaceMutationResult = z.infer<
  typeof anetPluginsMarketplaceMutationResultSchema
>;

export const anetPluginsInstallParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    pluginName: nonEmptyString,
    marketplace: nonEmptyString,
    scope: anetPluginScopeSchema.optional(),
    dryRun: z.boolean().optional(),
    operationId: nonEmptyString.optional(),
  })
  .strict();
export const anetPluginsCancelOperationParamsSchema = z
  .object({
    operationId: nonEmptyString,
  })
  .strict();
export type ANetPluginsCancelOperationParams = z.infer<
  typeof anetPluginsCancelOperationParamsSchema
>;

export const anetPluginsCancelOperationResultSchema = z
  .object({
    operationId: nonEmptyString,
    cancelled: z.boolean(),
  })
  .strict();
export type ANetPluginsCancelOperationResult = z.infer<
  typeof anetPluginsCancelOperationResultSchema
>;
export const anetPluginsUninstallParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    pluginId: nonEmptyString.optional(),
    pluginName: nonEmptyString.optional(),
    marketplace: nonEmptyString.optional(),
    removeCache: z.boolean().optional(),
  })
  .strict();
export const anetPluginsInstallResultSchema = z
  .object({
    installedPlugins: z.array(anetInstalledPluginSummarySchema),
    dependencyClosure: z.array(z.string()),
    diagnostics: z.array(anetPluginDiagnosticSchema),
  })
  .strict();
export type ANetPluginsInstallResult = z.infer<typeof anetPluginsInstallResultSchema>;

export const anetPluginsUninstallResultSchema = z
  .object({
    removedPlugin: anetInstalledPluginSummarySchema.optional(),
    diagnostics: z.array(anetPluginDiagnosticSchema),
  })
  .strict();
export type ANetPluginsUninstallResult = z.infer<typeof anetPluginsUninstallResultSchema>;

export const anetPluginsUpdateParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    pluginId: nonEmptyString.optional(),
    marketplace: nonEmptyString.optional(),
  })
  .strict();
export const anetPluginsRestoreBuiltinParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    pluginId: nonEmptyString,
  })
  .strict();
export const anetPluginsRestoreBuiltinResultSchema = z
  .object({
    pluginId: nonEmptyString,
    diagnostics: z.array(anetPluginDiagnosticSchema),
  })
  .strict();
export type ANetPluginsRestoreBuiltinResult = z.infer<typeof anetPluginsRestoreBuiltinResultSchema>;

export const anetPluginsConfigureParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    pluginId: nonEmptyString,
    options: jsonObjectSchema,
    clearOptionKeys: z.array(nonEmptyString).optional(),
    scope: anetPluginScopeSchema.optional(),
    dryRun: z.boolean().optional(),
  })
  .strict();
export const anetPluginsConfigureResultSchema = z
  .object({
    pluginId: nonEmptyString,
    diagnostics: z.array(anetPluginDiagnosticSchema),
  })
  .strict();
export type ANetPluginsConfigureResult = z.infer<typeof anetPluginsConfigureResultSchema>;

export const anetPluginsResetConfigParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    pluginId: nonEmptyString,
    scope: anetPluginScopeSchema.optional(),
  })
  .strict();
export type ANetPluginsResetConfigParams = z.infer<typeof anetPluginsResetConfigParamsSchema>;

export const anetPluginsValidateParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    pluginName: nonEmptyString.optional(),
    marketplace: nonEmptyString.optional(),
    source: nonEmptyString.optional(),
  })
  .strict();
export const anetPluginsValidateResultSchema = z
  .object({
    ok: z.boolean(),
    diagnostics: z.array(anetPluginDiagnosticSchema),
    compatibility: z
      .object({
        runnable: z.array(z.string()),
        diagnosticOnly: z.array(z.string()),
        unsupported: z.array(z.string()),
      })
      .strict(),
  })
  .strict();
export type ANetPluginsValidateResult = z.infer<typeof anetPluginsValidateResultSchema>;

// plugins/describe：按需枚举单个插件的组件「名称 + 描述」。
// 已安装插件读本地缓存目录；未安装候选按需解析/临时 clone 源后枚举再清理。
export const anetPluginsDescribeParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema,
    pluginName: nonEmptyString,
    marketplace: nonEmptyString,
  })
  .strict();
export const anetPluginsDescribeResultSchema = z
  .object({
    components: z.array(anetPluginComponentGroupSchema),
    diagnostics: z.array(anetPluginDiagnosticSchema).optional(),
    // 插件包内 plugin.json 的展示性回退字段；未安装候选详情页信息区在商店 listing 缺失时兜底。
    metadata: z
      .object({
        author: z.string().optional(),
        authorUrl: z.string().optional(),
        homepage: z.string().optional(),
        version: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type ANetPluginsDescribeResult = z.infer<typeof anetPluginsDescribeResultSchema>;

export const anetAutomationScheduleRuleSchema = z
  .object({
    unit: z.enum(["minute", "hourly", "daily", "weekly", "monthly", "yearly"]),
    interval: z.number().int().positive(),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
    anchorAt: z.number().int(),
    weekdays: z.array(z.number().int().min(0).max(6)).optional(),
    monthDays: z.array(z.number().int().min(1).max(31)).optional(),
    /** yearly 用：1-12 人类月份。缺省回退 anchorAt 的月份（兼容未写该字段的旧记录）。 */
    months: z.array(z.number().int().min(1).max(12)).optional(),
    monthlyMode: z.enum(["date", "weekday"]).optional(),
  })
  .strict();
export type ANetAutomationScheduleRuleProtocol = z.infer<typeof anetAutomationScheduleRuleSchema>;

/** 会话侧长间隔周期 carrier 的 unit 枚举（与 scheduleRule.unit 同集）。 */
export const anetAutomationIntervalUnitSchema = z.enum([
  "minute",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);

export const anetAutomationProtocolSchema = z
  .object({
    automationId: nonEmptyString,
    title: z.string(),
    cronExpr: nonEmptyString,
    prompt: nonEmptyString,
    modelSelection: modelSelectionSchema.optional(),
    mode: anetTaskModeSchema.optional(),
    targetTaskId: nonEmptyString.optional(),
    enabled: z.boolean(),
    lifecycleStatus: z.enum(["active", "completed", "failed", "paused"]),
    nextRunAt: timestampMsSchema.optional(),
    lastRunAt: timestampMsSchema.optional(),
    runCount: z.number().int().nonnegative(),
    recurring: z.boolean(),
    maxRuns: z.number().int().positive().optional(),
    // 自定义重复规则；缺省时调度回退到解析 cronExpr。会话卡片必须读到本字段才能展示
    // cron 无法表达的真实间隔（如每50小时、每40天，兼容 cronExpr 只是 0 * * * *）。
    scheduleRule: anetAutomationScheduleRuleSchema.optional(),
  })
  .strict();
export type ANetAutomationProtocol = z.infer<typeof anetAutomationProtocolSchema>;

export const anetAutomationCreateParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema.optional(),
    title: z.string().optional(),
    cronExpr: nonEmptyString,
    relativeDelayMinutes: z.number().int().positive().max(525_600).optional(),
    prompt: nonEmptyString,
    modelSelection: modelSelectionSchema.optional(),
    mode: anetTaskModeSchema.optional(),
    targetTaskId: nonEmptyString.optional(),
    botDeliveryTarget: anetAutomationBotDeliveryTargetSchema.optional(),
    recurring: z.boolean().optional(),
    maxRuns: z.number().int().positive().optional(),
    // 会话侧自定义重复 carrier：每 N 分钟/小时/天/周/月/年均通过此字段归一化为权威 scheduleRule，
    // cronExpr 仅作合法兼容展示。
    intervalUnit: anetAutomationIntervalUnitSchema.optional(),
    interval: z.number().int().min(1).max(200).optional(),
  })
  .strict()
  // intervalUnit 与 interval 必须配对提交（只传一个无法确定真实间隔）。
  .refine((input) => (input.intervalUnit === undefined) === (input.interval === undefined), {
    message: "intervalUnit and interval must be set together",
    path: ["interval"],
  })
  // 周期 carrier 与一次性相对延迟语义冲突，禁止同传。
  .refine((input) => input.intervalUnit === undefined || input.relativeDelayMinutes === undefined, {
    message: "intervalUnit cannot combine with a relative delayMinutes",
    path: ["intervalUnit"],
  })
  .refine((input) => input.intervalUnit === undefined || input.recurring !== false, {
    message: "intervalUnit is a recurring carrier and cannot combine with recurring=false",
    path: ["recurring"],
  })
  .refine((input) => input.intervalUnit === undefined || input.maxRuns === undefined, {
    message: "intervalUnit is a recurring carrier and cannot combine with maxRuns",
    path: ["maxRuns"],
  });
export type ANetAutomationCreateProtocolParams = z.infer<typeof anetAutomationCreateParamsSchema>;

export const anetAutomationCreateResultSchema = z
  .object({ automation: anetAutomationProtocolSchema })
  .strict();
export type ANetAutomationCreateProtocolResult = z.infer<typeof anetAutomationCreateResultSchema>;

export const anetAutomationUpdateParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema.optional(),
    automationId: nonEmptyString,
    title: nonEmptyString.optional(),
    cronExpr: nonEmptyString.optional(),
    prompt: nonEmptyString.optional(),
    recurring: z.boolean().optional(),
    maxRuns: z.number().int().positive().nullable().optional(),
    // 会话侧自定义重复 carrier（同 create 侧语义）。
    intervalUnit: anetAutomationIntervalUnitSchema.optional(),
    interval: z.number().int().min(1).max(200).optional(),
  })
  .strict()
  .refine(
    (input) =>
      input.title !== undefined ||
      input.cronExpr !== undefined ||
      input.prompt !== undefined ||
      input.recurring !== undefined ||
      input.maxRuns !== undefined ||
      input.intervalUnit !== undefined,
    { message: "automation update requires at least one field" },
  )
  .refine((input) => input.maxRuns !== null || input.recurring === true, {
    message: "clearing maxRuns requires recurring=true",
    path: ["maxRuns"],
  })
  .refine((input) => input.recurring !== true || typeof input.maxRuns !== "number", {
    message: "recurring=true cannot be combined with a numeric maxRuns",
    path: ["maxRuns"],
  })
  // intervalUnit 与 interval 必须配对提交（同 create 侧语义）。
  .refine((input) => (input.intervalUnit === undefined) === (input.interval === undefined), {
    message: "intervalUnit and interval must be set together",
    path: ["interval"],
  })
  .refine((input) => input.intervalUnit === undefined || input.recurring !== false, {
    message: "intervalUnit is a recurring carrier and cannot combine with recurring=false",
    path: ["recurring"],
  })
  .refine(
    (input) =>
      input.intervalUnit === undefined ||
      input.maxRuns === undefined ||
      (input.maxRuns === null && input.recurring === true),
    {
      message:
        "intervalUnit is a recurring carrier and only allows maxRuns=null with recurring=true",
      path: ["maxRuns"],
    },
  );
export type ANetAutomationUpdateProtocolParams = z.infer<typeof anetAutomationUpdateParamsSchema>;
export const anetAutomationUpdateResultSchema = z
  .object({ automation: anetAutomationProtocolSchema })
  .strict();
export type ANetAutomationUpdateProtocolResult = z.infer<typeof anetAutomationUpdateResultSchema>;

export const anetAutomationListParamsSchema = z
  .object({ workspace: anetWorkspaceRefSchema.optional() })
  .strict();
export type ANetAutomationListProtocolParams = z.infer<typeof anetAutomationListParamsSchema>;
export const anetAutomationListResultSchema = z
  .object({ automations: z.array(anetAutomationProtocolSchema) })
  .strict();
export type ANetAutomationListProtocolResult = z.infer<typeof anetAutomationListResultSchema>;

export const anetAutomationCheckTaskBindingParamsSchema = z
  .object({ workspace: anetWorkspaceRefSchema.optional(), targetTaskId: nonEmptyString })
  .strict();
export type ANetAutomationCheckTaskBindingProtocolParams = z.infer<
  typeof anetAutomationCheckTaskBindingParamsSchema
>;
export const anetAutomationCheckTaskBindingResultSchema = z.object({ bound: z.boolean() }).strict();
export type ANetAutomationCheckTaskBindingProtocolResult = z.infer<
  typeof anetAutomationCheckTaskBindingResultSchema
>;

export const anetAutomationDeleteParamsSchema = z
  .object({ workspace: anetWorkspaceRefSchema.optional(), automationId: nonEmptyString })
  .strict();
export type ANetAutomationDeleteProtocolParams = z.infer<typeof anetAutomationDeleteParamsSchema>;
export const anetAutomationDeleteResultSchema = z.object({ deleted: z.boolean() }).strict();
export type ANetAutomationDeleteProtocolResult = z.infer<typeof anetAutomationDeleteResultSchema>;

// 执行轮自暂停（CronPauseSelf）：automationId 来自 CLI loop state，Host 只在当前 workspace
// 内做条件暂停（active 且 enabled 才转 paused）并回报是否生效。
export const anetAutomationPauseParamsSchema = z
  .object({ workspace: anetWorkspaceRefSchema.optional(), automationId: nonEmptyString })
  .strict();
export type ANetAutomationPauseProtocolParams = z.infer<typeof anetAutomationPauseParamsSchema>;
export const anetAutomationPauseResultSchema = z.object({ paused: z.boolean() }).strict();
export type ANetAutomationPauseProtocolResult = z.infer<typeof anetAutomationPauseResultSchema>;

// ---- Off-Peak（闲时任务）会话内创建协议----
// 与 automation 兄弟并列（独立域，禁止互相复用标记/表）。workspace 由 host 端从
// 当前 session 的已协商 workspace 注入。permissionMode 只开放产品
// 四档词表（D29-4）；缺省解析在 host 端（D49-4：yolo / allowed_models 末位 / 最高推理档）。
export const anetOffPeakPermissionModeSchema = z.enum(["build", "edit", "plan", "yolo", "guarded"]);
export type ANetOffPeakProtocolPermissionMode = z.infer<typeof anetOffPeakPermissionModeSchema>;

export const anetOffPeakCreateParamsSchema = z
  .object({
    workspace: anetWorkspaceRefSchema.optional(),
    title: nonEmptyString,
    prompt: nonEmptyString,
    permissionMode: anetOffPeakPermissionModeSchema.optional(),
    model: nonEmptyString.optional(),
    thoughtLevel: nonEmptyString.optional(),
    // 会话内创建绑定当前会话（对齐 automation/create 的 targetTaskId），由 CLI 端口填入。
    boundSessionId: nonEmptyString.optional(),
  })
  .strict();
export type ANetOffPeakCreateProtocolParams = z.infer<typeof anetOffPeakCreateParamsSchema>;

// 协议侧任务快照：轮尾卡片与 OffPeakList 的最小字段面。
// 不暴露 serverTicketId（跨边界禁带）。
export const anetOffPeakTaskSnapshotSchema = z
  .object({
    offPeakTaskId: nonEmptyString,
    title: z.string(),
    status: z.enum(["queued", "paused", "running", "completed", "failed", "cancelled"]),
    queuePosition: z.number().int().positive().optional(),
    sessionId: nonEmptyString.optional(),
    createdAt: z.number().int().nonnegative(),
  })
  .strict();
export type ANetOffPeakTaskProtocolSnapshot = z.infer<typeof anetOffPeakTaskSnapshotSchema>;

// 失败分类跨协议保真（镜像 shared OffPeakTaskCreateResult 的判别联合，错误不降级为字符串）。
// model 白名单预校失败复用 client_validation 分类 + errorCode "model_not_allowed"，不扩分类枚举。
export const anetOffPeakCreateResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), task: anetOffPeakTaskSnapshotSchema }).strict(),
  z
    .object({
      ok: z.literal(false),
      failureStage: z.enum(["client_validation", "ticket_request", "local_persist"]),
      errorCategory: z.enum([
        "client_validation",
        "eligibility_3101",
        "quota_3103",
        "network",
        "invalid_response",
        "local_persist",
        "unknown",
      ]),
      errorCode: z.string(),
    })
    .strict(),
]);
export type ANetOffPeakCreateProtocolResult = z.infer<typeof anetOffPeakCreateResultSchema>;

export const anetOffPeakListParamsSchema = z
  .object({ workspace: anetWorkspaceRefSchema.optional() })
  .strict();
export type ANetOffPeakListProtocolParams = z.infer<typeof anetOffPeakListParamsSchema>;
export const anetOffPeakListResultSchema = z
  .object({ tasks: z.array(anetOffPeakTaskSnapshotSchema) })
  .strict();
export type ANetOffPeakListProtocolResult = z.infer<typeof anetOffPeakListResultSchema>;

// Session 运行实例生命周期；不同于 session/stop（停止生成）。
export const sessionLifecycleParamsSchema = z.object({ sessionId: z.string().min(1) }).strict();
export const sessionLifecycleStateSchema = z.enum([
  "unloaded",
  "starting",
  "ready",
  "stopping",
  "faulted",
]);
export const sessionLifecycleOperationSchema = z.enum(["ensureReady", "stop", "restart"]);
export const sessionLifecycleFailureSchema = z
  .object({
    operation: sessionLifecycleOperationSchema,
    code: z.string(),
    message: z.string(),
  })
  .strict();
export const sessionLifecycleSnapshotSchema = z
  .object({
    sessionId: z.string().min(1),
    state: sessionLifecycleStateSchema,
    generation: z.number().int().nonnegative().default(0),
    revision: z.number().int().nonnegative().default(0),
    lastError: sessionLifecycleFailureSchema.nullable(),
  })
  .strict();
export const sessionLifecycleResultSchema = z.object({ completed: z.literal(true) }).strict();
export type SessionLifecycleState = z.infer<typeof sessionLifecycleStateSchema>;
export type SessionLifecycleOperation = z.infer<typeof sessionLifecycleOperationSchema>;
export type SessionLifecycleFailure = z.infer<typeof sessionLifecycleFailureSchema>;
export type SessionLifecycleSnapshot = z.infer<typeof sessionLifecycleSnapshotSchema>;

export const anetProtocolMethods = {
  sessionLifecycleChanged: "session/lifecycle/changed",
  sessionLifecycleGetState: "session/lifecycle/getState",
  sessionLifecycleEnsureReady: "session/lifecycle/ensureReady",
  sessionLifecycleStop: "session/lifecycle/stop",
  sessionLifecycleRestart: "session/lifecycle/restart",
  runtimeCapabilities: "runtime/capabilities",
  computerUseOperationEvent: "computer-use/operation-event",
  sessionCreate: "session/create",
  sessionResume: "session/resume",
  sessionList: "session/list",
  sessionSubagents: "session/subagents",
  sessionRequestRuntimePreferences: "session/requestRuntimePreferences",
  subagentsReadRuntimeConfig: "subagents/readRuntimeConfig",
  sessionRead: "session/read",
  sessionMessages: "session/messages",
  sessionEvents: "session/events",
  sessionDebug: "session/debug",
  sessionSubscribe: "session/subscribe",
  // @deprecated（部分）：send 主路径已收敛 v4 sendText；仅剩 adapter 附件
  // 回退分支消费（v4 attachmentRef 上传/寄存命令面未建模），待附件命令面落地后移除。
  sessionSend: "session/send",
  // @deprecated：host 客户端方法已删（stop 已收敛 v4 stop 命令）。
  // wire case 留兼容（transport bypass 名单仍引用），随旧词整体删除时一并移除。
  sessionStop: "session/stop",
  // @deprecated：host 客户端方法已删（已收敛 v4 cancelBackgroundWork 命令）。
  // wire case 留兼容，随旧词整体删除时一并移除。
  sessionCancelBackgroundTask: "session/cancelBackgroundTask",
  // @deprecated：host 客户端方法已删（v4 forkAssistant 原生 handler 经
  // forkSessionAtMessage 钩子直调 server-operations.forkSession op）。wire case 与
  // fork params/result schema 保留＝op 存活面；fork record 归 v4 原生重写。
  sessionFork: "session/fork",
  sessionCompact: "session/compact",
  sessionGoal: "session/goal",
  sessionClose: "session/close",
  // setModel 仍被 anetSessionService 的 desktop 旧链路消费；replayable
  // switchModelConfig 已直接由目标 Environment Registry 解析 Selection。
  sessionSetModel: "session/setModel",
  // replayable facade 的思考深度/模式已收敛 v4 switchModelConfig/
  // switchCollaborationMode；剩余消费 = anetSessionService（desktop 旧链路，随
  // 桌面 v4 UI 收口清零）与 setMode 的 auto 值残留（v4 值域刻意排除 auto）。
  sessionSetThoughtLevel: "session/setThoughtLevel",
  sessionSetMode: "session/setMode",
  workspaceReadPresentation: "workspace/readPresentation",
  workspaceHookTrustGrant: "workspace/hooks/trustGrant",
  // 进程级 Account Provider Config 与 workspace 运行目录分离。
  providerUpdateAccountConfig: "provider/updateAccountConfig",
  providerRefreshRegistry: "provider/refreshRegistry",
  workspaceUpdateInteractionPreferences: "workspace/updateInteractionPreferences",
  workspaceUpdateModelIoPreferences: "workspace/updateModelIoPreferences",
  // Off-Peak 工具面门禁是 workspace 级事实（灰度 + 本地/远程），由 host 在 agent 就绪时同步；
  // CLI 对 legacy create/resume 与 v4 冷恢复统一读取。旧 CLI method-not-found → host 降级忽略。
  workspaceUpdateOffPeakToolPolicy: "workspace/updateOffPeakToolPolicy",
  // 动态工作流灰度门禁：同 Off-Peak 的同步模式。
  workspaceUpdateDynamicWorkflowPolicy: "workspace/updateDynamicWorkflowPolicy",
  // LLM 执行面在 CLI，直连不可行；消费仅 services 内部
  // （commit message），待 v4 workspace 查询/命令面覆盖后移除。
  workspaceGenerateText: "workspace/generateText",
  workspaceCancelGenerateText: "workspace/cancelGenerateText",
  providerTestModelConnectivity: "provider/testModelConnectivity",
  mcpList: "mcp/list",
  workspaceMcpTrust: "workspace/mcp/trust",
  mcpReadResource: "mcp/readResource",
  mcpUiOpenInstance: "mcp/uiOpenInstance",
  mcpUiCloseInstance: "mcp/uiCloseInstance",
  mcpUiValidateInstance: "mcp/uiValidateInstance",
  mcpUiSampling: "mcp/uiSampling",
  mcpUiCancelSampling: "mcp/uiCancelSampling",
  mcpUiCallTool: "mcp/uiCallTool",
  mcpUiCancelCall: "mcp/uiCancelCall",
  mcpUiReadResource: "mcp/uiReadResource",
  mcpUiListResources: "mcp/uiListResources",
  mcpUiListResourceTemplates: "mcp/uiListResourceTemplates",
  mcpUiSubscribeResource: "mcp/uiSubscribeResource",
  mcpUiUnsubscribeResource: "mcp/uiUnsubscribeResource",
  // App-Provided Tools：页面工具登记 / 注销，与模型调用的认领 / 回传（信箱投递走 v4 live 增量）。
  mcpUiRegisterAppTools: "mcp/uiRegisterAppTools",
  mcpUiUnregisterAppTools: "mcp/uiUnregisterAppTools",
  mcpUiClaimAppToolCall: "mcp/uiClaimAppToolCall",
  mcpUiResolveAppToolCall: "mcp/uiResolveAppToolCall",
  pluginsList: "plugins/list",
  pluginsReferenceCatalog: "plugins/referenceCatalog",
  pluginsListUiSurfaces: "plugins/listUiSurfaces",
  pluginsReferenceCatalogWithCategory: "plugins/referenceCatalogWithCategory",
  skillsReferenceCatalog: "skills/referenceCatalog",
  // 已保存工作流的 GUI 中枢：workspace 级、无会话。
  workflowsList: "workflows/list",
  workflowsGet: "workflows/get",
  workflowsUpdateMeta: "workflows/updateMeta",
  workflowsDelete: "workflows/delete",
  workflowsRuns: "workflows/runs",
  // 在项目档 / 全局档之间移动同名文件。
  workflowsMove: "workflows/move",
  // 完成卡的「直接保存」与「已保存」判定（docs/dynamic-workflow/transcript-and-notifications.md）：
  // 前者按 runId 从 journal 取脚本落盘，后者回答「这次 run 对应哪个已保存工作流」。
  workflowsSave: "workflows/save",
  workflowsForRun: "workflows/forRun",
  pluginsResolveSuggestedReference: "plugins/resolveSuggestedReference",
  pluginsSetEnabled: "plugins/setEnabled",
  pluginsOverview: "plugins/overview",
  pluginsMarketplaceAdd: "plugins/marketplace/add",
  pluginsMarketplaceRemove: "plugins/marketplace/remove",
  pluginsMarketplaceUpdate: "plugins/marketplace/update",
  pluginsInstall: "plugins/install",
  pluginsCancelOperation: "plugins/cancelOperation",
  pluginsUninstall: "plugins/uninstall",
  pluginsUpdate: "plugins/update",
  pluginsRestoreBuiltin: "plugins/restoreBuiltin",
  pluginsConfigure: "plugins/configure",
  pluginsResetConfig: "plugins/resetConfig",
  pluginsValidate: "plugins/validate",
  pluginsDescribe: "plugins/describe",
  automationCreate: "automation/create",
  topicResourceRead: "topic/resource/read",
  channelReply: "bot/channel/reply",
  topicResourceCancel: "topic/resource/cancel",
  automationUpdate: "automation/update",
  automationCheckTaskBinding: "automation/checkTaskBinding",
  automationList: "automation/list",
  automationDelete: "automation/delete",
  automationPause: "automation/pause",
  // Off-Peak 会话内创建：与 automation 兄弟并列的独立方法族。
  offPeakCreate: "offPeak/create",
  offPeakList: "offPeak/list",
  // @deprecated：host 消费已清零（anetAgentService 改走 v4/usage/stats）。
  // 仅剩 CLI server 的 wire 兼容 case；随旧词整体删除时一并移除。
  usageStats: "usage/stats",
  // ANet Protocol 对 agent 只暴露 session-first 方法；task 是 UI 投影概念，不能泄露进协议方法名。
  // @deprecated：host 已改走 v4/conversation/usage；后续与 usage/stats 一并移除。
  sessionUsage: "session/usage",
  // 资源管理器：CLI 回报其 MCP 子进程 pid 与插件归属（纯内存，无 I/O），采样在 Host 侧完成。
  processChildProcesses: "process/childProcesses",
  processNetworkCapture: "process/networkCapture",
  interactionRequestPermission: "interaction/requestPermission",
  interactionRequestUserInput: "interaction/requestUserInput",
  interactionRequestProviderRuntimeHeaders: "interaction/requestProviderRuntimeHeaders",
  interactionRequestOfficialMcpAuthHeaders: "interaction/requestOfficialMcpAuthHeaders",
  // browser-use 反向请求由 agent 发起，host 转给 main 中的 CDP executor。
  interactionBrowserList: "interaction/browserList",
  interactionBrowserExecute: "interaction/browserExecute",
} as const;

export type ANetProtocolMethod = (typeof anetProtocolMethods)[keyof typeof anetProtocolMethods];

export const anetProtocolEmptyResultSchema = z.object({}).strict();

// 最新 V4 主链已不再依赖旧版全量方法表；这里仅保留仍被兼容测试和 browser broker
// 消费的最小契约集合，避免重新引入已移除的 legacy 方法。
export const anetProtocolSessionMethodContracts = {
  [anetProtocolMethods.mcpUiOpenInstance]: {
    params: anetMcpUiOpenInstanceParamsSchema,
    result: anetMcpUiOpenInstanceResultSchema,
  },
  [anetProtocolMethods.mcpUiCloseInstance]: {
    params: anetMcpUiCloseInstanceParamsSchema,
    result: anetMcpUiCloseInstanceResultSchema,
  },
  [anetProtocolMethods.mcpUiValidateInstance]: {
    params: anetMcpUiCloseInstanceParamsSchema,
    result: anetMcpUiResourceSubscriptionResultSchema,
  },
  [anetProtocolMethods.workspaceHookTrustGrant]: {
    params: anetWorkspaceHookTrustGrantParamsSchema,
    result: anetWorkspaceHookTrustGrantResultSchema,
  },
  [anetProtocolMethods.workspaceMcpTrust]: {
    params: anetWorkspaceMcpTrustParamsSchema,
    result: anetWorkspaceMcpTrustResultSchema,
  },
  [anetProtocolMethods.mcpList]: {
    params: anetMcpListParamsSchema,
    result: anetMcpListResultSchema,
  },
  [anetProtocolMethods.mcpReadResource]: {
    params: anetMcpReadResourceParamsSchema,
    result: anetMcpReadResourceResultSchema,
  },
  [anetProtocolMethods.mcpUiSampling]: {
    params: anetMcpUiSamplingParamsSchema,
    result: anetMcpUiSamplingResultSchema,
  },
  [anetProtocolMethods.mcpUiCancelSampling]: {
    params: anetMcpUiCancelSamplingParamsSchema,
    result: anetMcpUiCancelCallResultSchema,
  },
  [anetProtocolMethods.mcpUiCallTool]: {
    params: anetMcpUiCallToolParamsSchema,
    result: anetMcpUiCallToolResultSchema,
  },
  [anetProtocolMethods.mcpUiCancelCall]: {
    params: anetMcpUiCancelCallParamsSchema,
    result: anetMcpUiCancelCallResultSchema,
  },
  [anetProtocolMethods.mcpUiReadResource]: {
    params: anetMcpUiReadResourceParamsSchema,
    result: anetMcpUiReadResourceResultSchema,
  },
  [anetProtocolMethods.mcpUiListResources]: {
    params: anetMcpUiListResourcesParamsSchema,
    result: anetMcpUiListResourcesResultSchema,
  },
  [anetProtocolMethods.mcpUiListResourceTemplates]: {
    params: anetMcpUiListResourcesParamsSchema,
    result: anetMcpUiListResourceTemplatesResultSchema,
  },
  [anetProtocolMethods.mcpUiSubscribeResource]: {
    params: anetMcpUiResourceSubscriptionParamsSchema,
    result: anetMcpUiResourceSubscriptionResultSchema,
  },
  [anetProtocolMethods.mcpUiUnsubscribeResource]: {
    params: anetMcpUiResourceSubscriptionParamsSchema,
    result: anetMcpUiResourceSubscriptionResultSchema,
  },
  [anetProtocolMethods.mcpUiRegisterAppTools]: {
    params: anetMcpUiRegisterAppToolsParamsSchema,
    result: anetMcpUiRegisterAppToolsResultSchema,
  },
  [anetProtocolMethods.mcpUiUnregisterAppTools]: {
    params: anetMcpUiUnregisterAppToolsParamsSchema,
    result: anetMcpUiUnregisterAppToolsResultSchema,
  },
  [anetProtocolMethods.mcpUiClaimAppToolCall]: {
    params: anetMcpUiClaimAppToolCallParamsSchema,
    result: anetMcpUiAppToolAcceptedResultSchema,
  },
  [anetProtocolMethods.mcpUiResolveAppToolCall]: {
    params: anetMcpUiResolveAppToolCallParamsSchema,
    result: anetMcpUiAppToolAcceptedResultSchema,
  },
  [anetProtocolMethods.interactionBrowserList]: {
    params: anetBrowserListParamsSchema,
    result: anetBrowserListResultSchema,
  },
  [anetProtocolMethods.interactionBrowserExecute]: {
    params: anetBrowserExecuteParamsSchema,
    result: anetBrowserExecuteResultSchema,
  },
} as const satisfies Partial<
  Record<ANetProtocolMethod, { params: z.ZodTypeAny; result: z.ZodTypeAny }>
>;

export type ANetProtocolSessionMethodContract =
  (typeof anetProtocolSessionMethodContracts)[keyof typeof anetProtocolSessionMethodContracts];

// 启动入口的独立存储命令与严格结果 schema，和 CLI 共用一份契约。
export {
  STORAGE_MIGRATION_COMMAND,
  storageMigrationReportSchema,
} from "../sqlite-migrations/contract.js";

/** 仅存储准备子进程的私有控制帧，原始路径不进入业务事件或遥测。 */
export const anetStoragePreparationFrameSchema = z.discriminatedUnion("method", [
  z
    .object({
      method: z.literal("startup/storagePath"),
      params: z.object({ path: z.string().min(1).max(32768) }).strict(),
    })
    .strict(),
  z
    .object({ method: z.literal("startup/storagePrepared"), params: z.object({}).strict() })
    .strict(),
  z
    .object({ method: z.literal("startup/storageState"), params: anetStorageStartupStateSchema })
    .strict(),
]);
export const anetStoragePathReadySchema = z
  .object({ method: z.literal("startup/storagePathReady"), reuse: z.boolean().optional() })
  .strict();

// 桌面本地 TTFT 的严格事实合同；检查点不能替代实际内容帧。
export { localTtftFactsSchema } from "../local-ttft/contract.js";
// 群来源由可信 Host 注入，V4 命令与持久化输入使用相同运行时校验。
export {
  botIdentitySchema,
  botTopicInputMessageSchema,
  botGroupInputSourceSchema,
  type BotGroupInputSource,
} from "../bots.js";
export {
  botTopicContextSchema,
  botTopicMessageSchema,
  type BotTopicHistoryBatch,
  type BotTopicMessage,
} from "../bots.js";
