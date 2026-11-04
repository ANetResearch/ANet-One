// 会话常驻 Selection 的恢复回归。
// Bug 现场：旧版分叉把分叉点的加速卡选型写进 child 的 runtime/model_selection entry，
// 这类会话恢复后常驻在隐藏的 `account:*-highspeed-card` 上，UI 模型选择器一片空白。
import { describe, expect, it, vi } from "vitest";
import {
  SESSION_ENTRY_MODEL_SELECTION,
  type SessionEntryInfo,
  type SessionId,
  type SessionStorePort,
} from "@anet/contracts";
import { HIGHSPEED_PROVIDER_IDS, registerModelProviderFamilySpecs } from "@anet/shared";
import { readSessionModelSelection } from "../src/app/session-store.js";

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


const SESSION_ID = "sess_restore" as SessionId;

function storeWithEntryData(data: unknown): Pick<SessionStorePort, "sessionEntries"> {
  const entry = {
    id: `${SESSION_ID}:runtime-model-selection`,
    sessionID: SESSION_ID,
    type: SESSION_ENTRY_MODEL_SELECTION,
    time: { created: 1, updated: 1 },
    data,
  } as SessionEntryInfo;
  return { sessionEntries: async () => [entry] } as Pick<SessionStorePort, "sessionEntries">;
}

describe("恢复会话常驻 Selection", () => {
  it("丢弃持久化的加速卡选型，让会话回到未绑定", async () => {
    for (const providerId of Object.values(HIGHSPEED_PROVIDER_IDS)) {
      await expect(
        readSessionModelSelection(
          storeWithEntryData({
            providerId,
            modelId: "Model-A",
            options: { reasoningLevel: "max" },
          }),
          SESSION_ID,
        ),
      ).resolves.toBeUndefined();
    }
  });

  it("普通选型原样恢复", async () => {
    await expect(
      readSessionModelSelection(
        storeWithEntryData({
          providerId: "account:family-a-team-coding-plan",
          modelId: "Model-A",
          options: { reasoningLevel: "max" },
        }),
        SESSION_ID,
      ),
    ).resolves.toEqual({
      providerId: "account:family-a-team-coding-plan",
      modelId: "Model-A",
      options: { reasoningLevel: "max" },
    });
  });

  it("档位非法走模型身份兜底时同样过滤加速卡", async () => {
    // 兜底分支只捞 providerId/modelId，加速 Provider 不能借这条路径复活。
    await expect(
      readSessionModelSelection(
        storeWithEntryData({
          providerId: "account:family-a-highspeed-card",
          modelId: "Model-A",
          options: { reasoningLevel: 3 },
        }),
        SESSION_ID,
      ),
    ).resolves.toBeUndefined();
    await expect(
      readSessionModelSelection(
        storeWithEntryData({
          providerId: "account:family-a-team-coding-plan",
          modelId: "Model-A",
          options: { reasoningLevel: 3 },
        }),
        SESSION_ID,
      ),
    ).resolves.toEqual({ providerId: "account:family-a-team-coding-plan", modelId: "Model-A" });
  });

  it("没有 entry 时返回空", async () => {
    await expect(
      readSessionModelSelection({ sessionEntries: async () => [] }, SESSION_ID),
    ).resolves.toBeUndefined();
    await expect(readSessionModelSelection({}, SESSION_ID)).resolves.toBeUndefined();
  });
});
