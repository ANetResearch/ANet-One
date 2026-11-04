import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import type { HttpClientPort, HttpClientRequest, HttpClientResponse } from "@anet/contracts";
import {
  SHARED_ANET_CREDENTIAL_KEYS,
  createSharedANetCredentialStore,
} from "@anet/adapters/auth";
import {
  standaloneAccountIdentityCredentialKey,
  standaloneAccountAuthSourceCredentialKey,
  standaloneAccountProviderCredentialKey,
} from "../src/app/standalone-account-provider-runtime.js";
import {
  configureCodingPlanApiKey,
  hasConfiguredStandaloneCodingPlan,
  loginANetCli,
  logoutANetCli,
} from "../src/auth-login.js";
import { registerModelProviderFamilySpecs } from "@anet/shared";

// 家族注册表在本分发中为空;这里注入一个夹具家族,登录链路按注册表工作。
// 本分发的 provider family 注册表为空;这里注册夹具家族,被测链路按注册表工作。
// 用 registerModelProviderFamilySpecs() 而不是 vi.mock("@anet/shared"):被 mock 的只是
// barrel 的导出,而 @anet/shared 内部的派生表引用的是同模块局部常量,
// model-provider-types.ts 又直接 import "./model-provider-family.js" —— 两者都绕不过
// barrel 上的 mock,mock 之后所有查询函数仍按空表工作。
registerModelProviderFamilySpecs([
  {
  id: "family-a",
  label: "Family A",
  rootDomain: "family-a.example",
  oauthProviderId: "family-a",
  startPlanProviderId: "account:family-a-start-plan",
  individualCodingPlanProviderId: "account:family-a-coding-plan",
  teamCodingPlanProviderId: "account:family-a-team-coding-plan",
  teamCodingPlanManageUrl: "",
  },
]);

const FAMILY_ID = "family-a";
const FAMILY_PROVIDER_ID = "account:family-a-coding-plan";
const FAMILY_ACCESS_TOKEN_KEY = "oauth:family-a:access_token";
const FAMILY_ORIGIN = "https://anet.vendor-a.example";
const AUTHORIZE_URL = "https://auth.vendor-a.example/oauth/authorize";

const TEST_ENV = {
  ANET_CREDENTIAL_SECRET: "bootstrap-test-secret",
  ANET_BUILTIN_PROVIDER_CONFIG_FILE: fileURLToPath(
    new URL("../../../../../config/provider/anet-builtin.json", import.meta.url),
  ),
};

/** 写出只含夹具家族个人 Coding Plan provider 的内置 provider 配置,返回指向它的 env。 */
async function writeFamilyBuiltinConfig(
  dir: string,
  providerId = FAMILY_PROVIDER_ID,
  modelId = "Model-A",
): Promise<typeof TEST_ENV & { ANET_BASE_URL: string }> {
  const path = join(dir, "anet-builtin.json");
  await writeFile(
    path,
    JSON.stringify({
      schemaVersion: 1,
      revision: 1,
      config: {
        providerConfigRules: {
          templateRules: [],
          providerRules: [
            {
              providerId,
              config: {
                group: "family-a-family",
                builtinModelIds: [modelId],
                access: {
                  type: "provider-account",
                  accountType: FAMILY_ID,
                  mode: "individual-coding-plan",
                },
              },
            },
          ],
        },
        modelConfigRules: {
          modelRules: [],
          modelApiRules: [],
          providerSiteRules: [],
          templateModelRules: [],
          builtinProviderModelRules: [],
        },
      },
    }),
  );
  return { ...TEST_ENV, ANET_BUILTIN_PROVIDER_CONFIG_FILE: path, ANET_BASE_URL: FAMILY_ORIGIN };
}

