import type {
  createCodingPlanApiKeyResolver,
  createCliOAuthClient,
  BrowserOpenResult,
  CliOAuthInitData,
  CliOAuthPollData,
  CliOAuthUser,
  SharedANetCredentialStore,
} from "@anet/adapters";
import type { EnvRecord } from "@anet/adapters/model";
import type { ProviderFamilyDomain } from "@anet/shared";

/** 账号型 provider 家族 id,取值来自 `MODEL_PROVIDER_FAMILY_SPECS`。 */
export type CodingPlanProviderId = ProviderFamilyDomain;

export interface LoginANetCliOptions {
  providerId: CodingPlanProviderId;
  abortSignal?: AbortSignal;
  apiKeyResolver?: ReturnType<typeof createCodingPlanApiKeyResolver>;
  baseUrl?: string;
  credentialStore?: SharedANetCredentialStore;
  env?: EnvRecord;
  httpClient?: Parameters<typeof createCliOAuthClient>[0]["httpClient"];
  noBrowser?: boolean;
  now?: () => number;
  onAuthorizeUrl?: (data: CliOAuthInitData) => void | Promise<void>;
  onBrowserOpen?: (result: BrowserOpenResult) => void | Promise<void>;
  onPollStatus?: (data: CliOAuthPollData) => void | Promise<void>;
  openBrowser?: (url: string) => Promise<BrowserOpenResult>;
  pollToken?: string;
  sleep?: (ms: number) => Promise<void>;
  timeoutMs?: number;
  personalProviderConfigPath?: string;
}

export interface LoginANetCliResult {
  browser?: BrowserOpenResult;
  configPath: string;
  credentialsPath: string;
  model: string;
  providerId: CodingPlanProviderId;
  user: CliOAuthUser;
}

export interface ConfigureCodingPlanApiKeyOptions {
  apiKey: string;
  credentialStore?: SharedANetCredentialStore;
  env?: EnvRecord;
  personalProviderConfigPath?: string;
  providerId: CodingPlanProviderId;
}

export interface ConfigureCodingPlanApiKeyResult {
  configPath: string;
  model: string;
  providerId: CodingPlanProviderId;
}

export interface LogoutANetCliOptions {
  credentialStore?: SharedANetCredentialStore;
  env?: EnvRecord;
}

export interface LogoutANetCliResult {
  credentialsPath: string;
}

export class ANetCliLoginError extends Error {
  readonly code:
    | "auth_failed"
    | "auth_timeout"
    | "config_update_failed"
    | "credential_write_failed";

  constructor(
    code: ANetCliLoginError["code"],
    message: string,
    options: { cause?: unknown } = {},
  ) {
    super(message, options);
    this.name = "ANetCliLoginError";
    this.code = code;
  }
}
