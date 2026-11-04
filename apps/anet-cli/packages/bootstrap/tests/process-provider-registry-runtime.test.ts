import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ProviderConfig,
  ProviderConfigMap,
  ProviderAccountAccessConfig,
  createAccountProviderConfigSnapshot,
} from "@anet/provider";
import { anetProviderUpdateAccountConfigParamsSchema, registerModelProviderFamilySpecs } from "@anet/shared";
import {
  ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV,
  ANET_BUILTIN_RELEASE_SCHEMA_VERSION,
  ANET_BUILTIN_REMOTE_REFRESH_ENV,
  ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV,
  createNodeModelSelectionFacade,
} from "@anet/provider-node";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createSharedANetCredentialStore,
  type SharedANetCredentialStore,
} from "@anet/adapters/auth";
import {
  parseProcessAccountProviderConfigSnapshot,
  startProcessProviderRegistryRuntime,
} from "../src/app/process-provider-registry-runtime.js";
import {
  standaloneAccountAuthSourceCredentialKey,
  standaloneAccountIdentityCredentialKey,
  standaloneAccountProviderCredentialKey,
} from "../src/app/standalone-account-provider-runtime.js";

// 本分发的 provider family 注册表为空;这里注册夹具家族,被测链路按注册表工作。
// 用 registerModelProviderFamilySpecs() 而不是 vi.mock("@anet/shared"):被 mock 的只是
// barrel 的导出,而 @anet/shared 内部的派生表引用的是同模块局部常量,
// model-provider-types.ts 又直接 import "./model-provider-family.js" —— 两者都绕不过
// barrel 上的 mock,mock 之后所有查询函数仍按空表工作。
registerModelProviderFamilySpecs(
  ["family-a", "family-b"].map((id) => ({
    id,
    label: id,
    rootDomain: `${id}.invalid`,
    oauthProviderId: id,
    startPlanProviderId: `account:${id}-start-plan`,
    individualCodingPlanProviderId: `account:${id}-individual-coding-plan`,
    teamCodingPlanProviderId: `account:${id}-team-coding-plan`,
    teamCodingPlanManageUrl: "",
  })),
);


