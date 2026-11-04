export { hasConfiguredStandaloneCodingPlan, logoutANetCli } from "./auth-login-persistence.js";
import {
  persistStandaloneCodingPlanConnection,
  type StandaloneCodingPlanPersistenceResult,
} from "./auth-login-persistence.js";
export { ANetCliLoginError } from "./auth-login-contract.js";
export type {
  CodingPlanProviderId,
  LoginANetCliOptions,
  LoginANetCliResult,
  ConfigureCodingPlanApiKeyOptions,
  ConfigureCodingPlanApiKeyResult,
  LogoutANetCliOptions,
  LogoutANetCliResult,
} from "./auth-login-contract.js";
import {
  ANetCliLoginError,
  type CodingPlanProviderId,
  type LoginANetCliOptions,
  type LoginANetCliResult,
  type ConfigureCodingPlanApiKeyOptions,
  type ConfigureCodingPlanApiKeyResult,
} from "./auth-login-contract.js";
import {
  createCodingPlanApiKeyResolver,
  createSharedANetCredentialStore,
  createCliOAuthClient,
  createCliOAuthPollToken,
  openUrlInBrowser,
  resolveFamilyOAuthCredentialKeys,
  type CliOAuthClient,
} from "@anet/adapters";
import { createConfig } from "@anet/adapters/config";
import { createNodeHttpClientAdapter } from "@anet/adapters/http";
import type { EnvRecord } from "@anet/adapters/model";
import { buildANetEndpointUrls, resolveRuntimeANetEndpointOrigin } from "@anet/shared";
import { setTimeout as delay } from "node:timers/promises";
import { createStandaloneAccountIdentityFromSecret } from "./app/standalone-account-provider-runtime.js";
import { throwIfAborted, waitWithAbort } from "./auth-login-abort.js";
import { pollUntilReady } from "./auth-login-polling.js";

const DEFAULT_LOGIN_TIMEOUT_MS = 5 * 60 * 1_000;

/**
 * 各 provider 家族共用服务端轮询登录：init 拿授权地址，浏览器授权后轮询到 ready，
 * 再解析项目访问材料并写入凭据与默认模型。OAuth 登录不落盘派生 API Key，
 * 运行时按 `authSource: "oauth"` 用访问令牌换取请求凭据。
 */
