import { z } from "zod";
import type { CommandAgentSource } from "./command-types.js";
import type { ANetProvider } from "./anet-task-types-core.js";

export const ANET_AGENT_PROVIDER = "anet" satisfies ANetProvider;
export const ANET_AGENT_PROVIDER_LABEL = "ANet Agent";
export const ANET_COMMAND_AGENT_SOURCE = "anetAgent" satisfies CommandAgentSource;

/**
 * 解析持久化/relay 数据时的 provider 归一 schema：
 * 已移除的第三方 provider 历史值仅作为归一化输入保留，统一收敛为当前 provider；
 * 其它非法值保持拒绝，与收窄前的校验边界一致。
 *
 * "glm" 是本 provider 改名前的取值，已落在任务索引库与历史 relay 数据里，
 * 因此留在接受名单中，但不再产生。
 */
export const legacyANetProviderSchema = z
  .enum(["claude", "opencode", "gemini", "codex", "glm", "anet"])
  .transform((): typeof ANET_AGENT_PROVIDER => ANET_AGENT_PROVIDER);

export const ANET_ENABLED_AGENT_PROVIDERS = [
  ANET_AGENT_PROVIDER,
] as const satisfies readonly ANetProvider[];

export const ANET_COMMAND_AGENT_SOURCES = [
  ANET_COMMAND_AGENT_SOURCE,
] as const satisfies readonly CommandAgentSource[];

export function normalizeAgentProviderToANetAgent(_provider?: ANetProvider | null): ANetProvider {
  return ANET_AGENT_PROVIDER;
}

export function normalizeAgentProvidersToANetAgent(
  _providers?: ReadonlyArray<ANetProvider> | null,
): ANetProvider[] {
  return [...ANET_ENABLED_AGENT_PROVIDERS];
}

export function normalizeCommandAgentSourceToANetAgent(
  _agentSource?: CommandAgentSource | null,
): CommandAgentSource {
  return ANET_COMMAND_AGENT_SOURCE;
}

export function isANetAgentProvider(
  provider: ANetProvider | null | undefined,
): provider is typeof ANET_AGENT_PROVIDER {
  return provider === ANET_AGENT_PROVIDER;
}
