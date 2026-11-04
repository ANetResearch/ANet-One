import type { CreateAiSdkModelOptions } from "@anet/adapters/model";
import type { Model } from "@anet/contracts";
import { fileURLToPath } from "node:url";
import {
  ApiKeyAccessConfig,
  ModelConfigRules,
  ProviderConfig,
  ProviderConfigMap,
  ProviderConfigResolver,
  ProviderRegistry,
  ProviderAccountAccessConfig,
  type ProviderId,
} from "@anet/provider";
import {
  NodeANetBuiltinProviderConfigSource,
  type ANetBuiltinProviderConfigSnapshot,
} from "@anet/provider-node";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ApiProviderModelRuntime } from "../src/app/provider-registry-model-runtime.js";
import { registerModelProviderFamilySpecs } from "@anet/shared";

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


// 随包目录 config/provider/anet-builtin.json 不含任何 Account Provider(providerRules 为空),
// 模板也只有按量 API 条目 —— 本分发不自带厂商 Coding Plan。本用例验的是
// "Built-in Config → Resolver → Registry → Adapter" 这条装配链,与目录里具体有谁无关,
// 所以读一份只含夹具家族的 Built-in Config;读取仍走真实的
// NodeANetBuiltinProviderConfigSource 与真实 Resolver。
const anetBuiltinProviderConfigFilePath = fileURLToPath(
  new URL("./fixtures/anet-builtin-family.json", import.meta.url),
);
const source = new NodeANetBuiltinProviderConfigSource({
  bundledFilePath: anetBuiltinProviderConfigFilePath,
  watch: false,
});
let anetBuiltin: ANetBuiltinProviderConfigSnapshot;

beforeAll(async () => {
  anetBuiltin = await source.read();
});

afterAll(() => source.dispose());

describe("真实 ANet Built-in Config 到 Active Model", () => {
  it("API Key Personal Overlay 经 Registry 原样装配到 Adapter", () => {
    const providerId = "family-b-api";
    const modelId = "model-a";
    const registry = resolveOneBuiltinProvider(providerId, {
      personalProviders: new ProviderConfigMap([
        [
          providerId,
          // 实例在创建时复制模板；Resolver 不会从已退场的 templateId 字段隐式继承。
          anetBuiltin.providerTemplates
            .get("family-b-api")!
            .config.withPersonalModelIds([modelId])
            .overlay(
              new ProviderConfig({
                group: "standard-personal",
                access: new ApiKeyAccessConfig({ apiKey: "test-family-b-api-key" }),
              }),
            ),
        ],
      ]),
    });
    const capture = captureRuntime(registry);

    const model = capture.runtime.modelFactory({
      selection: selectionWithHighestReasoning(registry, providerId, modelId),
    });
    const registryProvider = registry.getProvider(providerId);
    const registryModel = registry.getModel(providerId, modelId);

    expect(model).toBe(capture.models[0]);
    expect(capture.created[0]?.providerConfig).toBe(registryProvider?.config);
    expect(capture.created[0]?.modelConfig).toBe(registryModel?.config);
    expect(capture.created[0]).toMatchObject({
      providerId,
      modelId,
      providerConfig: {
        access: { type: "api-key", apiKey: "test-family-b-api-key" },
        api: {
          type: anetBuiltin.providerTemplates.get("family-b-api")?.config.api?.type,
          baseUrl: anetBuiltin.providerTemplates.get("family-b-api")?.config.api?.baseUrl,
        },
      },
    });
  });

  it("Account 约束 Built-in 成员后仍由 Personal Overlay 最后覆盖", () => {
    const providerId = "account:family-b-start-plan";
    const modelId = "Model-C";
    const registry = resolveOneBuiltinProvider(providerId, {
      accountProviders: new ProviderConfigMap([
        [
          providerId,
          new ProviderConfig({
            builtinModelIds: [modelId],
            access: new ProviderAccountAccessConfig({ entitled: true }),
          }),
        ],
      ]),
      personalProviders: new ProviderConfigMap([
        [providerId, new ProviderConfig({ visibility: "hidden" })],
      ]),
    });
    const capture = captureRuntime(registry);

    capture.runtime.modelFactory({
      selection: selectionWithHighestReasoning(registry, providerId, modelId),
    });

    expect(registry.getProvider(providerId)?.models.map(({ modelId: id }) => id)).toEqual([
      modelId,
    ]);
    expect(capture.created[0]?.providerConfig).toMatchObject({
      visibility: "hidden",
      access: {
        type: "provider-account",
        accountType: "family-b",
        mode: "start-plan",
      },
    });
    expect(capture.created[0]?.modelConfig).toBe(registry.getModel(providerId, modelId)?.config);
  });

  it("隐藏 Request Auth Provider 仍由普通 Registry 精确创建 Model", () => {
    const providerId = "account:family-b-offpeak-idle-plan";
    const modelId = "Model-A";
    const registry = resolveOneBuiltinProvider(providerId, {
      accountProviders: new ProviderConfigMap([
        [
          providerId,
          new ProviderConfig({
            access: new ProviderAccountAccessConfig({ entitled: true }),
          }),
        ],
      ]),
    });
    const capture = captureRuntime(registry);
    const requestAuthSource = { resolve: vi.fn() };

    capture.runtime.modelFactory({
      selection: selectionWithHighestReasoning(registry, providerId, modelId),
      requestDependencies: { requestAuth: { source: requestAuthSource } },
    });

    expect(registry.getView().providers[0]).toMatchObject({
      providerId,
      config: {
        visibility: "hidden",
        access: { type: "provider-account", accountType: "family-b", mode: "off-peak" },
      },
    });
    expect(capture.created[0]?.requestDependencies?.requestAuth?.source).toBe(requestAuthSource);
    expect(capture.created[0]?.providerConfig).toBe(registry.getProvider(providerId)?.config);
    expect(capture.created[0]?.modelConfig).toBe(registry.getModel(providerId, modelId)?.config);
  });
});

