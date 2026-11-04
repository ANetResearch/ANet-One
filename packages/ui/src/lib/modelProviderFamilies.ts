import { MODEL_PROVIDER_FAMILY_SPECS, type ModelProviderFamilySpec } from "@anet/shared";

/**
 * 已注册的 provider family 列表，类型放宽为 `readonly ModelProviderFamilySpec[]`。
 *
 * 这里是对共享层那个数组实例的再导出，不是副本 —— `registerModelProviderFamilySpecs()`
 * 就地改写该实例，所以此处无需重新取值。
 * 原因：共享层的常量以 `as const` 声明，元素类型随注册内容变化；列表为空时元素类型退化为 never，
 * 遍历处访问字段会无法通过类型检查。UI 统一经此处读取，保证零个、一个或多个 family 时写法一致。
 */
export const PROVIDER_FAMILY_SPECS: readonly ModelProviderFamilySpec[] =
  MODEL_PROVIDER_FAMILY_SPECS;
