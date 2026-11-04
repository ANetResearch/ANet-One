import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  builtinModelConfigRulesSchema,
  builtinProviderConfigRulesSchema,
} from "../src/config/rule-data-schema.js";

// 这份 JSON 是随包分发的配置数据,之前没有任何测试解析过它:写错一个字段
// 要到运行时才暴露。这里按真实 schema 解析一遍,并钉住 TokenBank 接入的关键取值。
const CONFIG_PATH = fileURLToPath(
  new URL("../../../config/provider/anet-builtin.json", import.meta.url),
);
const TEMPLATE_ID = "anet-token";

function loadConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as {
    readonly config: {
      readonly providerConfigRules: unknown;
      readonly modelConfigRules: unknown;
    };
  };
}

describe("随包分发的 provider 配置", () => {
  it("整份配置能通过 schema 解析", () => {
    const { config } = loadConfig();
    expect(() => builtinProviderConfigRulesSchema.parse(config.providerConfigRules)).not.toThrow();
    expect(() => builtinModelConfigRulesSchema.parse(config.modelConfigRules)).not.toThrow();
  });

  it("Agent Network Token 模板走 Anthropic wire", () => {
    const { config } = loadConfig();
    const rules = builtinProviderConfigRulesSchema.parse(config.providerConfigRules);
    const tpl = rules.templateRules.find((r) => r.templateId === TEMPLATE_ID);
    expect(tpl, "anet-token 模板不存在").toBeDefined();
    // 走 Anthropic wire 而不是 OpenAI wire:服务端 web_search 工具只在
    // Anthropic 原生链路上保留,经 OpenAI 口径翻译会被降级成无参函数工具。
    expect(tpl?.config.api?.type).toBe("anthropic-messages");
    // 适配层会把 baseUrl 补成 .../v1 再接 /messages,所以这里不能自带 /v1。
    expect(tpl?.config.api?.baseUrl).toBe("https://token.anet.chat");
    expect(tpl?.config.api?.baseUrl?.endsWith("/v1")).toBe(false);
    // 只填一个 token 就能连上:访问方式必须是裸 api-key,不是任何账号登录流程。
    expect(tpl?.config.access?.type).toBe("api-key");
    expect(tpl?.config.logo).toEqual({ type: "builtin", key: "agent-network" });
    expect((tpl?.config.builtinModelIds ?? []).length).toBeGreaterThan(20);
  });

  it("模板声明的每个模型都挂上了 templateModelRule", () => {
    const { config } = loadConfig();
    const providerRules = builtinProviderConfigRulesSchema.parse(config.providerConfigRules);
    const modelRules = builtinModelConfigRulesSchema.parse(config.modelConfigRules);
    const declared = new Set(
      providerRules.templateRules.find((r) => r.templateId === TEMPLATE_ID)?.config
        .builtinModelIds ?? [],
    );
    const wired = new Set(
      modelRules.templateModelRules
        .filter((r) => r.templateId === TEMPLATE_ID)
        .map((r) => r.modelId),
    );
    const missing = [...declared].filter((m) => !wired.has(m));
    expect(missing, `声明了但没挂规则的模型: ${missing.join(", ")}`).toEqual([]);
  });

  it("只给实测过的模型开原生 WebSearch", () => {
    const { config } = loadConfig();
    const modelRules = builtinModelConfigRulesSchema.parse(config.modelConfigRules);
    const site = modelRules.providerSiteRules.filter((r) =>
      r.baseUrlMatch.includes("token\\.anet\\.chat"),
    );
    expect(site.length, "没有针对 token.anet.chat 的站点规则").toBe(1);
    const rule = site[0]!;
    expect(rule.apiTypeMatch).toBe("anthropic-messages");
    expect(rule.config.properties?.supportsNativeWebSearch).toBe(true);
    // 2026-11-02 实测透传成功的只有 claude-*;其余模型经网关转换未实测,
    // 不得一并打开 —— "不知道"和"知道没问题"是两种状态。
    const pattern = new RegExp(`^(?:${rule.modelMatch})$`);
    expect(pattern.test("claude-sonnet-5-5")).toBe(true);
    expect(pattern.test("gpt-6-sol")).toBe(false);
    expect(pattern.test("glm-5.3")).toBe(false);
  });
});
