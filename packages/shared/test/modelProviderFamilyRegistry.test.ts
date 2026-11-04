import { afterEach, describe, expect, it } from "vitest";
import {
  BUILTIN_MODEL_PROVIDER_IDS,
  HIGHSPEED_PROVIDER_IDS,
  isBuiltinModelProviderId,
  isHighspeedProviderId,
  isStartPlanModelProviderId,
  MODEL_PROVIDER_FAMILY_SPECS,
  OFF_PEAK_PROVIDER_IDS,
  getModelProviderFamilySpec,
  normalizeProviderFamilyDomain,
  registerModelProviderFamilySpecs,
  resolveModelProviderFamilyIdByBaseURL,
  resolveModelProviderFamilyIdByProviderId,
  resolveProviderFamilyDomainFromOAuthProvider,
  type ModelProviderFamilySpec,
} from "../src/index.js";

const FIXTURE: ModelProviderFamilySpec = {
  id: "family-x",
  label: "Family X",
  rootDomain: "family-x.invalid",
  oauthProviderId: "family-x",
  startPlanProviderId: "account:family-x-start-plan",
  individualCodingPlanProviderId: "account:family-x-individual-coding-plan",
  teamCodingPlanProviderId: "account:family-x-team-coding-plan",
  teamCodingPlanManageUrl: "",
};

afterEach(() => {
  // 本分发的出厂状态是空注册表;用例之间必须恢复,否则先后顺序会改变结果。
  registerModelProviderFamilySpecs([]);
});

describe("provider family 注册表", () => {
  it("出厂为空表,所有查询返回空", () => {
    expect(MODEL_PROVIDER_FAMILY_SPECS).toEqual([]);
    expect(BUILTIN_MODEL_PROVIDER_IDS).toEqual([]);
    expect(getModelProviderFamilySpec("family-x")).toBeNull();
  });

  it("注册后每一处派生表都反映新注册表", () => {
    registerModelProviderFamilySpecs([FIXTURE]);

    // model-provider-family.ts 的两个 Map
    expect(getModelProviderFamilySpec("family-x")).toEqual(FIXTURE);
    expect(resolveModelProviderFamilyIdByProviderId(FIXTURE.individualCodingPlanProviderId)).toBe(
      "family-x",
    );
    expect(resolveModelProviderFamilyIdByProviderId(FIXTURE.startPlanProviderId)).toBe("family-x");
    expect(resolveModelProviderFamilyIdByProviderId(FIXTURE.teamCodingPlanProviderId)).toBe(
      "family-x",
    );
    expect(normalizeProviderFamilyDomain("family-x")).toBe("family-x");
    expect(normalizeProviderFamilyDomain("family-unregistered")).toBeNull();
    expect(resolveProviderFamilyDomainFromOAuthProvider("family-x")).toBe("family-x");
    expect(resolveModelProviderFamilyIdByBaseURL("https://api.family-x.invalid/v1")).toBe(
      "family-x",
    );

    // model-provider-types.ts 的四个 Set 与导出数组
    expect(isStartPlanModelProviderId(FIXTURE.startPlanProviderId)).toBe(true);
    expect(isBuiltinModelProviderId(FIXTURE.teamCodingPlanProviderId)).toBe(true);
    expect([...BUILTIN_MODEL_PROVIDER_IDS].sort()).toEqual(
      [
        FIXTURE.startPlanProviderId,
        FIXTURE.individualCodingPlanProviderId,
        FIXTURE.teamCodingPlanProviderId,
      ].sort(),
    );

    // off-peak-types.ts 与 highspeed.ts 的两个 Record
    expect(OFF_PEAK_PROVIDER_IDS["family-x"]).toBe("account:family-x-offpeak-idle-plan");
    expect(HIGHSPEED_PROVIDER_IDS["family-x"]).toBe("account:family-x-highspeed-card");
    expect(isHighspeedProviderId("account:family-x-highspeed-card")).toBe(true);
  });

  it("导出的集合是同一个实例,注册只改内容", () => {
    // 这是本次修法的要点:派生物必须就地重建。换成新实例的话,在模块加载期就持有
    // 旧引用的调用方(services / adapters / ui 都有)会永远看到注册前的空表 ——
    // 那正是原缺陷的形态。
    const specsBefore = MODEL_PROVIDER_FAMILY_SPECS;
    const idsBefore = BUILTIN_MODEL_PROVIDER_IDS;
    const offPeakBefore = OFF_PEAK_PROVIDER_IDS;
    const highspeedBefore = HIGHSPEED_PROVIDER_IDS;

    registerModelProviderFamilySpecs([FIXTURE]);

    expect(MODEL_PROVIDER_FAMILY_SPECS).toBe(specsBefore);
    expect(BUILTIN_MODEL_PROVIDER_IDS).toBe(idsBefore);
    expect(OFF_PEAK_PROVIDER_IDS).toBe(offPeakBefore);
    expect(HIGHSPEED_PROVIDER_IDS).toBe(highspeedBefore);
    expect(specsBefore).toEqual([FIXTURE]);
    expect([...idsBefore]).toHaveLength(3);
  });

  it("替换而不是追加:第二次注册后第一个家族不再存在", () => {
    registerModelProviderFamilySpecs([FIXTURE]);
    const other: ModelProviderFamilySpec = {
      ...FIXTURE,
      id: "family-y",
      oauthProviderId: "family-y",
    };
    registerModelProviderFamilySpecs([other]);

    expect(getModelProviderFamilySpec("family-x")).toBeNull();
    expect(getModelProviderFamilySpec("family-y")).toEqual(other);
    expect(MODEL_PROVIDER_FAMILY_SPECS).toHaveLength(1);
    expect(OFF_PEAK_PROVIDER_IDS["family-x"]).toBeUndefined();
    expect(HIGHSPEED_PROVIDER_IDS["family-y"]).toBe("account:family-y-highspeed-card");
  });

  it("注册空表能把派生表清回空", () => {
    registerModelProviderFamilySpecs([FIXTURE]);
    registerModelProviderFamilySpecs([]);

    expect(BUILTIN_MODEL_PROVIDER_IDS).toEqual([]);
    expect(isBuiltinModelProviderId(FIXTURE.startPlanProviderId)).toBe(false);
    expect(OFF_PEAK_PROVIDER_IDS).toEqual({});
    expect(isHighspeedProviderId("account:family-x-highspeed-card")).toBe(false);
  });
});