const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("process provider registry runtime", () => {
  it("Standalone 长生命周期下载 URL Release 后跟进 Registry；Managed Worker 不下载", async () => {
    const root = await temporaryDirectory();
    const builtin = JSON.parse(
      await readFile(
        new URL("../../../../../config/provider/anet-builtin.json", import.meta.url),
        "utf8",
      ),
    );
    const bundled = join(root, "bundled.json");
    const active = join(root, "active.json");
    await writeFile(bundled, JSON.stringify(builtin));
    await writeFile(active, JSON.stringify(builtin));
    builtin.revision += 1;
    let releaseDownload!: () => void;
    const wait = new Promise<void>((resolve) => {
      releaseDownload = resolve;
    });
    const request = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(init?.headers).toBeUndefined();
      if (String(url).includes("/api/v1/client/configs?"))
        return new Response(
          JSON.stringify({
            code: 0,
            data: { configs: { builtin_provider_config_json: "https://cdn.example.com/new.json" } },
          }),
        );
      await wait;
      return new Response(JSON.stringify(builtin));
    });
    const credentialStore = createSharedANetCredentialStore({
      env: { ANET_DATA_BASE_DIR: root },
    });
    // 远端刷新在本分发是**显式开关**:内置 provider 目录是产品的一部分,不接受远端
    // 改写,所以 startProcessProviderRegistryRuntime 默认不拉(见 isBuiltinRemoteRefreshEnabled,
    // 默认关闭由 tests/builtinRemoteRefreshGate.test.ts 单独守着)。本用例断言的正是
    // "下载完成后跟进 Registry",所以必须先把这个能力打开,否则 request 一次都不会发。
    const env = {
      [ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV]: active,
      [ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV]: join(root, "personal.json"),
      ANET_BUILTIN_PROVIDER_BUNDLED_CONFIG_FILE: bundled,
      [ANET_BUILTIN_REMOTE_REFRESH_ENV]: "1",
      // 本分发没有缺省 endpoint:resolveRuntimeANetEndpointOrigin() 在未配置时返回空串,
      // synchronizer 拿到空 endpointKey 直接抛错,一次请求都不发。本用例测的是下载链路
      // 本身,所以显式给一个 endpoint。
      ANET_BASE_URL: "https://endpoint.example.test",
    };
    const runtime = await startProcessProviderRegistryRuntime(env, {
      standalone: {
        credentialStore,
        request,
        legacyCliUserConfigFilePath: join(root, "absent.json"),
      },
    });
    const old = runtime.runtime.registryService.getSnapshot()!;
    try {
      await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
      expect(runtime.runtime.registryService.getSnapshot()).toBe(old);
      releaseDownload();
      await vi.waitFor(() =>
        expect(runtime.runtime.registryService.getSnapshot()!.config.anetBuiltinRevision).toMatch(
          `anet-builtin:${builtin.revision}:`,
        ),
      );
      const next = runtime.runtime.registryService.getSnapshot()!;
      expect(next.account.basedOnANetBuiltinRevision).toBe(next.config.anetBuiltinRevision);
      expect(JSON.parse(await readFile(active, "utf8")).revision).toBe(builtin.revision);
      expect(JSON.parse(await readFile(bundled, "utf8")).revision).toBe(builtin.revision - 1);
      const worker = await startProcessProviderRegistryRuntime(env);
      try {
        expect(worker.snapshot.config.anetBuiltinRevision).toBe(next.config.anetBuiltinRevision);
        expect(request).toHaveBeenCalledTimes(2);
      } finally {
        worker.dispose();
      }
    } finally {
      releaseDownload();
      runtime.dispose();
    }
  });
  it("Standalone 无凭据时 Built-in 文件更新仍重新解析 Account 并整体发布 Registry", async () => {
    const root = await temporaryDirectory();
    const builtin = JSON.parse(
      await readFile(
        new URL("../../../../../config/provider/anet-builtin.json", import.meta.url),
        "utf8",
      ),
    );
    const filePath = join(root, "builtin.json");
    await writeFile(filePath, JSON.stringify(builtin));
    const credentialStore = createSharedANetCredentialStore({
      env: { ANET_DATA_BASE_DIR: root },
    });
    const runtime = await startProcessProviderRegistryRuntime(
      {
        [ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV]: filePath,
        [ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV]: join(root, "personal.json"),
      },
      { standalone: { credentialStore, legacyCliUserConfigFilePath: join(root, "absent.json") } },
    );
    try {
      builtin.revision += 1;
      await writeFile(filePath, JSON.stringify(builtin));
      await vi.waitFor(() => {
        const next = runtime.runtime.registryService.getSnapshot()!;
        expect(next.config.anetBuiltinRevision).toMatch(`anet-builtin:${builtin.revision}:`);
        expect(next.account.basedOnANetBuiltinRevision).toBe(next.config.anetBuiltinRevision);
      });
      expect(
        runtime.runtime.registryService.getProvider("account:family-a-individual-coding-plan"),
      ).toBeUndefined();
    } finally {
      runtime.dispose();
    }
  });
  it("真实 Built-in 下完整状态跨协议往返；仅切 current 即更新 Worker 的有效选择", async () => {
    const root = await temporaryDirectory();
    const personal = "account:family-a-individual-coding-plan";
    const team = "account:family-a-team-coding-plan";
    // 随包目录 config/provider/anet-builtin.json 的 providerRules 是空的 —— 本分发不自带
    // 任何厂商 Coding Plan 条目,Registry 只会装配 providerRules 里声明过的 provider。
    // 用例要验的是"按 current 切换有效 provider",与目录里具体有谁无关,所以这里写一份
    // 只含两个夹具 provider 的 Built-in。
    const runtime = await startProcessProviderRegistryRuntime({
      [ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV]: fileURLToPath(
        new URL("./fixtures/anet-builtin-family.json", import.meta.url),
      ),
      [ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV]: join(root, "personal.json"),
    });
    const original = Object.freeze({
      providerId: personal,
      modelId: "Model-A",
      options: Object.freeze({ reasoningLevel: "high" }),
    });
    const facade = createNodeModelSelectionFacade(runtime.runtime.registryService);
    const providers = new ProviderConfigMap(
      [personal, team].map((id) => [
        id,
        new ProviderConfig({ access: new ProviderAccountAccessConfig({ entitled: true }) }),
      ]),
    );
    const revisions = new Set<string>();
    try {
      for (const current of [personal, team, personal]) {
        const snapshot = createAccountProviderConfigSnapshot(
          runtime.snapshot.config.anetBuiltinRevision,
          providers,
          {
            [personal]: {
              availability: "available",
              entitled: true,
              current: current === personal,
            },
            [team]: { availability: "available", entitled: true, current: current === team },
          },
        );
        revisions.add(snapshot.revision);
        const wire = anetProviderUpdateAccountConfigParamsSchema.parse(
          JSON.parse(
            JSON.stringify({
              ...snapshot,
              providers: Object.fromEntries(
                [...snapshot.providers.entries()].map(([id, config]) => [id, config.toJSON()]),
              ),
            }),
          ),
        );
        await runtime.syncAccountProviderConfig(parseProcessAccountProviderConfigSnapshot(wire));
        expect(runtime.runtime.registryService.getProvider(current)).toBeDefined();
        expect(
          runtime.runtime.registryService.getProvider(current === personal ? team : personal),
        ).toBeUndefined();
        expect(
          facade.getView(undefined, undefined, { selection: original }).effectiveSelection,
        ).toEqual({ ...original, providerId: current });
        expect(original.providerId).toBe(personal);
      }
      expect(revisions.size).toBe(2);
    } finally {
      runtime.dispose();
    }
  });

  it("解析独立同步的 Account Provider Config", () => {
    const states = {
      account: { availability: "available", entitled: true, current: false },
    } as const;
    const parsed = parseProcessAccountProviderConfigSnapshot({
      revision: "account-1",
      basedOnANetBuiltinRevision: "anet-builtin:1",
      states,
      providers: {
        account: {
          access: { type: "provider-account", entitled: true },
          builtinModelIds: ["model-a"],
        },
      },
    });

    expect(
      Object.fromEntries(
        [...parsed.providers.entries()].map(([id, config]) => [id, config.toJSON()]),
      ),
    ).toEqual({
      account: {
        access: { type: "provider-account", entitled: true },
        builtinModelIds: ["model-a"],
      },
    });
    expect(parsed.basedOnANetBuiltinRevision).toBe("anet-builtin:1");
    expect(parsed.states).toEqual(states);
  });

  it("独立 Account Config 同步拒绝 API Provider", () => {
    expect(() =>
      parseProcessAccountProviderConfigSnapshot({
        revision: "account-invalid",
        basedOnANetBuiltinRevision: "anet-builtin:1",
        providers: {
          api: {
            access: {
              type: "api-key",
              apiKey: "must-not-enter-account-source",
            },
          },
        },
      }),
    ).toThrow();
  });

  it("独立 Account Config 只接受 entitlement 与账号特定模型成员", () => {
    expect(() =>
      parseProcessAccountProviderConfigSnapshot({
        revision: "account-invalid-static-field",
        basedOnANetBuiltinRevision: "anet-builtin:1",
        providers: {
          account: {
            access: { type: "provider-account", entitled: true },
            label: "不得由 Account Source 覆盖",
          },
        },
      }),
    ).toThrow();
  });

  it("未注入 Provider Config 路径时拒绝启动", async () => {
    await expect(startProcessProviderRegistryRuntime({})).rejects.toThrow(
      "缺少进程 Provider Registry",
    );
  });

  it("Personal 文件损坏时保留原文件并以内存空配置启动", async () => {
    const root = await temporaryDirectory();
    const anetBuiltinFilePath = join(root, "anet-builtin.json");
    const personalFilePath = join(root, "personal.json");
    await writeFile(
      anetBuiltinFilePath,
      JSON.stringify(anetBuiltinRelease({ providers: {}, templates: {}, models: [] })),
    );
    await writeFile(personalFilePath, "{not-json");
    const started = await startProcessProviderRegistryRuntime({
      [ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV]: anetBuiltinFilePath,
      [ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV]: personalFilePath,
    });
    try {
      expect(started.configuredDefaultModelSelection).toBeUndefined();
      expect(await readFile(personalFilePath, "utf8")).toBe("{not-json");
      await expect(
        started.modelSelectionConfigRepository.saveConfiguredDefault(undefined),
      ).rejects.toThrow();
    } finally {
      started.dispose();
    }
    await expect(started.modelSelectionConfigRepository.read()).rejects.toThrow("已 dispose");
    await expect(started.runtime.start()).rejects.toThrow("已 dispose");
  });

  it("从进程环境启动一份 Registry，并由调用方持有生命周期", async () => {
    const root = await temporaryDirectory();
    const anetBuiltinFilePath = join(root, "anet-builtin.json");
    const personalFilePath = join(root, "personal.json");
    await writeFile(
      anetBuiltinFilePath,
      JSON.stringify(
        anetBuiltinRelease({
          providers: {
            account: {
              group: "family-b-family",
              access: {
                type: "provider-account",
                accountType: "family-b",
                mode: "individual-coding-plan",
              },
              api: {
                type: "anthropic-messages",
                baseUrl: "https://account.example.com",
              },
              builtinModelIds: ["model-a"],
            },
          },
          templates: {
            "anet-template": {
              access: { type: "api-key" },
              api: {
                type: "anthropic-messages",
                baseUrl: "https://api.example.com",
              },
              builtinModelIds: ["model-a"],
            },
          },
          models: [
            {
              modelMatch: "model-a",
              config: {
                enabled: true,

                properties: {
                  requiresMfjsToolSchema: false,
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
                  supportsJsonSchemaOutput: true,
                  supportsNativeWebSearch: false,
                  supportsMidConversationSystem: false,
                },
                optionSpecs: {
                  reasoningLevel: { values: ["disabled"], map: "{}" },
                  maxOutputTokens: {
                    max: 32000,
                    map: '{"max_completion_tokens":maxOutputTokens}',
                  },
                },
              },
            },
          ],
        }),
      ),
      "utf8",
    );
    await writeFile(
      personalFilePath,
      JSON.stringify(
        personalRelease([
          {
            providerId: "personal-api",
            templateId: "anet-template",
            config: {
              group: "standard-personal",
              access: { type: "api-key", apiKey: "secret" },
            },
          },
        ]),
      ),
      "utf8",
    );

    const started = await startProcessProviderRegistryRuntime({
      [ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV]: anetBuiltinFilePath,
      [ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV]: personalFilePath,
    });

    expect(started?.snapshot.registry.providers).toHaveLength(1);
    expect(started?.runtime.registryService.getModel("personal-api", "model-a")).toBeDefined();
    started?.accountSource.replace(
      {
        revision: "account-access-1",
        basedOnANetBuiltinRevision: started!.snapshot.config.anetBuiltinRevision,
        providers: new ProviderConfigMap([
          [
            "account",
            new ProviderConfig({
              access: new ProviderAccountAccessConfig({ entitled: true }),
            }),
          ],
        ]),
      },
      "test",
    );
    await started?.runtime.registryService.refresh("wait-for-account-access");
    expect(started?.runtime.registryService.getProvider("account")?.config).toMatchObject({
      access: {
        type: "provider-account",
      },
      builtinModelIds: ["model-a"],
    });
    const beforeSwitch = await started.accountSource.read();
    const switched = parseProcessAccountProviderConfigSnapshot({
      revision: "account-access-2",
      basedOnANetBuiltinRevision: beforeSwitch.basedOnANetBuiltinRevision,
      providers: Object.fromEntries(
        [...beforeSwitch.providers.entries()].map(([id, config]) => [id, config.toJSON()]),
      ),
      states: { account: { availability: "available", entitled: true, current: false } },
    });
    started.accountSource.replace(switched, "account-no-longer-current");
    await started.runtime.registryService.refresh("wait-for-account-selection");
    expect(started.runtime.registryService.getProvider("account")).toBeUndefined();
    expect(started.runtime.registryService.getProvider("personal-api")).toBeDefined();
    started?.dispose();
  });

  it("Standalone 从账号凭据生成 Account Overlay，并在请求前返回当前 API Key", async () => {
    const root = await temporaryDirectory();
    const anetBuiltinFilePath = join(root, "anet-builtin.json");
    const personalFilePath = join(root, "personal.json");
    const credentialStore = createSharedANetCredentialStore({
      baseDir: join(root, "home"),
      env: { ANET_CREDENTIAL_SECRET: "process-registry-test" },
    });
    const providerId = "configured-standalone-provider";
    const accountIdentity = "account-1";
    const accountProviderCredentialKey = standaloneAccountProviderCredentialKey({
      providerId,
      accountIdentity,
    });
    await writeFile(
      anetBuiltinFilePath,
      JSON.stringify(
        anetBuiltinRelease({
          providers: {
            [providerId]: {
              group: "family-b-family",
              access: {
                type: "provider-account",
                accountType: "family-b",
                mode: "individual-coding-plan",
              },
              api: {
                type: "anthropic-messages",
                baseUrl: "https://account.example.com",
              },
              builtinModelIds: ["model-a"],
            },
          },
          templates: {},
          models: [
            {
              modelMatch: "model-a",
              config: {
                enabled: true,

                properties: {
                  requiresMfjsToolSchema: false,
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
                  supportsJsonSchemaOutput: true,
                  supportsNativeWebSearch: false,
                  supportsMidConversationSystem: false,
                },
                optionSpecs: {
                  reasoningLevel: { values: ["disabled"], map: "{}" },
                  maxOutputTokens: {
                    max: 32000,
                    map: '{"max_completion_tokens":maxOutputTokens}',
                  },
                },
              },
            },
          ],
        }),
      ),
      "utf8",
    );
    await writeFile(personalFilePath, JSON.stringify(personalRelease([])), "utf8");
    await credentialStore.saveMany({
      [standaloneAccountIdentityCredentialKey(providerId)]: accountIdentity,
      [accountProviderCredentialKey]: "runtime-api-key",
      [standaloneAccountAuthSourceCredentialKey(providerId)]: "manual",
    });

    const started = await startProcessProviderRegistryRuntime(
      {
        [ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV]: anetBuiltinFilePath,
        [ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV]: personalFilePath,
      },
      { standalone: { credentialStore } },
    );

    expect(started?.runtime.registryService.getProvider(providerId)?.config.access).toMatchObject({
      type: "provider-account",
      accountType: "family-b",
      mode: "individual-coding-plan",
    });
    await expect(
      started?.providerRuntimeHeadersPort.refreshBeforeModelRequest({
        accountAccess: {
          type: "provider-account",
          accountType: "family-b",
          entitled: true,
          mode: "individual-coding-plan",
        },
        modelId: "model-a",
        providerId,
        reason: "model-request",
        sessionId: "session-1" as never,
        traceContext: { traceId: "trace-1" } as never,
      }),
    ).resolves.toMatchObject({
      headersApplied: true,
      requestAuth: { apiKey: "runtime-api-key" },
    });

    await credentialStore.save(accountProviderCredentialKey, "rotated-runtime-api-key");
    await expect(
      started?.providerRuntimeHeadersPort.refreshBeforeModelRequest({
        accountAccess: {
          type: "provider-account",
          accountType: "family-b",
          entitled: true,
          mode: "individual-coding-plan",
        },
        modelId: "model-a",
        providerId,
        reason: "model-request",
        sessionId: "session-1" as never,
        traceContext: { traceId: "trace-2" } as never,
      }),
    ).resolves.toMatchObject({
      requestAuth: { apiKey: "rotated-runtime-api-key" },
    });

    await credentialStore.deleteIfValues({
      [standaloneAccountIdentityCredentialKey(providerId)]: accountIdentity,
      [accountProviderCredentialKey]: "rotated-runtime-api-key",
    });
    await vi.waitFor(() => {
      expect(started?.runtime.registryService.getProvider(providerId)).toBeUndefined();
    });
    started?.dispose();
  });

  it("Standalone 首次账号凭据读取失败时仍以 fail-closed Account 启动 Personal API Provider", async () => {
    const root = await temporaryDirectory();
    const anetBuiltinFilePath = join(root, "anet-builtin.json");
    const personalFilePath = join(root, "personal.json");
    await writeFile(
      anetBuiltinFilePath,
      JSON.stringify(
        anetBuiltinRelease({
          providers: {},
          templates: {
            api: {
              access: { type: "api-key" },
              api: { type: "anthropic-messages", baseUrl: "https://api.example.com" },
              builtinModelIds: ["model-a"],
            },
          },
          models: [completeANetBuiltinModelRule()],
        }),
      ),
      "utf8",
    );
    await writeFile(
      personalFilePath,
      JSON.stringify(
        personalRelease([
          {
            providerId: "api",
            templateId: "api",
            config: {
              group: "standard-personal",
              access: { type: "api-key", apiKey: "secret" },
            },
          },
        ]),
      ),
      "utf8",
    );
    const accountError = new Error("credential store unavailable");
    const onAccountInitializationError = vi.fn();
    const credentialStore = {
      loadMany: vi.fn(async () => {
        throw accountError;
      }),
    } as unknown as SharedANetCredentialStore;

    const started = await startProcessProviderRegistryRuntime(
      {
        [ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV]: anetBuiltinFilePath,
        [ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV]: personalFilePath,
      },
      { standalone: { credentialStore, onAccountInitializationError } },
    );

    expect(started.runtime.registryService.getProvider("api")).toBeDefined();
    expect(onAccountInitializationError).toHaveBeenCalledWith(accountError);
    started.dispose();
  });

  it("只有显式开启 Standalone 导入时才迁移旧 CLI 用户 Provider", async () => {
    const root = await temporaryDirectory();
    const anetBuiltinFilePath = join(root, "anet-builtin.json");
    const personalFilePath = join(root, "personal.json");
    const legacyFilePath = join(root, "legacy-cli.json");
    await writeFile(
      anetBuiltinFilePath,
      JSON.stringify(
        anetBuiltinRelease({
          providers: {},
          templates: {},
          // Personal Provider 仍由 Built-in 通用规则补齐静态模型事实；迁移器只搬运旧文件显式字段。
          models: [completeANetBuiltinModelRule()],
        }),
      ),
      "utf8",
    );
    await writeFile(
      legacyFilePath,
      JSON.stringify({
        model: "custom/model-a",
        provider: {
          custom: {
            kind: "anthropic",
            options: {
              apiKey: "secret",
              baseURL: "https://custom.example.com",
            },
            models: {
              "model-a": {
                limit: { context: 64_000, output: 8_000 },
              },
            },
          },
        },
      }),
      "utf8",
    );
    const env = {
      [ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV]: anetBuiltinFilePath,
      [ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV]: personalFilePath,
    };

    // Protocol 启动会创建自己的空目标文件；若与 Standalone 共用目标，就会提前消费
    // “仅目标不存在时导入”的机会，无法再证明 Standalone importer 的独立边界。
    const protocolRuntime = await startProcessProviderRegistryRuntime({
      ...env,
      [ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV]: join(root, "protocol-personal.json"),
    });
    expect(protocolRuntime?.snapshot.registry.providers).toEqual([]);
    expect(protocolRuntime?.configuredDefaultModelSelection).toBeUndefined();
    protocolRuntime?.dispose();

    const standaloneRuntime = await startProcessProviderRegistryRuntime(env, {
      standalone: { legacyCliUserConfigFilePath: legacyFilePath },
    });
    expect(standaloneRuntime?.snapshot.registry.providers.map((entry) => entry.providerId)).toEqual(
      ["custom"],
    );
    expect(JSON.parse(await readFile(personalFilePath, "utf8"))).toMatchObject({
      schemaVersion: 1,
      config: {
        providerConfigRules: {
          providerRules: [
            { providerId: "custom", config: { access: { type: "api-key", apiKey: "secret" } } },
          ],
        },
      },
    });
    expect(standaloneRuntime?.configuredDefaultModelSelection).toEqual({
      providerId: "custom",
      modelId: "model-a",
    });
    expect(
      JSON.parse(await readFile(personalFilePath, "utf8")).config.defaultModelSelection,
    ).toEqual({
      providerId: "custom",
      modelId: "model-a",
    });
    standaloneRuntime?.dispose();

    const protocolRestart = await startProcessProviderRegistryRuntime(env);
    expect(protocolRestart?.configuredDefaultModelSelection).toEqual({
      providerId: "custom",
      modelId: "model-a",
    });
    protocolRestart?.dispose();

    await writeFile(
      legacyFilePath,
      JSON.stringify({
        provider: {
          replacement: {
            kind: "anthropic",
            options: {
              apiKey: "replacement-secret",
              baseURL: "https://replacement.example.com",
            },
            models: {
              "model-b": { limit: { context: 32_000, output: 4_000 } },
            },
          },
        },
      }),
      "utf8",
    );
    const restarted = await startProcessProviderRegistryRuntime(env, {
      standalone: { legacyCliUserConfigFilePath: legacyFilePath },
    });
    expect(restarted?.snapshot.registry.providers.map((entry) => entry.providerId)).toEqual([
      "custom",
    ]);
    expect(restarted?.configuredDefaultModelSelection).toEqual({
      providerId: "custom",
      modelId: "model-a",
    });
    restarted?.dispose();
  });
});

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "anet-process-provider-registry-"));
  temporaryDirectories.push(directory);
  return directory;
}

