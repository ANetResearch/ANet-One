import { describe, expect, it } from "vitest";
import { ModelConfigRules, ProviderConfigMap } from "@anet/provider";
import {
  importLegacyCliConfiguredDefault,
  importLegacyCliPersonalProviderConfig,
} from "../src/app/legacy-cli-personal-provider-config-importer.js";
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


function encoded(update: { providers: ProviderConfigMap; models: ModelConfigRules }): any {
  return {
    schemaVersion: 1,
    providers: update.providers.toJSON(),
    models: update.models.toJSON(),
  };
}

// 新存储格式按规则种类分桶，Provider 名称与配置分离；不再断言已退场的扁平 DTO。
const emptyModelRules = {
  builtinProviderModelRules: [],
  manualProviderModelRules: [],
  modelApiRules: [],
  modelRules: [],
  providerSiteRules: [],
  templateModelRules: [],
};

describe("importLegacyCliPersonalProviderConfig", () => {
  // 旧文件里的 `builtin:*` 与 `account:*` 条目在当前目录里没有落点:本分发不自带厂商
  // 按量/套餐 provider,迁移器对这两类前缀一律跳过(见
  // src/app/legacy-cli-personal-provider-config-importer.ts 里的前缀判定;Desktop 侧
  // packages/services/src/model-provider/legacyPersonalProviderConfigImporter.ts 同样处理)。
  // 上游在这里把 `builtin:<厂商>` 迁成 `<厂商>-api` 并保留 Key,那条映射随厂商 provider
  // 一并移除。本用例现在守的是移除后的契约:整条丢弃 —— 既不迁成任何新 id,也不把其中的
  // Key 带进新配置。旧 Key 漏进来会让用户以为仍连着一个已经不存在的 provider。
  it("旧内置与账号条目整条丢弃，其中的 Key 不进 Personal Config", () => {
    const update = importLegacyCliPersonalProviderConfig({
      input: {
        provider: {
          "builtin:family-a-coding-plan": {
            kind: "anthropic",
            source: "custom",
            options: { apiKey: "discard", apiKeyRequired: false },
            models: { old: {} },
          },
          "builtin:family-a": {
            kind: "anthropic",
            source: "custom",
            name: "old",
            options: { apiKey: " kept ", baseURL: "https://old.test" },
            models: { old: {} },
          },
          "builtin:family-b": { kind: "anthropic", source: "builtin", options: { apiKey: "" } },
          "account:family-b-start-plan": {
            kind: "anthropic",
            source: "custom",
            options: { apiKey: "discard" },
          },
          "legacy-builtin": {
            kind: "anthropic",
            source: "builtin",
            options: { apiKey: "discard" },
          },
        },
      },
    });
    expect(update.providers.keys()).toEqual([]);
    const serialized = JSON.stringify(encoded(update));
    expect(serialized).not.toContain("kept");
    expect(serialized).not.toContain("discard");
    expect(serialized).not.toContain("family-a");
    expect(serialized).not.toContain("family-b");
  });

  it("只把旧用户文件显式声明的 Provider 投影为 Personal Config", () => {
    const update = importLegacyCliPersonalProviderConfig({
      input: {
        model: "custom/model-a",
        provider: {
          custom: {
            kind: "openai-compatible",
            name: "Custom API",
            options: {
              apiKey: "secret",
              baseURL: "https://custom.example.com/v1",
              includeUsage: false,
            },
            models: {
              "model-a": {
                headers: { "X-Model-Route": "legacy" },
                limit: { context: 128_000, output: 16_000 },
                modalities: { input: ["text", "image", "video"] },
                reasoning: {
                  enabled: true,
                  levels: ["low", "high"],
                  defaultLevel: "high",
                  providerOptionsByLevel: {
                    low: { openaiCompatible: { reasoningEffort: "low" } },
                    high: { openaiCompatible: { reasoningEffort: "high" } },
                  },
                },
                structured_output: true,
                tool_call: true,
              },
            },
          },
        },
      },
    });

    expect(encoded(update)).toEqual({
      schemaVersion: 1,
      providers: [
        {
          providerId: "custom",
          providerName: "Custom API",
          config: {
            group: "standard-personal",
            access: { type: "api-key", apiKey: "secret" },
            api: {
              type: "openai-chat-completions",
              baseUrl: "https://custom.example.com/v1",
            },
            personalModelIds: ["model-a"],
            modelOrder: ["model-a"],
          },
        },
      ],
      models: {
        ...emptyModelRules,
        builtinProviderModelRules: [
          {
            providerId: "custom",
            modelId: "model-a",
            config: {
              properties: {
                contextWindow: 128_000,
              },
              optionSpecs: { maxOutputTokens: { max: 16_000 } },
            },
          },
        ],
      },
    });
  });

  it("不把只有 model 选择、没有 provider 定义的内容迁成 Provider", () => {
    const update = importLegacyCliPersonalProviderConfig({
      input: { model: "missing/model-a" },
    });

    expect(encoded(update)).toEqual({
      schemaVersion: 1,
      providers: [],
      models: emptyModelRules,
    });
  });

  it("不把旧 CLI 中的 builtin:* 条目迁成 Personal Provider", () => {
    const update = importLegacyCliPersonalProviderConfig({
      input: {
        provider: {
          "builtin:retired": {
            kind: "anthropic",
            options: { baseURL: "https://retired.example.com", apiKey: "retired" },
            models: { retired: {} },
          },
          custom: {
            kind: "openai-compatible",
            options: { baseURL: "https://custom.example.com", apiKey: "current" },
            models: { current: {} },
          },
        },
      },
    });

    expect(update.providers.keys()).toEqual(["custom"]);
  });

  it("忽略旧 model options 中没有正式语义的任意字段", () => {
    const update = importLegacyCliPersonalProviderConfig({
      input: {
        provider: {
          custom: {
            kind: "openai-compatible",
            options: {
              apiKey: "secret",
              baseURL: "https://custom.example.com/v1",
            },
            models: {
              "model-a": {
                limit: { context: 128_000, output: 16_000 },
                options: {
                  openaiCompatible: {
                    reasoningSummary: "auto",
                    metadata: { source: "legacy" },
                  },
                },
              },
              "model-b": {
                options: { reasoningSummary: "concise" },
              },
            },
          },
        },
      },
    });

    expect(encoded(update).models.builtinProviderModelRules[0]?.config).not.toHaveProperty(
      "requestParameters",
    );
    expect(encoded(update).models.builtinProviderModelRules).toHaveLength(1);
  });

  it("迁移 options.max_tokens，但不扩展任意 extra_body 字段", () => {
    const update = importLegacyCliPersonalProviderConfig({
      input: {
        provider: {
          custom: {
            kind: "openai-compatible",
            options: {
              apiKey: "secret",
              baseURL: "https://custom.example.com/v1",
            },
            models: {
              direct: {
                options: { max_tokens: 24_000 },
              },
              wrapped: {
                options: {
                  extra_body: { max_tokens: 12_000, reasoning_format: "parsed" },
                },
              },
            },
          },
        },
      },
    });

    expect(update.models.getExact("custom", "direct")?.toJSON()).toEqual({
      optionSpecs: { maxOutputTokens: { max: 24_000 } },
    });
    expect(update.models.getExact("custom", "wrapped")).toBeUndefined();
  });

  it("忽略没有生产消费方的 reasoning replay 元数据", () => {
    const update = importLegacyCliPersonalProviderConfig({
      input: {
        provider: {
          custom: {
            kind: "openai-compatible",
            options: {
              apiKey: "secret",
              baseURL: "https://custom.example.com/v1",
            },
            models: {
              "model-a": {
                interleaved: { field: "reasoning_content" },
                reasoningContentField: "reasoning_content",
              },
            },
          },
        },
      },
    });

    expect(update.providers.get("custom")).toBeDefined();
    expect(encoded(update).models).toEqual(emptyModelRules);
  });

  it("无 API Key Provider 在正式类型建立前继续留在兼容链路", () => {
    expect(() =>
      importLegacyCliPersonalProviderConfig({
        input: {
          provider: {
            local: {
              kind: "openai-compatible",
              options: {
                apiKeyRequired: false,
                baseURL: "http://127.0.0.1:11434/v1",
              },
              models: { "model-a": {} },
            },
          },
        },
      }),
    ).toThrow(/local/);
  });
});

describe("importLegacyCliConfiguredDefault", () => {
  it("把旧用户文件的 main model 迁移为 Environment Configured Default", () => {
    expect({
      schemaVersion: 1,
      configuredDefault: importLegacyCliConfiguredDefault({
        model: {
          main: "custom/model-a",
          lite: "custom/model-b",
        },
      }),
    }).toEqual({
      schemaVersion: 1,
      configuredDefault: {
        providerId: "custom",
        modelId: "model-a",
      },
    });
  });

  it("没有显式 model 时不产生迁移文档", () => {
    expect(importLegacyCliConfiguredDefault({ provider: {} })).toBeNull();
  });

});