function selectionWithHighestReasoning(
  registry: ProviderRegistry,
  providerId: ProviderId,
  modelId: string,
) {
  const reasoningLevel = registry
    .getModel(providerId, modelId)
    ?.config.optionSpecs.reasoningLevel.values.at(-1);
  if (!reasoningLevel) throw new Error(`测试模型缺少 reasoning: ${providerId}/${modelId}`);
  return { providerId, modelId, options: { reasoningLevel } };
}

function resolveOneBuiltinProvider(
  providerId: ProviderId,
  overlays: {
    accountProviders?: ProviderConfigMap;
    personalProviders?: ProviderConfigMap;
    models?: ModelConfigRules;
  } = {},
): ProviderRegistry {
  const provider = anetBuiltin.providers.get(providerId);
  const personalProvider = overlays.personalProviders?.get(providerId);
  if (!provider && !personalProvider) {
    throw new Error(`测试引用的 Built-in Provider 或 Personal 实例不存在: ${providerId}`);
  }
  const resolution = new ProviderConfigResolver().resolve({
    anetBuiltinProviders: provider
      ? new ProviderConfigMap([[providerId, provider]])
      : ProviderConfigMap.empty(),
    anetBuiltinProviderTemplates: anetBuiltin.providerTemplates,
    accountProviders: overlays.accountProviders ?? ProviderConfigMap.empty(),
    personalProviders: overlays.personalProviders ?? ProviderConfigMap.empty(),
    anetBuiltinModelRules: anetBuiltin.models,
    personalModels: overlays.models ?? ModelConfigRules.empty(),
  });
  expect(resolution.issues).toEqual([]);
  return new ProviderRegistry(resolution.registryProviders);
}

function captureRuntime(registry: ProviderRegistry) {
  const created: CreateAiSdkModelOptions[] = [];
  const models: Model[] = [];
  const runtime = new ApiProviderModelRuntime({
    registry: {
      getView: () => registry.getView(),
      getProvider: (providerId) => registry.getProvider(providerId),
      getModel: (providerId, modelId) => registry.getModel(providerId, modelId),
      validateSelection: (selection) => registry.validateSelection(selection),
      onDidChange: (listener) => registry.onDidChange(listener),
    },
    modelAdapter: {
      createModel(options) {
        created.push(options);
        const model = createCapturedModel(options);
        models.push(model);
        return model;
      },
    },
  });
  runtime.start();
  return { created, models, runtime };
}

function createCapturedModel(options: CreateAiSdkModelOptions): Model {
  const model: Model = {
    providerId: options.providerId,
    modelId: options.modelId,
    properties: options.modelConfig.properties,
    optionSpecs: options.modelConfig.optionSpecs,
    options: options.options,
    bind() {
      return model;
    },
    async generateText() {
      throw new Error("not used");
    },
    streamText() {
      throw new Error("not used");
    },
  };
  return model;
}
