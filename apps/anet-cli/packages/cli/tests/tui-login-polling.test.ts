import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { HttpClientPort, HttpClientResponse, SessionEvent } from "@anet/contracts";
import {
  createCliOAuthClient,
  createSharedANetCredentialStore,
  resolveFamilyOAuthCredentialKeys,
  SHARED_ANET_CREDENTIAL_KEYS as keys,
} from "@anet/adapters/auth";
import { registerModelProviderFamilySpecs } from "@anet/shared";
import { NodePersonalProviderConfigRepository } from "@anet/provider-node";
import { loginANetCli, type LoginANetCliOptions } from "../../bootstrap/src/auth-login.js";
import { startProcessProviderRegistryRuntime } from "../../bootstrap/src/app/process-provider-registry-runtime.js";
import { listRegistryBackedModels } from "../../bootstrap/src/app/provider-registry-selection.js";
import {
  resolveStandaloneCodingPlanProvider,
  standaloneAccountAuthSourceCredentialKey,
  standaloneAccountIdentityCredentialKey,
  standaloneAccountProviderCredentialKey,
} from "../../bootstrap/src/app/standalone-account-provider-runtime.js";
import { createTuiSubmitPrompt } from "../src/tui-prompt-handler.js";
import { createCliModeState } from "../src/tui-command-state.js";
import type { CommandCenterApp } from "../src/command-center.js";
import type { RunDependencies } from "../src/cli-types.js";
import type { TuiOptions } from "../../tui/src/types.js";
import { runLoginCommand } from "../src/login-command.js";

const FAMILY_ID = "family-a";
const FAMILY_PROVIDER_ID = "account:family-a-coding-plan";

// 家族注册表在本分发中为空。登录链路按注册表工作,所以这里注册一个夹具家族;
// 这是测试进程内的修改,不影响其他进程。
//
// 必须走 registerModelProviderFamilySpecs(),不能直接往 MODEL_PROVIDER_FAMILY_SPECS
// 里 push:注册表的派生表(按 id 查家族、按 provider 反查家族、各套餐 provider id 集合)
// 只在注册函数里重建,直接改数组内容不会通知它们,于是 Registry 仍按空表装配,
// 登录成功后按 providerId 取 Provider 依然是 undefined。
registerModelProviderFamilySpecs([
  {
    id: FAMILY_ID,
    label: "Family A",
    rootDomain: "family-a.example",
    oauthProviderId: FAMILY_ID,
    startPlanProviderId: "account:family-a-start-plan",
    individualCodingPlanProviderId: FAMILY_PROVIDER_ID,
    teamCodingPlanProviderId: "account:family-a-team-coding-plan",
    teamCodingPlanManageUrl: "",
  },
]);

