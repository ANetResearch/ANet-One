import {
  ANET_AGENT_PROVIDER,
  ANET_COMMAND_AGENT_SOURCES,
  type ANetProvider,
  type CommandAgentSource,
} from "@anet/shared";

export const COMMAND_AGENT_SOURCES = [
  ...ANET_COMMAND_AGENT_SOURCES,
] as const satisfies readonly CommandAgentSource[];

export const COMMAND_AGENT_SOURCE_META: Record<
  CommandAgentSource,
  {
    labelId: string;
    provider: ANetProvider;
    pathHint: string;
  }
> = {
  anetAgent: {
    labelId: "settings.commands.source.anetAgent",
    pathHint: "~/.anet-one/commands",
    provider: ANET_AGENT_PROVIDER,
  },
};
