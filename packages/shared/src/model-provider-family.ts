import type { OAuthProviderId } from "./oauth.js";

/**
 * Provider family:一个账号连接下成组出现的内置 Provider(Start Plan、个人/团队 Coding Plan)。
 *
 * 上游在这里注册了两家厂商的 family,每个 family 把厂商的 OAuth provider、套餐 provider
 * 和套餐管理页绑在一起。本分发不内置任何厂商,因此注册表为空:机制保留,条目为零。
 * 自建或二次分发要接入自己的账号体系时,在启动早期调一次
 * `registerModelProviderFamilySpecs()`,下面所有查询函数都按注册表工作,
 * 不含任何按厂商写死的分支。
 *
 * 取值类型放宽为 string 而不是厂商 id 的联合类型:注册表为空时联合类型会退化为 never,
 * 所有调用点都会因为"不可能存在的取值"而无法通过类型检查。
 */
export type ModelProviderFamilyId = string;
export type ProviderFamilyDomain = ModelProviderFamilyId;

export interface ModelProviderFamilySpec {
  id: ModelProviderFamilyId;
  label: string;
  /** 该 family 账号所在的根域名;用于按 baseURL 反查 family。 */
  rootDomain: string;
  oauthProviderId: OAuthProviderId | string;
  startPlanProviderId: string;
  individualCodingPlanProviderId: string;
  teamCodingPlanProviderId: string;
  /** 团队套餐管理页;留空即不露出该入口。 */
  teamCodingPlanManageUrl: string;
}

/**
 * 注册表本体。导出的是同一个数组实例的只读视图,不是副本 —— 注册新家族时就地改写
 * 这个实例的内容,所以在模块加载期就持有该引用的调用方(本包内外都有)不需要重新取。
 */
const SPECS: ModelProviderFamilySpec[] = [];

export const MODEL_PROVIDER_FAMILY_SPECS: readonly ModelProviderFamilySpec[] = SPECS;

const REGISTRY_LISTENERS = new Set<() => void>();

/**
 * 注册 provider family。本分发注册表为空,二次分发在启动早期调一次即可接入自己的
 * 账号体系。
 *
 * 为什么需要这个函数:注册表的派生物(按 id 查、按 providerId 反查、各套餐 provider id
 * 集合、off-peak/highspeed 映射、OAuth 凭据键、provider 预置表,共 8 处)原先都在**模块
 * 加载时**从注册表求值。注册表那时必然是空的,于是"往 SPECS 里加一条"对所有查询函数
 * 都不起作用 —— 本文件注释声明的扩展方式实际上不成立。现在改为:注册表就地改写,
 * 并通知每个派生物就地重建自己的 Set/Map/数组。派生物的实例不变,所以消费方一行都
 * 不用改;变的只是内容。
 *
 * 该函数替换整张表,不是追加。多次调用后生效的是最后一次,这样测试与二次分发都能
 * 把注册表恢复到确定状态,而不是叠加上一次的残留。
 */
export function registerModelProviderFamilySpecs(specs: readonly ModelProviderFamilySpec[]): void {
  SPECS.length = 0;
  SPECS.push(...specs);
  for (const listener of REGISTRY_LISTENERS) listener();
}

/**
 * 订阅注册表变化,并立即跑一次 —— 注册表派生物用它建立自己。
 *
 * 回调的职责是**就地重建**自己持有的那个集合,不能换成新实例:换实例会让已经持有旧
 * 引用的消费方永远看到旧内容,那正是本次要修的问题。
 */
export function onModelProviderFamilyRegistryChange(rebuild: () => void): () => void {
  REGISTRY_LISTENERS.add(rebuild);
  rebuild();
  return () => REGISTRY_LISTENERS.delete(rebuild);
}

const MODEL_PROVIDER_FAMILY_SPEC_BY_ID = new Map<ModelProviderFamilyId, ModelProviderFamilySpec>();

const MODEL_PROVIDER_FAMILY_ID_BY_PROVIDER_ID = new Map<string, ModelProviderFamilyId>();

onModelProviderFamilyRegistryChange(() => {
  MODEL_PROVIDER_FAMILY_SPEC_BY_ID.clear();
  MODEL_PROVIDER_FAMILY_ID_BY_PROVIDER_ID.clear();
  for (const spec of SPECS) {
    MODEL_PROVIDER_FAMILY_SPEC_BY_ID.set(spec.id, spec);
    for (const providerId of [
      spec.startPlanProviderId,
      spec.individualCodingPlanProviderId,
      spec.teamCodingPlanProviderId,
    ]) {
      MODEL_PROVIDER_FAMILY_ID_BY_PROVIDER_ID.set(providerId, spec.id);
    }
  }
});