const authorizeUrl = "https://login.example.test/authorize?state=test-state";
const pollToken = "test-private-poll-token";
const ready = (providerId: string) => ({
  status: "ready",
  token: "test-backend-jwt",
  user: { user_id: "test-account", name: "Test User" },
  [providerId]: { accessToken: "test-oauth-token", refreshToken: "test-refresh-token" },
});
const TEST_PROJECT_MATERIAL = {
  token: "test-project-token",
  apiKeyId: "test-api-key-id",
  organizationId: "test-org",
  projectId: "test-project",
};
function response(data: unknown, status = 200): HttpClientResponse {
  const body = new TextEncoder().encode(JSON.stringify({ code: 0, data }));
  return {
    url: "https://example.test",
    status,
    statusText: "test",
    headers: {},
    body,
    bytes: body.length,
    durationMs: 0,
  };
}
async function fixture(t: TestContext, providerId: string = FAMILY_ID) {
  const dir = await mkdtemp(join(tmpdir(), "anet-login-test-"));
  // node:test 的 after 钩子按注册顺序执行。fixture 比用例先注册,所以若在这里直接删目录,
  // 它会排在用例自己注册的 runtime.dispose() 之前 —— 还活着的 Registry Runtime 会一边被删
  // 一边往目录里写配置,rm 报 ENOTEMPTY。让删目录排在最后:用例把自己的清理挂进
  // f.disposers,这里先按注册的逆序跑完它们,再删目录。
  const disposers: (() => void | Promise<void>)[] = [];
  t.after(async () => {
    for (const dispose of disposers.splice(0).reverse()) await dispose();
    await rm(dir, { recursive: true, force: true });
  });
  const personalFile = join(dir, "provider_config.json");
  const personal = new NodePersonalProviderConfigRepository({
    filePath: personalFile,
    pollingIntervalMs: false,
  });
  await personal.update((current) => current);
  personal.dispose();
  const builtinFile = join(dir, "anet-builtin.json");
  await writeFile(
    builtinFile,
    JSON.stringify({
      schemaVersion: 1,
      revision: 1,
      config: {
        providerConfigRules: {
          templateRules: [],
          providerRules: [
            {
              providerId: FAMILY_PROVIDER_ID,
              config: {
                group: "family-a-family",
                builtinModelIds: ["Model-A"],
                access: {
                  type: "provider-account",
                  accountType: FAMILY_ID,
                  mode: "individual-coding-plan",
                },
                // Resolver 要求 Account Provider 的 api 完整(type + baseUrl),否则这条
                // provider 会带着 required-field-missing 被丢掉,Registry 里查不到它。
                api: { type: "anthropic-messages", baseUrl: "https://api.family-a.invalid" },
              },
            },
          ],
        },
        modelConfigRules: {
          // 模型也要有完整的 properties/optionSpecs:缺一项同样会让 provider 落不进
          // Registry。这里给一条通配规则,内容与随包目录里的通配规则同形。
          modelRules: [
            {
              modelMatch: ".*",
              config: {
                enabled: true,
                properties: {
                  contextWindow: 200000,
                  inputFormat: {
                    supportsText: true,
                    supportsImage: false,
                    supportsVideo: false,
                    supportsAudio: false,
                    supportsPdf: false,
                  },
                  outputFormat: { supportsText: true },
                  supportsToolCall: true,
                  supportsJsonSchemaOutput: false,
                  supportsNativeWebSearch: false,
                  supportsMidConversationSystem: false,
                  requiresMfjsToolSchema: false,
                },
                optionSpecs: {
                  maxOutputTokens: { max: 64000, map: "{'max_tokens': maxOutputTokens}" },
                  reasoningLevel: { values: ["none", "low", "medium", "high"], map: "{}" },
                },
              },
            },
          ],
          modelApiRules: [],
          providerSiteRules: [],
          templateModelRules: [],
          builtinProviderModelRules: [],
        },
      },
    }),
  );
  const env = {
    ANET_DATA_BASE_DIR: dir,
    ANET_CREDENTIAL_SECRET: "test-encryption-key",
    ANET_BASE_URL: "https://anet.vendor-a.example",
    ANET_BUILTIN_PROVIDER_CONFIG_FILE: builtinFile,
    ANET_PERSONAL_PROVIDER_CONFIG_FILE: personalFile,
  };
  const store = createSharedANetCredentialStore({ env });
  let now = 1_000_000;
  const sleeps: number[] = [];
  const requests: Parameters<HttpClientPort["request"]>[0][] = [];
  const f = {
    disposers,
    env,
    store,
    sleeps,
    requests,
    advance: (ms: number) => {
      now += ms;
    },
    poll: async (_signal?: AbortSignal): Promise<HttpClientResponse> => response(ready(providerId)),
    options: {} as LoginANetCliOptions,
  };
  const httpClient: HttpClientPort = {
    async request(request, options) {
      requests.push(request);
      assert.equal(request.headers?.Authorization, `Bearer ${pollToken}`);
      assert.ok(options?.signal);
      if (request.method === "POST") {
        assert.deepEqual(JSON.parse(new TextDecoder().decode(request.body)), {
          provider: providerId,
        });
        return response({
          flow_id: "flow/with space",
          authorize_url: authorizeUrl,
          expires_at: now / 1000 + 120,
          poll_interval_sec: 1,
        });
      }
      assert.match(request.url, /\/oauth\/cli\/poll\/flow%2Fwith%20space$/);
      return f.poll(options?.signal);
    },
  };
  f.options = {
    env,
    credentialStore: store,
    providerId,
    httpClient,
    noBrowser: true,
    pollToken,
    now: () => now,
    sleep: async (ms) => {
      sleeps.push(ms);
      now += ms;
    },
    // OAuth 登录只解析项目访问材料，不再落盘派生 API Key（staging 9af2a442d3 改为请求期换取 Token）。
    apiKeyResolver: {
      async resolveMaterial(input, options) {
        assert.equal(input.family, providerId);
        assert.equal(input.accessToken, "test-oauth-token");
        assert.ok(options?.signal);
        return TEST_PROJECT_MATERIAL;
      },
    } as unknown as LoginANetCliOptions["apiKeyResolver"],
  };
  return f;
}

