/* eslint-disable max-lines -- 模型供应商 schema、迁移和运行时投影 helper 需要共享同一套类型边界，暂时集中在单文件避免契约分散。 */
import {
  MODEL_PROVIDER_FAMILY_SPECS,
  onModelProviderFamilyRegistryChange,
} from "./model-provider-family.js";

export const BUILTIN_PROVIDER_TEMPLATE_IDS = {
  anetToken: "anet-token",
} as const;

/**
 * 内置账号套餐 Provider 的 id。
 *
 * 上游在这里写死了两家厂商各三个套餐 id(Start / 个人 Coding Plan / 团队 Coding Plan)。
 * 本分发不内置厂商,这些 id 改为从 provider family 注册表推导:注册表为空时集合为空,
 * 注册了 family 之后自动包含该 family 的三个套餐 id,不需要再改这里。
 */
const BUILTIN_START_PLAN_PROVIDER_IDS = new Set<string>();
const BUILTIN_INDIVIDUAL_CODING_PLAN_PROVIDER_IDS = new Set<string>();
const BUILTIN_TEAM_CODING_PLAN_PROVIDER_IDS = new Set<string>();
const BUILTIN_MODEL_PROVIDER_ID_SET = new Set<string>();
const BUILTIN_MODEL_PROVIDER_ID_LIST: string[] = [];

/** 全部内置账号套餐 provider id;注册表为空时为空数组。 */
export const BUILTIN_MODEL_PROVIDER_IDS: readonly string[] = BUILTIN_MODEL_PROVIDER_ID_LIST;

// 这五个容器就地重建,不换实例:`BUILTIN_MODEL_PROVIDER_IDS` 是对外导出的,换成新数组
// 会让在模块加载期就持有它的调用方永远看到注册前的空表。
onModelProviderFamilyRegistryChange(() => {
  for (const set of [
    BUILTIN_START_PLAN_PROVIDER_IDS,
    BUILTIN_INDIVIDUAL_CODING_PLAN_PROVIDER_IDS,
    BUILTIN_TEAM_CODING_PLAN_PROVIDER_IDS,
    BUILTIN_MODEL_PROVIDER_ID_SET,
  ]) {
    set.clear();
  }
  BUILTIN_MODEL_PROVIDER_ID_LIST.length = 0;
  for (const spec of MODEL_PROVIDER_FAMILY_SPECS) {
    BUILTIN_START_PLAN_PROVIDER_IDS.add(spec.startPlanProviderId);
    BUILTIN_INDIVIDUAL_CODING_PLAN_PROVIDER_IDS.add(spec.individualCodingPlanProviderId);
    BUILTIN_TEAM_CODING_PLAN_PROVIDER_IDS.add(spec.teamCodingPlanProviderId);
  }
  for (const id of [
    ...BUILTIN_START_PLAN_PROVIDER_IDS,
    ...BUILTIN_INDIVIDUAL_CODING_PLAN_PROVIDER_IDS,
    ...BUILTIN_TEAM_CODING_PLAN_PROVIDER_IDS,
  ]) {
    BUILTIN_MODEL_PROVIDER_ID_SET.add(id);
  }
  BUILTIN_MODEL_PROVIDER_ID_LIST.push(...BUILTIN_MODEL_PROVIDER_ID_SET);
});

/**
 * 取值由注册的 family 决定,因此是开放的 string 而不是字面量联合。
 * 上游是六个字面量的联合;注册表为空时联合会退化为 never,所有调用点都过不了类型检查。
 */
export type BuiltinModelProviderId = string;

export function isBuiltinModelProviderId(id: string): id is BuiltinModelProviderId {
  return BUILTIN_MODEL_PROVIDER_ID_SET.has(id);
}

export function isStartPlanModelProviderId(id: string): boolean {
  return BUILTIN_START_PLAN_PROVIDER_IDS.has(id);
}

/**
 * 个人版 Coding Plan（不含 Start Plan 与 Team Plan）。
 * Start Plan 用 disconnected 展示领取/付费卡，Team Plan 有独立文案，
 * "服务端明确无权益"只对个人版需要区分成"未开通"。
 */
export function isIndividualCodingPlanModelProviderId(id: string): boolean {
  return BUILTIN_INDIVIDUAL_CODING_PLAN_PROVIDER_IDS.has(id);
}

export function isTeamCodingPlanModelProviderId(id: string): boolean {
  return BUILTIN_TEAM_CODING_PLAN_PROVIDER_IDS.has(id);
}

export function isCodingPlanModelProviderId(id: string): boolean {
  return BUILTIN_MODEL_PROVIDER_ID_SET.has(id);
}

/** 一个正式 Model 的连通性测试结果。 */
export type ModelConnectivityResult =
  | { readonly success: true }
  | {
      readonly success: false;
      readonly error: {
        readonly message: string;
        /** 设置连接测试边界已确认的资格失败；其他执行错误保留原消息。 */
        readonly code?: "provider-unavailable" | "model-unavailable";
      };
    };
