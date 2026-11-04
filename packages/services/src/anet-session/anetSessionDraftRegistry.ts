import type { ANetSessionStateSnapshot } from "@anet/shared";
import type { ANetSessionWorkspaceTarget, ANetTaskTarget } from "#src/anet-session/anetSession.js";

function getWorkspaceKey(target: ANetSessionWorkspaceTarget): string {
  return target.workspaceIdentity?.trim() || target.workspacePath;
}

function getSessionScopedKey(target: ANetTaskTarget): string {
  return `${getWorkspaceKey(target)}\0${target.sessionId}`;
}

export function createANetDeferredDraftRegistry() {
  const sessionKeys = new Set<string>();

  return {
    remember(params: ANetSessionWorkspaceTarget, snapshot: ANetSessionStateSnapshot): void {
      sessionKeys.add(
        getSessionScopedKey({
          workspacePath: snapshot.session.workspace.workspacePath,
          workspaceIdentity:
            snapshot.session.workspace.workspaceIdentity ?? params.workspaceIdentity,
          sessionId: snapshot.session.sessionId,
        }),
      );
    },

    has(target: ANetTaskTarget): boolean {
      return sessionKeys.has(getSessionScopedKey(target));
    },

    forget(target: ANetTaskTarget): void {
      sessionKeys.delete(getSessionScopedKey(target));
    },
  };
}
