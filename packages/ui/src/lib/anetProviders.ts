import { ANET_AGENT_PROVIDER, ANET_AGENT_PROVIDER_LABEL, type ANetProvider } from "@anet/shared";

export const ANET_AGENT_PROVIDERS: ANetProvider[] = [ANET_AGENT_PROVIDER];

export const ANET_AGENT_PROVIDER_LABELS: Record<ANetProvider, string> = {
  [ANET_AGENT_PROVIDER]: ANET_AGENT_PROVIDER_LABEL,
};

export function supportsANetSessionFork(provider: ANetProvider): boolean {
  void provider;
  // 功能开关：fork 入口恢复对所有 ANet provider 开放；实际可操作性仍由 task 状态、
  // assistant 目标和运行中保护 guard 控制，避免把 active/failed 分支暴露为可 fork。
  return true;
}

export function shouldHideANetSessionForkAction(provider: ANetProvider): boolean {
  return !supportsANetSessionFork(provider);
}
