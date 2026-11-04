import type { WorkspacePurpose, ANetTaskMeta } from "@anet/shared";

export type ANetTaskListKind = "pinned" | "archived" | "timeline" | "active";
export type ANetTaskListSortBy = "created" | "updated";

export interface ANetTaskListWorkspaceScope {
  workspacePath: string;
  workspaceIdentity?: string;
  workspacePurpose?: WorkspacePurpose;
}

export interface ANetTaskListQuery {
  kind: ANetTaskListKind | "all";
  /** host 由存储 owner 确定全部范围，不接受 UI 已打开工作区作为历史目录。 */
  workspaceScopes: ANetTaskListWorkspaceScope[] | "host";
  sortBy: ANetTaskListSortBy;
  search?: string;
  limit?: number;
}

export type ANetTaskListItem = ANetTaskMeta & {
  searchSnippet?: string;
  searchSnippets?: string[];
};

export interface ANetTaskListResult {
  items: ANetTaskListItem[];
  total: number;
  hasMore: boolean;
}

export interface ANetWorkspaceEventSubscriptionParams {
  workspacePath: string;
  workspaceIdentity?: string;
}