/**
 * 按 id 取 family。注册表里没有就返回 null。
 *
 * 上游这里用 `!` 断言必然存在,因为两家厂商的 family 是写死的。注册表可以为空之后,
 * 断言会让调用方拿到一个假装是 spec 的 undefined,在访问字段时才炸在别处 ——
 * 因此改为显式返回 null,由调用方决定"没有 family"时怎么显示。
 */
export function getModelProviderFamilySpec(
  familyId: ModelProviderFamilyId,
): ModelProviderFamilySpec | null {
  return MODEL_PROVIDER_FAMILY_SPEC_BY_ID.get(familyId) ?? null;
}

export function resolveModelProviderFamilyIdByProviderId(
  providerId: string,
): ModelProviderFamilyId | null {
  return MODEL_PROVIDER_FAMILY_ID_BY_PROVIDER_ID.get(providerId) ?? null;
}

export function resolveModelProviderFamilyIdByBaseURL(
  baseURL: string | null | undefined,
): ModelProviderFamilyId | null {
  const trimmed = baseURL?.trim();
  if (!trimmed) {
    return null;
  }
  let hostname: string;
  try {
    hostname = new URL(trimmed).hostname.toLowerCase();
  } catch {
    return null;
  }
  for (const spec of MODEL_PROVIDER_FAMILY_SPECS) {
    if (hostname === spec.rootDomain || hostname.endsWith(`.${spec.rootDomain}`)) {
      return spec.id;
    }
  }
  return null;
}

export function resolveModelProviderFamilySpecByProviderId(
  providerId: string,
): ModelProviderFamilySpec | null {
  const familyId = resolveModelProviderFamilyIdByProviderId(providerId);
  return familyId ? getModelProviderFamilySpec(familyId) : null;
}

export function resolveModelProviderFamilyLabelByProviderId(providerId: string): string | null {
  return resolveModelProviderFamilySpecByProviderId(providerId)?.label ?? null;
}

/** 只认已注册的 family id;未注册或空值返回 null。 */
export function normalizeProviderFamilyDomain(
  value: string | null | undefined,
): ProviderFamilyDomain | null {
  if (!value) {
    return null;
  }
  return MODEL_PROVIDER_FAMILY_SPEC_BY_ID.has(value) ? value : null;
}

/** 按注册表反查 OAuth provider 属于哪个 family;上游此处是按厂商 id 写死的两条分支。 */
export function resolveProviderFamilyDomainFromOAuthProvider(
  provider: OAuthProviderId | string | null | undefined,
): ProviderFamilyDomain | null {
  if (!provider) {
    return null;
  }
  for (const spec of MODEL_PROVIDER_FAMILY_SPECS) {
    if (spec.oauthProviderId === provider) {
      return spec.id;
    }
  }
  return null;
}

export function shouldShowModelProviderFamilyForDomain(params: {
  familyId: ModelProviderFamilyId;
  providerFamilyDomain: ProviderFamilyDomain | null | undefined;
}): boolean {
  const providerFamilyDomain = normalizeProviderFamilyDomain(params.providerFamilyDomain);
  if (!providerFamilyDomain) {
    return true;
  }
  return params.familyId === providerFamilyDomain;
}

export function shouldShowModelProviderFamilyForActiveOAuth(params: {
  familyId: ModelProviderFamilyId;
  activeOAuthProvider: OAuthProviderId | null | undefined;
}): boolean {
  return shouldShowModelProviderFamilyForDomain({
    familyId: params.familyId,
    providerFamilyDomain: resolveProviderFamilyDomainFromOAuthProvider(params.activeOAuthProvider),
  });
}

export function shouldShowBuiltinModelProviderForDomain(params: {
  providerId: string;
  providerFamilyDomain: ProviderFamilyDomain | null | undefined;
}): boolean {
  const familyId = resolveModelProviderFamilyIdByProviderId(params.providerId);
  if (!familyId) {
    return true;
  }
  return shouldShowModelProviderFamilyForDomain({
    familyId,
    providerFamilyDomain: params.providerFamilyDomain,
  });
}

export function shouldShowBuiltinModelProviderForActiveOAuth(params: {
  providerId: string;
  activeOAuthProvider: OAuthProviderId | null | undefined;
}): boolean {
  return shouldShowBuiltinModelProviderForDomain({
    providerId: params.providerId,
    providerFamilyDomain: resolveProviderFamilyDomainFromOAuthProvider(params.activeOAuthProvider),
  });
}
