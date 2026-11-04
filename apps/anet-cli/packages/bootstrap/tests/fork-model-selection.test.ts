// 会话派生（分叉 / 编辑前分叉）的常驻 Selection 推导回归。
// Bug：加速中的会话分叉后没有把原模型带过去——分叉点消息记录的是加速卡的单轮执行
// Selection（highspeed-card-spec §5），旧实现把它当成会话选型继承给 child。
import { describe, expect, it, vi } from "vitest";
import { HIGHSPEED_PROVIDER_IDS, registerModelProviderFamilySpecs } from "@anet/shared";

/* 本分发不内置厂商账号体系,`MODEL_PROVIDER_FAMILY_SPECS` 是空表,于是
   `account:family-a-highspeed-card` 不被 `isHighspeedProviderId` 认成加速卡,按加速卡
   语义写的断言会全部落空。这里注册一个取值中性的测试家族,让该机制本身仍被覆盖。

   `HIGHSPEED_PROVIDER_IDS` 与 `isHighspeedProviderId` 在 @anet/shared 内部按注册表于
   模块加载时求值,只覆盖 `MODEL_PROVIDER_FAMILY_SPECS` 不会让它们重算,必须一并覆盖,
   否则 mock 看着生效、判据仍是空表。 */
// 本分发的 provider family 注册表为空;这里注册夹具家族,被测链路按注册表工作。
// 用 registerModelProviderFamilySpecs() 而不是 vi.mock("@anet/shared"):被 mock 的只是
// barrel 的导出,而 @anet/shared 内部的派生表引用的是同模块局部常量,
// model-provider-types.ts 又直接 import "./model-provider-family.js" —— 两者都绕不过
// barrel 上的 mock,mock 之后所有查询函数仍按空表工作。
// 加速卡 id 现在由注册表派生,注册这两个家族即可,
// 不需要再单独覆盖 HIGHSPEED_PROVIDER_IDS 与 isHighspeedProviderId。
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

import {
  cloneModelSelection,
  derivedSessionModelSelection,
  modelSelectionWithOptionFallback,
} from "../src/anet-protocol/fork-model-selection.js";

const sessionSelection = {
  providerId: "builtin:family-b-coding-plan",
  modelId: "model-b",
  options: { reasoningLevel: "high" },
};

describe("派生会话的常驻 Selection", () => {
  it("分叉点是加速轮时退回父会话常驻 Selection，不继承加速 Provider", () => {
    for (const providerId of Object.values(HIGHSPEED_PROVIDER_IDS)) {
      const derived = derivedSessionModelSelection(
        { providerId, modelId: "model-e", options: { reasoningLevel: "max" } },
        sessionSelection,
      );

      // 加速期间会话常驻 Selection 从未被改写，它就是用户的原模型。
      expect(derived).toEqual(sessionSelection);
      expect(derived).not.toBe(sessionSelection);
    }
  });

  it("父会话也没有常驻 Selection 时宁可留空，也不把加速 Provider 写进 child", () => {
    expect(
      derivedSessionModelSelection(
        { providerId: "account:family-b-highspeed-card", modelId: "model-e" },
        undefined,
      ),
    ).toBeUndefined();
  });

  it("普通分叉点继承消息选型，缺失推理档位时回落会话档位", () => {
    expect(
      derivedSessionModelSelection(
        { providerId: "provider-a", modelId: "model-a", options: { reasoningLevel: "low" } },
        sessionSelection,
      ),
    ).toEqual({
      providerId: "provider-a",
      modelId: "model-a",
      options: { reasoningLevel: "low" },
    });
    expect(
      derivedSessionModelSelection(
        { providerId: "provider-a", modelId: "model-a" },
        sessionSelection,
      ),
    ).toEqual({
      providerId: "provider-a",
      modelId: "model-a",
      options: { reasoningLevel: "high" },
    });
  });

  it("分叉点消息没有选型事实时按会话常驻 Selection 派生", () => {
    expect(derivedSessionModelSelection(undefined, sessionSelection)).toEqual(sessionSelection);
    expect(derivedSessionModelSelection(undefined, undefined)).toBeUndefined();
  });
});

describe("Selection 复制原语", () => {
  it("cloneModelSelection 不与源共享 options 引用", () => {
    const cloned = cloneModelSelection(sessionSelection);
    expect(cloned).toEqual(sessionSelection);
    expect(cloned?.options).not.toBe(sessionSelection.options);
    expect(cloneModelSelection(undefined)).toBeUndefined();
  });

  it("modelSelectionWithOptionFallback 无回落值时保留请求的模型身份", () => {
    expect(modelSelectionWithOptionFallback({ providerId: "p", modelId: "m" }, undefined)).toEqual({
      providerId: "p",
      modelId: "m",
    });
  });
});
