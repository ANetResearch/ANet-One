import { describe, expect, it } from "vitest";
import {
  migrateLegacyModelProviderId,
  migrateLegacyOfficialModelId,
} from "../src/legacy-model-provider-identity.js";
import { importSubagentStateSelections } from "../src/subagent-state-migration.js";
import { migrateSubagentMarkdownProvider } from "../src/subagent-markdown-selection.js";

// 上游在这一层把厂商的旧 `builtin:*` id 映射到新的内置 provider id,并把官方模型名
// 收敛到名单里的规范大小写。两件事都随厂商 provider 一并移除,legacy-model-provider-identity.ts
// 把结果写成了明确契约:`builtin:*` 一律返回 undefined,模型名原样返回。
//
// 这份用例守的是那个契约本身。在它之前,这两个函数没有任何测试 —— 而
// adapters/src/storage/session-store/migrations/0020-provider-model-selection.ts 的注释
// 明确要求"与已裁决的 migrateLegacyModelProviderId 对照测试",SQL 侧的 builtin:* → NULL
// 规则正是照着它写的。
describe("旧 Provider 身份迁移", () => {
  it("所有 builtin:* 旧 id 都没有可落的当前身份", () => {
    for (const providerId of [
      "builtin:family-a",
      "builtin:family-a-coding-plan",
      "builtin:family-b-start-plan",
      "builtin:",
      "builtin:anything/else",
    ]) {
      expect(migrateLegacyModelProviderId(providerId)).toBeUndefined();
    }
  });

  it("非 builtin: 的 id 原样返回,不被改写也不被丢弃", () => {
    for (const providerId of [
      "family-a-api",
      "account:family-a-individual-coding-plan",
      "custom:my-gateway",
      "removed",
      "",
    ]) {
      expect(migrateLegacyModelProviderId(providerId)).toBe(providerId);
    }
  });

  it("官方模型名不做大小写归一:本分发不随包维护官方名单", () => {
    expect(migrateLegacyOfficialModelId("builtin:family-b-coding-plan", "model-b")).toBe("model-b");
    expect(migrateLegacyOfficialModelId("family-a-api", "Model-A")).toBe("Model-A");
  });

  it("Subagent Markdown 的 model 行不被改写", () => {
    const content =
      "---\nname: legacy\nmodel: builtin:family-b-coding-plan/model-b\nthoughtLevel: high\n---\nbody";
    expect(migrateSubagentMarkdownProvider(content)).toBe(content);
  });

  it("Subagent 状态只换结构:字符串 map 变成选择 map,其中的旧 id 原样保留", () => {
    const imported = importSubagentStateSelections({
      builtInModelOverrides: { Explore: "builtin:family-b-coding-plan/model-b" },
      builtInThoughtLevelOverrides: { Explore: "high" },
      pluginAgentModelOverrides: { "plugin:p:a": "builtin:family-b-coding-plan/model-b" },
      pluginAgentThoughtLevelOverrides: { "plugin:p:a": "high" },
    });
    const expected = {
      providerId: "builtin:family-b-coding-plan",
      modelId: "model-b",
      options: { reasoningLevel: "high" },
    };
    expect(imported.builtInModelSelectionOverrides.Explore).toEqual(expected);
    expect(imported.pluginAgentModelSelectionOverrides["plugin:p:a"]).toEqual(expected);
  });
});