for (const providerId of [FAMILY_ID]) {
  test(`${providerId} browser polling persists credentials and refreshes the running Registry`, async (t) => {
    const f = await fixture(t, providerId);
    const runtime = await startProcessProviderRegistryRuntime(f.env, {
      standalone: { credentialStore: f.store },
    });
    f.disposers.push(() => runtime.dispose());
    const configured = await resolveStandaloneCodingPlanProvider(providerId, f.env);
    assert.equal(runtime.runtime.registryService.getProvider(configured.providerId), undefined);
    let attempts = 0;
    f.poll = async () => {
      attempts++;
      if (attempts === 1) return response({ status: "pending" });
      if (attempts === 2) throw new TypeError("test temporary network error");
      if (attempts === 3)
        return { ...response(null, 503), body: new TextEncoder().encode("unavailable") };
      if (attempts === 4) return response(null, 429);
      return response(ready(providerId));
    };
    const result = await loginANetCli(f.options);
    assert.equal(result.providerId, providerId);
    assert.equal(result.user.user_id, "test-account");
    assert.equal(attempts, 5);
    assert.deepEqual(f.sleeps, [1000, 1000, 1000, 1000]);
    assert.equal(await f.store.load(keys.anetJwtToken), "test-backend-jwt");
    // 连接身份取账号用户 ID。
    const expectedIdentity = "test-account";
    assert.equal(
      await f.store.load(standaloneAccountIdentityCredentialKey(configured.providerId)),
      expectedIdentity,
    );
    assert.equal(
      await f.store.load(standaloneAccountAuthSourceCredentialKey(configured.providerId)),
      "oauth",
    );
    assert.equal(
      await f.store.load(
        standaloneAccountProviderCredentialKey({
          providerId: configured.providerId,
          accountIdentity: expectedIdentity,
        }),
      ),
      null,
    );
    assert.ok(runtime.runtime.registryService.getProvider(configured.providerId));
    assert.deepEqual(await runtime.modelSelectionConfigRepository.read(), {
      providerId: configured.providerId,
      modelId: configured.modelId,
    });
    assert.equal(
      await f.store.load(resolveFamilyOAuthCredentialKeys(providerId)!.refreshToken),
      "test-refresh-token",
    );
  });
}

test("OAuth init does not require an echoed poll secret and accepts both token spellings", async () => {
  for (const token of [
    { access_token: "token", refresh_token: "refresh" },
    { accessToken: "token", refreshToken: "refresh" },
  ]) {
    const client = createCliOAuthClient({
      providerId: FAMILY_ID,
      httpClient: {
        async request(request) {
          return request.method === "POST"
            ? response({
                flow_id: "flow",
                authorize_url: authorizeUrl,
                expires_at: 12345,
                poll_interval_sec: 1,
              })
            : response({ ...ready(FAMILY_ID), [FAMILY_ID]: token });
        },
      },
    });
    assert.equal(Object.hasOwn(await client.init({ pollToken }), "poll_token"), false);
    const result = await client.poll({ flowId: "flow", pollToken });
    assert.equal(result.status, "ready");
    if (result.status === "ready") assert.equal(result.refreshToken, "refresh");
  }
});

for (const failure of ["failed", "unauthorized", "malformed"] as const) {
  test(`terminal polling failure ${failure} does not write credentials or retry`, async (t) => {
    const f = await fixture(t);
    f.poll = async () =>
      failure === "unauthorized"
        ? response(null, 401)
        : response(
            failure === "failed" ? { status: "failed" } : { ...ready(FAMILY_ID), [FAMILY_ID]: {} },
          );
    await assert.rejects(loginANetCli(f.options));
    assert.equal(await f.store.load(keys.activeProvider), null);
    assert.equal(f.sleeps.length, 0);
  });
}

test("cancelling in-flight polling ignores a late ready response", { timeout: 2000 }, async (t) => {
  const f = await fixture(t);
  const controller = new AbortController();
  let finish!: (data: HttpClientResponse) => void;
  let started!: () => void;
  const polling = new Promise<void>((resolve) => {
    started = resolve;
  });
  let requestSignal: AbortSignal | undefined;
  f.poll = (signal) => {
    requestSignal = signal;
    started();
    return new Promise((resolve) => {
      finish = resolve;
    });
  };
  const login = loginANetCli({ ...f.options, abortSignal: controller.signal });
  await polling;
  controller.abort(new Error("test login cancelled"));
  await assert.rejects(login, /test login cancelled/);
  assert.equal(requestSignal?.aborted, true);
  finish(response(ready(FAMILY_ID)));
  await Promise.resolve();
  assert.equal(await f.store.load(keys.activeProvider), null);
});