describe("ANet CLI login", () => {
  it("没有任何 Standalone 账号凭据时不会误报已配置 Coding Plan", async () => {
    const dir = await mkdtemp(join(tmpdir(), "anet-no-login-"));
    const credentialStore = createSharedANetCredentialStore({
      baseDir: dir,
      env: TEST_ENV,
    });
    try {
      await expect(
        hasConfiguredStandaloneCodingPlan({ credentialStore, env: TEST_ENV }),
      ).resolves.toBe(false);
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  });

  it("uses the configured ANet endpoint for OAuth init", async () => {
    const httpClient = new FakeHttpClient([
      jsonResponse({
        code: 0,
        msg: "",
        data: {
          flow_id: "flow-failed",
          poll_token: "poll-token",
          authorize_url: `${AUTHORIZE_URL}?state=failed`,
          expires_at: 9999999999,
          poll_interval_sec: 2,
        },
      }),
      jsonResponse({
        code: 0,
        msg: "",
        data: {
          status: "failed",
        },
      }),
    ]);

    await expect(
      loginANetCli({
        env: { ...TEST_ENV, ANET_BASE_URL: FAMILY_ORIGIN },
        httpClient,
        noBrowser: true,
        now: () => 1_000,
        pollToken: "poll-token",
        providerId: FAMILY_ID,
        sleep: async () => undefined,
      }),
    ).rejects.toMatchObject({
      code: "auth_failed",
    });

    expect(httpClient.requests[0]?.url).toBe(`${FAMILY_ORIGIN}/api/v1/oauth/cli/init`);
  });

  // 上游在这一步用登录令牌换取厂商的项目令牌(组织 / 项目 / apiKey / accessToken 四段
  // 响应)。该换证面随厂商一并移除:createCodingPlanApiKeyResolver 现在没有任何注册实现,
  // 一律报 project_token_unavailable(adapters/src/auth/coding-plan-api-key.ts;非存在性由
  // adapters/tests/auth.test.ts 的 "reports unavailable when no provider is registered" 守着)。
  // 因此 loginANetCli 的成功路径在本分发不可达,原来那条用例("polls OAuth, stores account
  // credentials, and updates the configured default")连同它的四段厂商响应夹具一并删除 ——
  // 留着它并注入一个假 resolver,等于假装换证面还在。
  //
  // 这里保留的是移除之后仍然成立、而且必须成立的保证:换证失败时登录整体失败,不留下
  // 半套凭据或一份已经改过的默认选择。半套状态比登录失败更难排查。
  it("换证不可用时登录失败，不留下任何凭据或默认选择", async () => {
    const dir = await mkdtemp(join(tmpdir(), "anet-login-"));
    const credentialsBaseDir = join(dir, "home");
    const personalProviderConfigPath = join(dir, "provider_config.json");
    const env = await writeFamilyBuiltinConfig(dir);
    const credentialStore = createSharedANetCredentialStore({
      baseDir: credentialsBaseDir,
      env,
    });
    const httpClient = new FakeHttpClient([
      jsonResponse({
        code: 0,
        msg: "",
        data: {
          flow_id: "flow-1",
          poll_token: "poll-token",
          authorize_url: `${AUTHORIZE_URL}?state=state`,
          expires_at: 9999999999,
          poll_interval_sec: 2,
        },
      }),
      jsonResponse({ code: 0, msg: "", data: { status: "pending" } }),
      jsonResponse({
        code: 0,
        msg: "",
        data: {
          status: "ready",
          token: "jwt-token",
          user: { user_id: "u_1", email: "alice@example.com", name: "Alice" },
          "family-a": { access_token: "family-access-token" },
        },
      }),
    ]);
    const statuses: string[] = [];
    let authorizeUrl = "";

    try {
      await expect(
        loginANetCli({
          credentialStore,
          env,
          httpClient,
          noBrowser: true,
          now: () => 1_000,
          onAuthorizeUrl: (data) => {
            authorizeUrl = data.authorize_url;
          },
          onPollStatus: (data) => {
            statuses.push(data.status);
          },
          pollToken: "poll-token",
          providerId: FAMILY_ID,
          sleep: async () => undefined,
          personalProviderConfigPath,
        }),
      ).rejects.toMatchObject({
        name: "CodingPlanApiKeyError",
        message: "project_token_unavailable",
      });
      // 授权与轮询这两段仍然真实跑完,失败点在之后的换证。
      expect(authorizeUrl).toBe(`${AUTHORIZE_URL}?state=state`);
      expect(statuses).toEqual(["pending", "ready"]);
      expect(await credentialStore.load(FAMILY_ACCESS_TOKEN_KEY)).toBeNull();
      expect(await credentialStore.load(SHARED_ANET_CREDENTIAL_KEYS.anetJwtToken)).toBeNull();
      expect(await credentialStore.load(SHARED_ANET_CREDENTIAL_KEYS.activeProvider)).toBeNull();
      expect(
        await credentialStore.load(standaloneAccountIdentityCredentialKey(FAMILY_PROVIDER_ID)),
      ).toBeNull();
      await expect(readFile(personalProviderConfigPath, "utf-8")).rejects.toMatchObject({
        code: "ENOENT",
      });
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  });

  it("clears shared family credentials and standalone account access on logout", async () => {
    const dir = await mkdtemp(join(tmpdir(), "anet-logout-"));
    // logoutANetCli 要清哪些 provider 的身份/账号 Key,是从**内置 provider 配置文件**
    // 里枚举出来的(readStandaloneCodingPlanProviders),不是从家族注册表。本分发的
    // config/provider/anet-builtin.json 不含任何 individual-coding-plan provider,
    // 用它当 env 会让枚举结果为空,于是这些 Key 在退出后仍然留着。
    const env = await writeFamilyBuiltinConfig(dir);
    const credentialStore = createSharedANetCredentialStore({
      baseDir: dir,
      env,
    });

    try {
      await credentialStore.saveFamilyLoginCredentials(FAMILY_ID, {
        accessToken: "family-access-token",
        jwtToken: "jwt-token",
        user: {
          user_id: "u_1",
        },
      });
      const accountProviderCredentialKey = standaloneAccountProviderCredentialKey({
        providerId: FAMILY_PROVIDER_ID,
        accountIdentity: "u_1",
      });
      await credentialStore.saveMany({
        [standaloneAccountIdentityCredentialKey(FAMILY_PROVIDER_ID)]: "u_1",
        [standaloneAccountAuthSourceCredentialKey(FAMILY_PROVIDER_ID)]: "manual",
        [accountProviderCredentialKey]: "coding-plan-key",
      });

      const result = await logoutANetCli({ credentialStore, env });

      expect(result.credentialsPath).toBe(credentialStore.filePath);
      expect(await credentialStore.load(FAMILY_ACCESS_TOKEN_KEY)).toBeNull();
      expect(await credentialStore.load(SHARED_ANET_CREDENTIAL_KEYS.activeProvider)).toBeNull();
      expect(
        await credentialStore.load(standaloneAccountIdentityCredentialKey(FAMILY_PROVIDER_ID)),
      ).toBeNull();
      expect(await credentialStore.load(accountProviderCredentialKey)).toBeNull();
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  });

  it.each(["oauth", undefined])("退出不解密来源为 %s 的历史旧 Key", async (source) => {
    const dir = await mkdtemp(join(tmpdir(), "anet-logout-legacy-"));
    // 同上:清理范围来自内置 provider 配置文件,必须用夹具配置而不是本分发的真实配置。
    const env = await writeFamilyBuiltinConfig(dir);
    const credentialStore = createSharedANetCredentialStore({ baseDir: dir, env });
    const providerId = FAMILY_PROVIDER_ID;
    const legacyKey = standaloneAccountProviderCredentialKey({
      providerId,
      accountIdentity: "user",
    });
    try {
      await credentialStore.saveMany({
        [FAMILY_ACCESS_TOKEN_KEY]: "valid-oauth",
        [standaloneAccountIdentityCredentialKey(providerId)]: "user",
        ...(source ? { [standaloneAccountAuthSourceCredentialKey(providerId)]: source } : {}),
      });
      const raw = JSON.parse(await readFile(credentialStore.filePath, "utf8"));
      raw[legacyKey] = "enc:v1:broken-legacy-key";
      await writeFile(credentialStore.filePath, JSON.stringify(raw));
      await expect(logoutANetCli({ credentialStore, env })).resolves.toMatchObject({
        credentialsPath: credentialStore.filePath,
      });
      expect(await credentialStore.load(FAMILY_ACCESS_TOKEN_KEY)).toBeNull();
      expect(
        await credentialStore.load(standaloneAccountIdentityCredentialKey(providerId)),
      ).toBeNull();
      expect(JSON.parse(await readFile(credentialStore.filePath, "utf8"))[legacyKey]).toBe(
        raw[legacyKey],
      );
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  });

  it("manual Coding Plan API Key uses the same Account Access and Selection facts", async () => {
    const dir = await mkdtemp(join(tmpdir(), "anet-api-key-login-"));
    const credentialStore = createSharedANetCredentialStore({
      baseDir: join(dir, "home"),
      env: TEST_ENV,
    });
    const personalProviderConfigPath = join(dir, "provider_config.json");
    const anetBuiltinProviderConfigPath = join(dir, "anet-builtin.json");
    const configuredProviderId = "configured-family-a-individual";
    await writeFile(
      anetBuiltinProviderConfigPath,
      JSON.stringify({
        schemaVersion: 1,
        revision: 1,
        config: {
          providerConfigRules: {
            templateRules: [],
            providerRules: [
              {
                providerId: configuredProviderId,
                config: {
                  group: "family-a-family",
                  builtinModelIds: ["model-from-config"],
                  access: {
                    type: "provider-account",
                    accountType: FAMILY_ID,
                    mode: "individual-coding-plan",
                  },
                },
              },
            ],
          },
          modelConfigRules: {
            modelRules: [],
            modelApiRules: [],
            providerSiteRules: [],
            templateModelRules: [],
            builtinProviderModelRules: [],
          },
        },
      }),
    );

    try {
      const result = await configureCodingPlanApiKey({
        apiKey: "manual-key",
        credentialStore,
        env: {
          ...TEST_ENV,
          ANET_BUILTIN_PROVIDER_CONFIG_FILE: anetBuiltinProviderConfigPath,
        },
        personalProviderConfigPath,
        providerId: FAMILY_ID,
      });

      expect(result).toEqual({
        configPath: personalProviderConfigPath,
        model: `${configuredProviderId}/model-from-config`,
        providerId: FAMILY_ID,
      });
      await expect(
        hasConfiguredStandaloneCodingPlan({
          credentialStore,
          env: {
            ...TEST_ENV,
            ANET_BUILTIN_PROVIDER_CONFIG_FILE: anetBuiltinProviderConfigPath,
          },
        }),
      ).resolves.toBe(true);
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  });

  it("reports failed and expired OAuth flows as retryable login errors", async () => {
    const failedClient = new FakeHttpClient([
      jsonResponse({
        code: 0,
        msg: "",
        data: {
          flow_id: "flow-failed",
          poll_token: "poll-token",
          authorize_url: `${AUTHORIZE_URL}?state=failed`,
          expires_at: 9999999999,
          poll_interval_sec: 2,
        },
      }),
      jsonResponse({
        code: 0,
        msg: "",
        data: {
          status: "failed",
        },
      }),
    ]);

    await expect(
      loginANetCli({
        env: { ...TEST_ENV, ANET_BASE_URL: FAMILY_ORIGIN },
        httpClient: failedClient,
        noBrowser: true,
        now: () => 1_000,
        pollToken: "poll-token",
        providerId: FAMILY_ID,
        sleep: async () => undefined,
      }),
    ).rejects.toMatchObject({
      code: "auth_failed",
    });

    const expiredClient = new FakeHttpClient([
      jsonResponse({
        code: 0,
        msg: "",
        data: {
          flow_id: "flow-expired",
          poll_token: "poll-token",
          authorize_url: `${AUTHORIZE_URL}?state=expired`,
          expires_at: 1,
          poll_interval_sec: 2,
        },
      }),
    ]);

    await expect(
      loginANetCli({
        env: { ...TEST_ENV, ANET_BASE_URL: FAMILY_ORIGIN },
        httpClient: expiredClient,
        noBrowser: true,
        now: () => 2_000,
        pollToken: "poll-token",
        providerId: FAMILY_ID,
        sleep: async () => undefined,
      }),
    ).rejects.toMatchObject({
      code: "auth_timeout",
    });
  });

  it("aborts an OAuth login while waiting for authorization", async () => {
    const abortController = new AbortController();
    let sleepStarted: (() => void) | undefined;
    const sleepPromise = new Promise<void>((resolve) => {
      sleepStarted = resolve;
    });
    const httpClient = new FakeHttpClient([
      jsonResponse({
        code: 0,
        msg: "",
        data: {
          flow_id: "flow-abort",
          poll_token: "poll-token",
          authorize_url: `${AUTHORIZE_URL}?state=abort`,
          expires_at: 9999999999,
          poll_interval_sec: 2,
        },
      }),
      jsonResponse({
        code: 0,
        msg: "",
        data: {
          status: "pending",
        },
      }),
    ]);

    const loginPromise = loginANetCli({
      abortSignal: abortController.signal,
      env: { ...TEST_ENV, ANET_BASE_URL: FAMILY_ORIGIN },
      httpClient,
      noBrowser: true,
      now: () => 1_000,
      pollToken: "poll-token",
      providerId: FAMILY_ID,
      sleep: async () => {
        sleepStarted?.();
        await new Promise<void>(() => undefined);
      },
    });

    await sleepPromise;
    abortController.abort(new Error("login cancelled"));

    await expect(loginPromise).rejects.toThrow("login cancelled");
    expect(httpClient.requests).toHaveLength(2);
  });
});

class FakeHttpClient implements HttpClientPort {
  readonly requests: HttpClientRequest[] = [];

  constructor(private readonly responses: HttpClientResponse[]) {}

  async request(request: HttpClientRequest): Promise<HttpClientResponse> {
    this.requests.push(request);
    const response = this.responses.shift();
    if (!response) {
      throw new Error("No fake response configured");
    }
    return response;
  }
}

function jsonResponse(body: unknown): HttpClientResponse {
  const encoded = new TextEncoder().encode(JSON.stringify(body));
  return {
    body: encoded,
    bytes: encoded.byteLength,
    durationMs: 1,
    headers: {
      "content-type": "application/json",
    },
    status: 200,
    statusText: "OK",
    url: "https://anet.example/api/v1",
  };
}
