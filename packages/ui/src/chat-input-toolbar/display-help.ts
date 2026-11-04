import { ANET_AGENT_PROVIDER, type ANetProvider } from "@anet/shared";

export const ANET_MODE_OPTION_LABEL_IDS: Record<ANetProvider, Record<string, string>> = {
  [ANET_AGENT_PROVIDER]: {
    default: "mode.label.anet.default",
    build: "mode.label.anet.build",
    edit: "mode.label.anet.edit",
    plan: "mode.label.anet.plan",
    yolo: "mode.label.anet.yolo",
    guarded: "mode.label.anet.guarded",
  },
};

export const ANET_MODE_OPTION_DESCRIPTION_IDS: Record<ANetProvider, Record<string, string>> = {
  [ANET_AGENT_PROVIDER]: {
    default: "mode.description.anet.default",
    build: "mode.description.anet.build",
    edit: "mode.description.anet.edit",
    plan: "mode.description.anet.plan",
    yolo: "mode.description.anet.yolo",
    guarded: "mode.description.anet.guarded",
  },
};
