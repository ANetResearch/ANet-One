import { describe, expect, it, vi } from "vitest";
import { createModelId, createModelProviderId, type ModelInputMessage } from "@anet/contracts";
import { normalizeReasoningHistory } from "../src/model/reasoning-history-normalization.js";
import { registerModelProviderFamilySpecs } from "@anet/shared";

// 家族注册表在本分发里是空的(不内置任何厂商账号体系),而 reasoning 回放的"同服务
// 不同套餐身份互认"机制按注册表生成分组。这里注册两个取值中性的测试家族,让该机制
// 本身仍被覆盖;不注册的话这组用例只会验到"provider id 必须完全相同"。
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

const MODEL_ID = createModelId("Model-A");
const PROVIDER_GROUPS = [
  ["builtin:family-b-coding-plan", "account:family-b-individual-coding-plan", "account:family-b-team-coding-plan"],
  [
    "builtin:family-a-coding-plan",
    "account:family-a-individual-coding-plan",
    "account:family-a-team-coding-plan",
  ],
];
const compatiblePairs = PROVIDER_GROUPS.flatMap((group) =>
  group.flatMap((source) => group.map((target) => [source, target] as const)),
);

describe("reasoning replay provider identity", () => {
  it.each(compatiblePairs)("preserves history and cache metadata: %s -> %s", (source, target) => {
    const messages = history(source);
    const before = structuredClone(messages);
    expect(normalizeReasoningHistory(messages, identity(target))).toBe(messages);
    expect(messages).toEqual(before);
  });

  it.each([
    ["builtin:family-b-coding-plan", "account:family-a-individual-coding-plan"],
    ["builtin:family-a-coding-plan", "account:family-b-team-coding-plan"],
    ["account:family-b-team-coding-plan", "account:family-a-team-coding-plan"],
    ["custom-a", "custom-b"],
    ["custom-family-b-coding-plan", "account:family-b-individual-coding-plan"],
    ["account:family-b-team-coding-plan-extra", "account:family-b-team-coding-plan"],
    ["builtin:family-b-unknown-plan", "account:family-b-team-coding-plan"],
    ["account:family-b-start-plan", "account:family-b-team-coding-plan"],
    ["account:family-b-off-peak", "account:family-b-team-coding-plan"],
    ["family-b-api", "account:family-b-team-coding-plan"],
  ])("keeps distinct providers isolated: %s -> %s", (source, target) => {
    expectStripped(history(source), identity(target));
    expectStripped(history(target), identity(source));
  });

  it.each([["builtin:family-b-coding-plan", "builtin:family-b-coding-plan"]] as const)(
    "still strips across model IDs: %s -> %s",
    (source, target) => {
      expectStripped(history(source), { ...identity(target), modelId: createModelId("Model-C") });
    },
  );

  it("keeps identical custom provider identities compatible", () => {
    const messages = history("custom-a");
    expect(normalizeReasoningHistory(messages, identity("custom-a"))).toBe(messages);
  });
});

function identity(providerId: string) {
  return { providerId: createModelProviderId(providerId), modelId: MODEL_ID };
}

function history(providerId: string): ModelInputMessage[] {
  return [
    { role: "user", content: "Read the file" },
    {
      role: "assistant",
      ...identity(providerId),
      cacheControl: { type: "ephemeral" },
      content: [
        {
          type: "reasoning",
          text: "signed",
          providerOptions: { anthropic: { signature: " sig\n" } },
        },
        { type: "reasoning", text: "", providerOptions: { anthropic: { redactedData: "opaque" } } },
        { type: "reasoning", text: "unsigned" },
        { type: "text", text: "Reading" },
      ],
      toolCalls: [{ id: "read", name: "Read", input: { file_path: "file.txt" } }],
    },
    { role: "tool", toolCallId: "read", toolName: "Read", content: "File contents" },
    { role: "user", content: "Continue" },
  ];
}

function expectStripped(messages: ModelInputMessage[], target: ReturnType<typeof identity>) {
  const before = structuredClone(messages);
  const projected = normalizeReasoningHistory(messages, target);
  expect(projected).toEqual([
    messages[0],
    {
      ...messages[1],
      content: [
        { type: "reasoning", text: "unsigned" },
        { type: "text", text: "Reading" },
      ],
    },
    ...messages.slice(2),
  ]);
  expect(messages).toEqual(before);
}
