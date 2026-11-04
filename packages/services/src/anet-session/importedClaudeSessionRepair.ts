import type { ANetSessionStateSnapshot } from "@anet/shared";
import { createServiceLogger } from "#src/logger/serviceLogger.js";
import { repairImportedClaudeSessionSnapshot } from "#src/session/claude-native/importedClaudeHistoryRepair.js";
import type { IANetAgentService } from "#src/anet-agent/anetAgent.js";
import type {
  ANetSessionReadParams,
  ANetSessionResumeParams,
} from "#src/anet-session/anetSession.js";

const logger = createServiceLogger("anet-session-service");

export async function repairEmptyImportedClaudeSessionSnapshot(params: {
  agentService: IANetAgentService;
  snapshot: ANetSessionStateSnapshot;
  target: ANetSessionResumeParams | ANetSessionReadParams;
}): Promise<ANetSessionStateSnapshot> {
  const repaired = await repairImportedClaudeSessionSnapshot({
    snapshot: params.snapshot,
    target: {
      workspacePath: params.target.workspacePath,
      workspaceIdentity: params.target.workspaceIdentity,
      taskId: params.target.sessionId,
      ...("mcpServers" in params.target && params.target.mcpServers
        ? { mcpServers: params.target.mcpServers }
        : {}),
    },
    createSession: (input) => params.agentService.createSession(input),
    onRepair: (history) => {
      logger.warn(
        undefined,
        `[anet-session-service] Claude 导入 session 历史异常，按 ${history.source} 回填 taskId=${params.target.sessionId}`,
      );
    },
  });
  return repaired ?? params.snapshot;
}