test("login timeout interrupts an unresponsive transport", { timeout: 2000 }, async (t) => {
  const f = await fixture(t);
  f.poll = () => new Promise(() => {});
  await assert.rejects(loginANetCli({ ...f.options, timeoutMs: 30 }), {
    code: "auth_timeout",
  });
  assert.equal(await f.store.load(keys.activeProvider), null);
});

test("a response received after flow expiry is not persisted", async (t) => {
  const f = await fixture(t);
  f.poll = async () => {
    f.advance(121_000);
    return response(ready(FAMILY_ID));
  };
  await assert.rejects(loginANetCli(f.options), { code: "auth_timeout" });
  assert.equal(await f.store.load(keys.activeProvider), null);
});

test("cancellation during API key resolution does not save the login", async (t) => {
  const f = await fixture(t);
  const controller = new AbortController();
  await assert.rejects(
    loginANetCli({
      ...f.options,
      abortSignal: controller.signal,
      apiKeyResolver: {
        async resolveMaterial() {
          controller.abort(new Error("cancel before save"));
          return TEST_PROJECT_MATERIAL;
        },
      } as unknown as LoginANetCliOptions["apiKeyResolver"],
    }),
    /cancel before save/,
  );
  assert.equal(await f.store.load(keys.activeProvider), null);
});

test("browser failure keeps authorization URL available and polling completes", async (t) => {
  const f = await fixture(t);
  let shown = "";
  const result = await loginANetCli({
    ...f.options,
    noBrowser: false,
    onAuthorizeUrl: (data) => {
      shown = data.authorize_url;
    },
    openBrowser: async () => ({
      command: "test-open",
      opened: false,
      reason: "test headless host",
    }),
  });
  assert.equal(shown, authorizeUrl);
  assert.equal(result.browser?.opened, false);
});