export async function loginANetCli(
  options: LoginANetCliOptions,
): Promise<LoginANetCliResult> {
  const env = options.env ?? process.env;
  const providerId = options.providerId;
  // 先于任何网络请求校验:授权完成后才发现家族未注册,用户的浏览器登录就白做了。
  if (!resolveFamilyOAuthCredentialKeys(providerId)) {
    throw new ANetCliLoginError("auth_failed", `Unknown provider: ${providerId}`);
  }
  const now = options.now ?? Date.now;
  const timeoutMs = options.timeoutMs ?? DEFAULT_LOGIN_TIMEOUT_MS;
  const deadlineMs = now() + timeoutMs;
  const timeoutController = new AbortController();
  const signal = options.abortSignal
    ? AbortSignal.any([options.abortSignal, timeoutController.signal])
    : timeoutController.signal;
  const timeoutError = () =>
    new ANetCliLoginError("auth_timeout", "Authorization timed out. Please retry login.");
  let timer = setTimeout(() => timeoutController.abort(timeoutError()), timeoutMs);
  try {
    throwIfAborted(signal);
    const pollToken = options.pollToken ?? createCliOAuthPollToken();
    const credentialStore = options.credentialStore ?? createSharedANetCredentialStore({ env });
    const oauthClient = createOAuthClient(options, env);
    const initData = await waitWithAbort(oauthClient.init({ pollToken }, { signal }), signal);
    const remainingMs = Math.min(deadlineMs, initData.expires_at * 1_000) - now();
    if (remainingMs <= 0) throw timeoutError();
    clearTimeout(timer);
    timer = setTimeout(() => timeoutController.abort(timeoutError()), remainingMs);
    await options.onAuthorizeUrl?.(initData);
    throwIfAborted(signal);
    const browser = options.noBrowser
      ? undefined
      : await waitWithAbort(
          (options.openBrowser ?? openUrlInBrowser)(initData.authorize_url),
          signal,
        );
    if (browser) await options.onBrowserOpen?.(browser);
    const readyData = await pollUntilReady({
      abortSignal: signal,
      initData,
      now,
      oauthClient,
      onPollStatus: options.onPollStatus,
      pollToken,
      sleep: options.sleep ?? ((ms) => delay(ms, undefined, { signal })),
      timeoutMs: Math.max(0, deadlineMs - now()),
      createError: (code) =>
        code === "auth_timeout"
          ? timeoutError()
          : new ANetCliLoginError(code, "Authorization failed. Please retry login."),
    });
    await waitWithAbort(
      resolveCodingPlanMaterial({
        accessToken: readyData.accessToken,
        env,
        httpClient: options.httpClient,
        family: providerId,
        resolver: options.apiKeyResolver,
        signal,
      }),
      signal,
    );
    // 已取消或已超时的登录不能把迟到的 ready 响应写入凭据。
    throwIfAborted(signal);
    // 连接身份取账号用户 ID。上游曾有一个家族按组织与项目签发项目令牌,为它使用
    // 组织与项目的摘要作身份;该分支随厂商面一并删除,代价是此类家族的令牌缓存
    // 范围需要由其自身的注册条目再行约定。
    const accountIdentity = readyData.user.user_id;
    try {
      await credentialStore.saveFamilyLoginCredentials(providerId, {
        accessToken: readyData.accessToken,
        accountIdentity,
        jwtToken: readyData.token,
        ...(readyData.refreshToken ? { refreshToken: readyData.refreshToken } : {}),
        user: readyData.user,
      });
    } catch (error) {
      throw new ANetCliLoginError(
        "credential_write_failed",
        "Login succeeded but writing credentials failed.",
        { cause: error },
      );
    }
    throwIfAborted(signal);
    let configPatch: StandaloneCodingPlanPersistenceResult;
    try {
      configPatch = await persistStandaloneCodingPlanConnection({
        accountIdentity,
        authSource: "oauth",
        credentialStore,
        env,
        personalProviderConfigPath: options.personalProviderConfigPath,
        providerId,
      });
    } catch (error) {
      throw new ANetCliLoginError(
        "config_update_failed",
        "Login succeeded but updating ANet config failed.",
        { cause: error },
      );
    }
    return {
      ...(browser ? { browser } : {}),
      configPath: configPatch.path,
      credentialsPath: credentialStore.filePath,
      model: configPatch.mainModel,
      providerId,
      user: readyData.user,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function configureCodingPlanApiKey(
  options: ConfigureCodingPlanApiKeyOptions,
): Promise<ConfigureCodingPlanApiKeyResult> {
  const apiKey = options.apiKey.trim();
  if (!apiKey) {
    throw new ANetCliLoginError("config_update_failed", "API key must not be empty.");
  }
  const credentialStore =
    options.credentialStore ?? createSharedANetCredentialStore({ env: options.env });
  const configPatch = await persistStandaloneCodingPlanConnection({
    accountIdentity: createStandaloneAccountIdentityFromSecret(apiKey),
    apiKey,
    credentialStore,
    env: options.env ?? process.env,
    personalProviderConfigPath: options.personalProviderConfigPath,
    providerId: options.providerId,
  });
  return {
    configPath: configPatch.path,
    model: configPatch.mainModel,
    providerId: options.providerId,
  };
}

function createOAuthClient(options: LoginANetCliOptions, env: EnvRecord): CliOAuthClient {
  return createCliOAuthClient({
    baseUrl:
      options.baseUrl ?? buildANetEndpointUrls(resolveCliANetEndpointOrigin(env)).apiBaseUrl,
    providerId: options.providerId,
    httpClient: options.httpClient ?? createDefaultHttpClient(env),
  });
}

function resolveCliANetEndpointOrigin(env: EnvRecord): string {
  return resolveRuntimeANetEndpointOrigin(env);
}

function createDefaultHttpClient(env: EnvRecord) {
  const config = createConfig({ env });
  return createNodeHttpClientAdapter({
    env,
    proxyUrl: config.config.network.httpProxy,
    noProxy: config.config.network.noProxy,
    caCertFile: config.config.network.caCertFile,
    timeoutMs: config.config.network.timeout,
  });
}

async function resolveCodingPlanMaterial(input: {
  accessToken: string;
  env: EnvRecord;
  httpClient?: Parameters<typeof createCodingPlanApiKeyResolver>[0]["httpClient"];
  family: CodingPlanProviderId;
  signal?: AbortSignal;
  resolver?: ReturnType<typeof createCodingPlanApiKeyResolver>;
}) {
  const resolver =
    input.resolver ??
    createCodingPlanApiKeyResolver({
      httpClient: input.httpClient ?? createDefaultHttpClient(input.env),
    });
  return resolver.resolveMaterial(
    {
      accessToken: input.accessToken,
      family: input.family,
    },
    { signal: input.signal },
  );
}
