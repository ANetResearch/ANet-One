import {
  normalizeANetApiRetryStatus,
  isANetModelRetryRecoveryProgressPayload,
  resolveWorkspaceKey,
  type ANetSessionApiRetryStatus,
  type ANetSessionStateSnapshot,
  anetApiRetryFromModelNetworkStatusPayload,
  anetApiRetryFromStreamRecoveryPayload,
} from "@anet/shared";
import type { ANetSessionServiceEvent, ANetTaskTarget } from "#src/anet-session/anetSession.js";

export function createANetSessionApiRetryRuntimeTracker(): {
  trackApiRetryFromSessionEvent: (
    params: ANetTaskTarget,
    event: ANetSessionServiceEvent,
  ) => ANetSessionServiceEvent;
  withApiRetryRuntime: (snapshot: ANetSessionStateSnapshot) => ANetSessionStateSnapshot;
} {
  const apiRetryBySessionKey = new Map<string, ANetSessionApiRetryStatus | null>();

  function trackApiRetryFromSessionEvent(
    params: ANetTaskTarget,
    event: ANetSessionServiceEvent,
  ): ANetSessionServiceEvent {
    if (
      event.type === "session.event" &&
      (event.event.type === "session.updated" || event.event.type === "streamRecovery.updated")
    ) {
      // desktop-continuous 的 snapshot runtime 需要跟住 core recovery 进度；
      // 否则切回正在恢复的会话时只能看到空的重试状态。
      const apiRetry = apiRetryFromSessionPayload(asRecord(event.event.payload));
      const key = sessionKey({
        workspacePath: params.workspacePath,
        workspaceIdentity: params.workspaceIdentity,
        sessionId: event.event.sessionId,
      });
      if (apiRetry !== undefined) {
        apiRetryBySessionKey.set(key, apiRetry);
      } else if (
        apiRetryBySessionKey.get(key) != null &&
        isANetModelRetryRecoveryProgressPayload(asRecord(event.event.payload))
      ) {
        // snapshot runtime 和 live UI 要使用同一个恢复成功边界；
        // retry attempt 开始不清，等首个模型进展到达才清，避免重连时状态闪烁或切回 task 后残留。
        apiRetryBySessionKey.set(key, null);
      }
      return event;
    }
    if (event.type === "snapshot") {
      return {
        ...event,
        snapshot: withApiRetryRuntime(event.snapshot),
      };
    }
    return event;
  }

  function withApiRetryRuntime(snapshot: ANetSessionStateSnapshot): ANetSessionStateSnapshot {
    const sessionId = snapshot.session?.sessionId;
    const workspacePath = snapshot.session?.workspace?.workspacePath;
    if (!sessionId || !workspacePath) {
      return snapshot;
    }
    const key = sessionKey({
      workspacePath,
      workspaceIdentity: snapshot.session.workspace.workspaceIdentity,
      sessionId,
    });
    if (snapshot.runtime?.apiRetry !== undefined) {
      apiRetryBySessionKey.set(key, snapshot.runtime.apiRetry);
      return snapshot;
    }
    if (snapshot.session.status === "completed" || snapshot.session.status === "error") {
      apiRetryBySessionKey.set(key, null);
      return {
        ...snapshot,
        runtime: {
          ...snapshot.runtime,
          apiRetry: null,
        },
      };
    }
    if (!apiRetryBySessionKey.has(key)) {
      return snapshot;
    }
    return {
      ...snapshot,
      runtime: {
        ...snapshot.runtime,
        // desktop-continuous 主路径读取 protocol snapshot 时不经过 task adapter。
        // 这里把订阅到的网络重试临时态补回 snapshot，切回运行中 task 时当前 turn 底部才能继续显示重试提示。
        apiRetry: apiRetryBySessionKey.get(key) ?? null,
      },
    };
  }

  function sessionKey(params: ANetTaskTarget): string {
    return `${resolveWorkspaceKey(params)}\u0000${params.sessionId}`;
  }

  return {
    trackApiRetryFromSessionEvent,
    withApiRetryRuntime,
  };
}

function apiRetryFromSessionPayload(
  payload: Record<string, unknown>,
): ANetSessionApiRetryStatus | null | undefined {
  if ("apiRetry" in payload) {
    return normalizeANetApiRetryStatus(payload.apiRetry);
  }
  const runtimeRetry = normalizeANetApiRetryStatus(asRecord(payload.runtime).apiRetry);
  if (runtimeRetry !== undefined) {
    return runtimeRetry;
  }
  const metaRetry = normalizeANetApiRetryStatus(asRecord(asRecord(payload._meta).anet).apiRetry);
  if (metaRetry !== undefined) {
    return metaRetry;
  }
  return (
    anetApiRetryFromStreamRecoveryPayload(payload) ??
    anetApiRetryFromModelNetworkStatusPayload(payload)
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