test(
  "TUI renders the login URL in the current session and refreshes models after authorization",
  // 墙钟预算这里不承载任何断言:轮询的等待由测试自己 resolve,sleep 也是注入的。时间全花在
  // 动态 import 整套 TUI(opentui core/react + tui/src/app)上。5 秒只够机器空闲时跑完 ——
  // 满载并行跑整个 apps/anet-cli 时它会超时,而 node:test 超时是半途放弃用例再跑 after 钩子,
  // 此时 Runtime 与 TUI 还在往临时目录里写,删目录于是报 ENOTEMPTY(这就是那条
  // ENOTEMPTY 的来源,不是清理顺序本身)。放宽到 120 秒,只防真正卡死。
  { timeout: 120_000 },
  async (t) => {
    const f = await fixture(t);
    const runtime = await startProcessProviderRegistryRuntime(f.env, {
      standalone: { credentialStore: f.store },
    });
    // 这个 Runtime 持有长生命周期句柄。不注销它,本用例失败时整个测试进程不会退出,
    // node:test 只打印 "Promise resolution is still pending",turbo run test 永不返回。
    f.disposers.push(() => runtime.dispose());
    let authorize!: () => void;
    const authorization = new Promise<void>((resolve) => {
      authorize = resolve;
    });
    let urlShown!: () => void;
    const authorizationShown = new Promise<void>((resolve) => {
      urlShown = resolve;
    });
    f.poll = async () => {
      await authorization;
      return response(ready(FAMILY_ID));
    };
    const app = {
      sessionId: "login-session",
      traceId: "login-trace",
      getModel: () => "",
      getLocale: () => "en-US",
      listModels: () => listRegistryBackedModels(runtime.runtime.registryService),
      listThoughtLevels: () => [],
    } as unknown as CommandCenterApp;
    const handler = createTuiSubmitPrompt(
      {
        env: f.env,
        cwd: () => process.cwd(),
        skipUserConfig: true,
        loadDotenv: () => ({ keys: [], loaded: false, path: "" }),
        createANetApp: async () => app,
        startProcessProviderRegistryRuntime: async () => runtime,
        loginANetCli: (options: LoginANetCliOptions) =>
          loginANetCli({
            ...f.options,
            ...options,
            onAuthorizeUrl: async (data) => {
              await options?.onAuthorizeUrl?.(data);
              urlShown();
            },
          }),
      } as unknown as RunDependencies,
      createCliModeState(),
      "test",
    );
    f.disposers.push(() => handler.close?.());
    const React = await import("react");
    const { createTestRenderer } = await import("@mbears/opentui-core/testing");
    const { createRoot } = await import("@mbears/opentui-react");
    const { CodeRenderable } = await import("@mbears/opentui-core");
    const { TuiApp } = await import("../../tui/src/app.js");
    const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const previous = environment.IS_REACT_ACT_ENVIRONMENT;
    environment.IS_REACT_ACT_ENVIRONMENT = true;
    const terminal = await createTestRenderer({
      width: 120,
      height: 45,
      screenMode: "alternate-screen",
      useThread: false,
    });
    const root = createRoot(terminal.renderer);
    let loginCompletion: ReturnType<typeof handler> | undefined;
    const seenEvents: SessionEvent[] = [];
    const options: TuiOptions = {
      noColor: true,
      stdin: process.stdin,
      stdout: process.stdout,
      stderr: process.stderr,
      getMainSessionId: () => app.sessionId,
      locale: "en-US",
      submitPrompt: (input, options) => {
        loginCompletion = handler(input, {
          ...options,
          onEvent: async (event) => {
            seenEvents.push(event);
            await options.onEvent?.(event);
          },
        });
        return loginCompletion;
      },
      ...(await handler.getSessionMetadata!()),
      listModelOptions: handler.listModelOptions,
    };
    const action = async (run: () => void | Promise<void>) => {
      await React.act(async () => {
        await run();
      });
      const waitForHighlights = async (node: typeof terminal.renderer.root): Promise<void> => {
        if (node instanceof CodeRenderable) await node.highlightingDone;
        await Promise.all(
          node.getChildren().map((child) => waitForHighlights(child as typeof node)),
        );
      };
      await React.act(async () => {
        await terminal.renderOnce();
        await waitForHighlights(terminal.renderer.root);
        await terminal.renderOnce();
      });
    };
    try {
      await action(() =>
        root.render(
          React.createElement(TuiApp, {
            options,
            onExit() {},
            hasCopyableSelection: () => false,
            copySelection: async () => ({ kind: "empty" as const }),
          }),
        ),
      );
      await action(() => terminal.mockInput.typeText("/login family-a-coding-plan"));
      await action(async () => {
        terminal.mockInput.pressEnter();
        await authorizationShown;
      });
      assert.equal(seenEvents.length, 1);
      assert.equal(seenEvents[0]!.sessionId, app.sessionId);
      assert.match(terminal.captureCharFrame(), /login\.example\.test\/authorize/);
      assert.doesNotMatch(terminal.captureCharFrame(), /test-private-poll-token/);
      // Waiting for the actual command completion also waits for credential and Registry barriers.
      await action(async () => {
        authorize();
        await loginCompletion;
      });
      assert.ok(runtime.runtime.registryService.getProvider(FAMILY_PROVIDER_ID));
    } finally {
      await action(async () => {
        authorize();
        await loginCompletion;
      });
      await React.act(() => root.unmount());
      terminal.renderer.destroy();
      if (previous === undefined) delete environment.IS_REACT_ACT_ENVIRONMENT;
      else environment.IS_REACT_ACT_ENVIRONMENT = previous;
    }
  },
);

test("standalone login accepts provider selection and keeps authorization URL out of JSON stdout", async () => {
  let stdout = "";
  let stderr = "";
  let selected = "";
  const deps = {
    env: {},
    cwd: () => process.cwd(),
    loadDotenv: () => ({ keys: [], loaded: false, path: "" }),
    loginANetCli: async (options: LoginANetCliOptions) => {
      selected = options.providerId!;
      assert.equal(options.noBrowser, true);
      await options.onAuthorizeUrl?.({
        authorize_url: authorizeUrl,
        expires_at: 12345,
        flow_id: "flow",
        poll_interval_sec: 1,
      });
      return {
        providerId: FAMILY_ID,
        user: { user_id: "test-account" },
        model: "provider/model",
        configPath: "test-config",
        credentialsPath: "test-credentials",
      };
    },
  } as unknown as RunDependencies;
  const context = {
    stdout: {
      write: (text: string) => {
        stdout += text;
      },
    },
    stderr: {
      write: (text: string) => {
        stderr += text;
      },
    },
  } as unknown as Parameters<typeof runLoginCommand>[0];
  const options = { json: true } as Parameters<typeof runLoginCommand>[1];
  assert.equal(await runLoginCommand(context, options, deps, true, [FAMILY_ID]), 0);
  assert.equal(selected, FAMILY_ID);
  assert.equal(JSON.parse(stdout).provider, FAMILY_ID);
  assert.match(stderr, /login\.example\.test/);
  assert.doesNotMatch(stdout, /authorize/);
});