function completeANetBuiltinModelRule() {
  return {
    modelMatch: ".*",
    config: {
      enabled: true,

      properties: {
        requiresMfjsToolSchema: false,
        contextWindow: 200_000,
        inputFormat: {
          supportsText: true,
          supportsImage: false,
          supportsVideo: false,
          supportsAudio: false,
          supportsPdf: false,
        },
        outputFormat: { supportsText: true },
        supportsToolCall: true,
        supportsJsonSchemaOutput: true,
        supportsNativeWebSearch: false,
        supportsMidConversationSystem: false,
      },
      optionSpecs: {
        reasoningLevel: { values: ["disabled"], map: "{}" },
        maxOutputTokens: {
          max: 32_000,
          map: '{"max_completion_tokens":maxOutputTokens}',
        },
      },
    },
  } as const;
}

function anetBuiltinRelease(input: {
  readonly providers: object;
  readonly templates: object;
  readonly models: readonly unknown[];
}): object {
  return {
    schemaVersion: ANET_BUILTIN_RELEASE_SCHEMA_VERSION,
    revision: 1,
    config: {
      providerConfigRules: {
        providerRules: Object.entries(input.providers).map(([providerId, config]) => ({
          providerId,
          config,
        })),
        templateRules: Object.entries(input.templates).map(([templateId, config]) => ({
          templateId,
          templateNameMap: { "en-US": templateId, "zh-CN": templateId },
          config,
        })),
      },
      modelConfigRules: {
        modelRules: input.models,
        modelApiRules: [],
        providerSiteRules: [],
        templateModelRules: [],
        builtinProviderModelRules: [],
      },
    },
  };
}

function personalRelease(providerRules: readonly unknown[]) {
  return {
    schemaVersion: 1,
    config: {
      providerConfigRules: { providerRules },
      modelConfigRules: { providerModelRules: [], manualProviderModelRules: [] },
    },
  };
}
