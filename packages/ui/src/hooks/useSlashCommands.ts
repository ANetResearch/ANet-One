/**
 * ANet Agent Slash Commands 便捷 hook
 *
 * 返回当前 workspace 下 Agent 广播的可用 slash commands 列表。
 */
import { useANetSessionStore, selectWorkspaceANetState } from "../store/anetSessionStore.js";

export function useSlashCommands(workspacePath: string, workspaceIdentity?: string) {
  return useANetSessionStore(
    (state) => selectWorkspaceANetState(state, workspacePath, workspaceIdentity).slashCommands,
  );
}
