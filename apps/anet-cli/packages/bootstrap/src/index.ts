// Bootstrap public API surface.

export * from "./app/create-app.js";
export type {
  ListANetSessionsOptions,
  PromptInput,
  ResolveLatestSessionOptions,
  ResumeOptions,
  RunANetProtocolAgentOptions,
  SendInputOptions,
  SendInputResult,
  SetLocaleResult,
  SteerTurnOptions,
  SubmitPromptOptions,
  UserPromptInput,
  ANetApp,
  ANetAppOptions,
  ANetModelOption,
} from "./app/types.js";
export * from "./auth-login.js";
export {
  inspectANetCustomCommand,
  listANetCustomCommands,
  loadANetCustomCommand,
} from "./custom-commands.js";
export type {
  InspectANetCustomCommandOptions,
  ListANetCustomCommandsOptions,
  ANetCustomCommandInspection,
} from "./custom-commands.js";
export { createModelAdapter } from "./model-factory.js";
export type { CreateModelAdapterOptions } from "./model-factory.js";
export {
  createDefaultProviderEndpointRoutingPort,
  resolveProcessProviderEndpointRoutingPort,
} from "./provider-endpoint-routing.js";
export type {
  CreateDefaultProviderEndpointRoutingPortOptions,
  ResolveProcessProviderEndpointRoutingPortOptions,
} from "./provider-endpoint-routing.js";
export { startProcessProviderRegistryRuntime } from "./app/process-provider-registry-runtime.js";
export type { ProcessProviderRegistryRuntimeOptions } from "./app/process-provider-registry-runtime.js";
export {
  addANetPluginMarketplace,
  getANetPluginsOverview,
  installANetMarketplacePlugin,
  listANetPlugins,
  removeANetPluginMarketplace,
  resolveANetPlugins,
  setANetPluginEnabled,
  uninstallANetMarketplacePlugin,
  updateANetMarketplacePlugin,
  updateANetPluginMarketplace,
  validateANetPluginPath,
} from "./plugins.js";
export type {
  AddANetMarketplaceOptions,
  InstallANetMarketplacePluginOptions,
  ListANetPluginsOptions,
  RemoveANetMarketplaceOptions,
  ResolveANetPluginsOptions,
  SetANetPluginEnabledOptions,
  SetANetPluginEnabledResult,
  UninstallANetMarketplacePluginOptions,
  UpdateANetMarketplaceOptions,
  UpdateANetMarketplacePluginOptions,
  ValidateANetPluginPathOptions,
  ANetAvailablePluginData,
  ANetInstalledPluginData,
  ANetMarketplaceSummaryData,
  ANetMarketplaceUpdateData,
  ANetPluginInstallData,
  ANetPluginUpdateData,
  ANetPluginsOverviewData,
} from "./plugins.js";
export { runANetProtocolAgent } from "./anet-protocol-entrypoint.js";
// Exposed for the CLI's --output-format stream-json: it needs the same event
// shape the protocol server emits, rather than inventing a second one.
export { mapSessionEvent } from "./anet-protocol/session-mapper.js";
export { prepareANetTelemetryEnv, shutdownANetTelemetry } from "./telemetry-bootstrap.js";
export type { SessionTranscriptMessage, SessionTranscriptPart } from "./session-transcript.js";
export { listANetSessions, resolveLatestSession } from "./sessions.js";
export { inspectANetSkill, listANetSkills } from "./skills.js";
export type {
  InspectANetSkillOptions,
  ListANetSkillsOptions,
  ANetSkillInspection,
} from "./skills.js";
// Exposed for the CLI's headless slash routing: it must decide "is this a real
// custom command?" with the *same* reserved-name gate the app facade's
// customCommandPromptResolver applies, or the two disagree and a reserved name
// reaches the model as literal prompt text. See prompt-command.ts.
export { isReservedANetSlashCommandName } from "./slash-command-surface.js";
export {
  grantWorkspaceHookTrust,
  inspectWorkspaceHookTrust,
  revokeWorkspaceHookTrustCli,
} from "./workspace-hook-trust-cli.js";
export type {
  WorkspaceHookTrustCliItem,
  WorkspaceHookTrustCliStatus,
  WorkspaceHookTrustCliTarget,
} from "./workspace-hook-trust-cli.js";

// 嵌入式调用复用产品请求装配，避免来源头与网络配置漂移。
export { createRuntimeAiSdkModelExecutionConfig } from "./model-config.js";
