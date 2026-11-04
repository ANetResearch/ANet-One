/**
 * ANet session UI 状态 store
 *
 * 一个 tab 对应一个 workspace，所以聊天相关状态也必须按 workspace 分桶保存。
 * 这样切换标签页时，当前任务、输入中的草稿态和初始化状态才不会互相串台。
 */
import { create } from "zustand";
import { shouldExposeE2EStoreBridge } from "@/lib/e2eStoreBridge.js";
import { type ANetSessionStoreState } from "./anetSessionStoreTypes.js";
import { getWorkspaceState } from "./anetSessionStoreSelectors.js";
import { createNavigationSlice } from "./anetSessionStoreNavigation.js";
import { createTaskSlice } from "./anetSessionStoreTaskSlice.js";
import { createWorkspaceSlice } from "./anetSessionStoreWorkspaceSlice.js";
import { uiMemoryDiagnosticsRegistry } from "@/lib/memoryDiagnostics.js";

export const useANetSessionStore = create<ANetSessionStoreState>()((set, get) => ({
  workspaces: {},
  ...createNavigationSlice(set, get),
  ...createWorkspaceSlice(set),
  ...createTaskSlice(set),
  getWorkspaceState: (workspacePath: string, workspaceIdentity?: string) =>
    getWorkspaceState(get(), workspacePath, workspaceIdentity),
}));

type ANetSessionStoreE2EBridge = typeof useANetSessionStore;

declare global {
  interface Window {
    __anetSessionStoreE2E?: ANetSessionStoreE2EBridge;
  }
}

if (shouldExposeE2EStoreBridge()) {
  // E2E 诊断入口必须由 WDIO 显式打开，不能复用 ANET_ENV=test，避免产品测试环境暴露可变全局 store。
  window.__anetSessionStoreE2E = useANetSessionStore;
}

// ────────────────────────────────────────────
// Re-exports: 保持外部 `from '@/store/anetSessionStore'` 的导入路径继续工作
// ────────────────────────────────────────────
export * from "./anetSessionStoreTypes.js";
export * from "./anetSessionStoreSelectors.js";
// Re-export navigation types used externally:
export type {
  TaskNavigationHistory,
  TaskNavEntry,
  WorkspaceNavEntry,
} from "@/lib/taskNavigationHistory.js";

// 内存诊断计数器：workspace 桶全仓无删除路径，先落日志。
uiMemoryDiagnosticsRegistry.register("sessionStore", () => ({
  workspaces: Object.keys(useANetSessionStore.getState().workspaces).length,
}));
