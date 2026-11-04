import type { TuiReadClipboardImage, TuiWriteClipboardText } from "@anet/tui";
import type { UiLocale } from "@anet/i18n";
import type { Logger } from "@anet/contracts";
import type {
  createManagedCdpBrowserRuntime,
  ManagedCdpBrowserRuntimeOptions,
} from "@anet/adapters/browser";
import type {
  createDefaultProviderEndpointRoutingPort,
  createModelAdapter,
  createANetApp,
  CreateDefaultProviderEndpointRoutingPortOptions,
  CreateModelAdapterOptions,
  configureCodingPlanApiKey,
  ConfigureCodingPlanApiKeyOptions,
  inspectANetSkill,
  inspectWorkspaceHookTrust,
  grantWorkspaceHookTrust,
  revokeWorkspaceHookTrustCli,
  inspectANetCustomCommand,
  InspectANetCustomCommandOptions,
  InspectANetSkillOptions,
  loginANetCli,
  LoginANetCliOptions,
  listANetCustomCommands,
  ListANetCustomCommandsOptions,
  loadANetCustomCommand,
  listANetSessions,
  listANetSkills,
  ListANetSessionsOptions,
  ListANetSkillsOptions,
  logoutANetCli,
  LogoutANetCliOptions,
  resolveLatestSession,
  ResolveLatestSessionOptions,
  RunANetProtocolAgentOptions,
  prepareANetTelemetryEnv,
  startProcessProviderRegistryRuntime,
  shutdownANetTelemetry,
  ANetAppOptions,
} from "@anet/bootstrap";
import type { CliEnv, DotenvLoadResult, LoadCliDotenvOptions } from "./env.js";
import type { PluginsCommandOverrides } from "./plugins-command.js";
import type { CliShutdownProcess } from "./shutdown.js";
import type { resolveWorkspaceGitBranch } from "./tui-workspace-git.js";

export type BootstrapModule = typeof import("@anet/bootstrap");

export interface RunDependencies extends PluginsCommandOverrides {
  migrateStorage?: () => Promise<import("@anet/shared/sqlite-migrations").MigrationResult>;
  protocolLifecycle?: RunANetProtocolAgentOptions["lifecycle"];
  protocolInput?: NodeJS.ReadableStream;
  createManagedCdpBrowserRuntime?: (
    options?: ManagedCdpBrowserRuntimeOptions,
  ) => ReturnType<typeof createManagedCdpBrowserRuntime>;
  createModelAdapter?: (
    options?: CreateModelAdapterOptions,
  ) => ReturnType<typeof createModelAdapter>;
  createProviderEndpointRoutingPort?: (
    options: CreateDefaultProviderEndpointRoutingPortOptions,
  ) => ReturnType<typeof createDefaultProviderEndpointRoutingPort>;
  createANetApp?: (
    options?: ANetAppOptions,
  ) => Awaited<ReturnType<typeof createANetApp>> | ReturnType<typeof createANetApp>;
  /**
   * Session-event shaper for --output-format stream-json. Defaults to the
   * bootstrap module's, which is also what the protocol server uses; injectable
   * so a caller that supplies its own `createANetApp` (tests, embedders) can
   * still stream, since the bootstrap module is not loaded on that path.
   */
  mapSessionEvent?: BootstrapModule["mapSessionEvent"];
  cwd?: () => string;
  env?: CliEnv;
  inspectSkill?: (options: InspectANetSkillOptions) => ReturnType<typeof inspectANetSkill>;
  inspectWorkspaceHookTrust?: typeof inspectWorkspaceHookTrust;
  grantWorkspaceHookTrust?: typeof grantWorkspaceHookTrust;
  revokeWorkspaceHookTrustCli?: typeof revokeWorkspaceHookTrustCli;
  inspectCustomCommand?: (
    options: InspectANetCustomCommandOptions,
  ) => ReturnType<typeof inspectANetCustomCommand>;
  loginANetCli?: (options: LoginANetCliOptions) => ReturnType<typeof loginANetCli>;
  configureCodingPlanApiKey?: (
    options: ConfigureCodingPlanApiKeyOptions,
  ) => ReturnType<typeof configureCodingPlanApiKey>;
  loadDotenv?: (options?: LoadCliDotenvOptions) => DotenvLoadResult;
  prepareANetTelemetryEnv?: typeof prepareANetTelemetryEnv;
  projectConfigPath?: string;
  listSessions?: (options: ListANetSessionsOptions) => ReturnType<typeof listANetSessions>;
  listCustomCommands?: (
    options: ListANetCustomCommandsOptions,
  ) => ReturnType<typeof listANetCustomCommands>;
  loadCustomCommand?: (
    options: InspectANetCustomCommandOptions,
  ) => ReturnType<typeof loadANetCustomCommand>;
  // headless slash 路由要和 app facade 的保留名 gate 用同一个判据；默认取 bootstrap 的，
  // 注入点只为让单测不必拉起整个 bootstrap 模块。见 prompt-command.ts。
  isReservedSlashCommandName?: BootstrapModule["isReservedANetSlashCommandName"];
  listSkills?: (options: ListANetSkillsOptions) => ReturnType<typeof listANetSkills>;
  logger?: Logger;
  readClipboardImage?: TuiReadClipboardImage;
  writeClipboardText?: TuiWriteClipboardText;
  resolveLatestSession?: (
    options: ResolveLatestSessionOptions,
  ) => ReturnType<typeof resolveLatestSession>;
  resolveWorkspaceGitBranch?: typeof resolveWorkspaceGitBranch;
  logoutANetCli?: (options?: LogoutANetCliOptions) => ReturnType<typeof logoutANetCli>;
  runANetProtocolAgent?: (options?: RunANetProtocolAgentOptions) => Promise<void>;
  runTui?: typeof import("@anet/tui").runTui;
  skipUserConfig?: boolean;
  userConfigPath?: string;
  exitProcess?: (code: number) => void;
  shutdownCleanupTimeoutMs?: number;
  shutdownProcess?: CliShutdownProcess;
  startProcessProviderRegistryRuntime?: typeof startProcessProviderRegistryRuntime;
  shutdownANetTelemetry?: typeof shutdownANetTelemetry;
}

export type CliPermissionMode = "build" | "plan" | "edit" | "yolo" | "guarded";
export type CliRuntimeMode = CliPermissionMode | "auto";

export interface CliModeState {
  current?: CliRuntimeMode;
  override?: CliPermissionMode;
}

export interface CliTargetRequest {
  objective: string;
  replaceExisting: boolean;
}

export type ModeCapableApp = Awaited<ReturnType<typeof createANetApp>> & {
  getMode?: () => CliRuntimeMode;
  setLocale?: (locale: UiLocale) => Promise<{ locale: "en-US" | "zh-CN" }>;
  setMode?: (mode: CliRuntimeMode) => Promise<{ mode: CliRuntimeMode }>;
};

export interface CliResumeRequest {
  continueSession: boolean;
  resumeSessionId?: string;
}
