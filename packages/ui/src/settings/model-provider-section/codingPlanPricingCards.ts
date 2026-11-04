import { resolveModelProviderFamilySpecByProviderId } from "@anet/shared";
import type { CodingPlanProviderId } from "@/settings/model-provider-section/constants.js";

// 死代码清理：原生购买组件 CodingPlanPricingCards 及其配套 resolver 已随
// CodingPlanPurchasePanel 一起下线（购买流程切换为内嵌官网 webview）。
// 本文件仅保留仍被设置页使用的登录参数类型与套餐商品源解析。

export type CodingPlanLoginOptions = {
  forceOAuth?: boolean;
};

export function resolveCodingPlanUpgradeProductsProviderId(
  providerId: CodingPlanProviderId,
): CodingPlanProviderId {
  // Start Plan 是免费入口，编程套餐列表应直接展示同 family 的付费个人 Coding Plan。
  // 继续用 Start Plan providerId 会把免费 Start SKU 当成可购买套餐重复展示。
  const spec = resolveModelProviderFamilySpecByProviderId(providerId);
  return spec && providerId === spec.startPlanProviderId
    ? spec.individualCodingPlanProviderId
    : providerId;
}
