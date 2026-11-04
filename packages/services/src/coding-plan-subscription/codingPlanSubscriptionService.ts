import {
  applyDynamicWorkflowUserMode,
  resolveDynamicWorkflowClientConfig,
  DEFAULT_ANET_MODEL_CONTEXT_BUDGET_STRATEGY,
  type ApiClient,
} from "@anet/shared";
import type { ICredentialService } from "../credential/credential.js";
import type { ICodingPlanSubscriptionService } from "./codingPlanSubscription.js";
import type { ModelSelectionView } from "@anet/provider";

interface CodingPlanSubscriptionServiceDependencies {
  apiClient: ApiClient;
  credentialService: Pick<ICredentialService, "load">;
  resolveOffPeakModelSelectionView?: () => Promise<ModelSelectionView>;
  /**
   * 用户在设置里选的动态工作流模式（launch.md「The user's choice」）。只有拥有设置权威的装配
   * （desktop 本地 Host、web/standalone server）注入；缺省时快照只含服务端的「提供」。
   */
  resolveDynamicWorkflowUserMode?: () => Promise<unknown>;
}

/**
 * 本分发不内置任何套餐订阅供应方，没有可调用的远端订阅/支付服务。
 * 读类方法返回空值（空商品表、无折扣、无待支付订单、不支持 PayPal 等），
 * 让设置页与入口判定走"无套餐"分支；写类方法（下单、签约、绑卡、支付等）
 * 没有可执行的后端，直接抛错，不伪造成功结果。
 *
 * 接口签名保持不变，调用方无需分支。接入自建订阅服务时，在此替换为真实实现。
 * 代价：闲时任务、强制更新、请求校验等原先随远端 client/configs 下发的配置
 * 不再有来源，一律取关闭/缺省值。
 */
const UNAVAILABLE_MESSAGE = "Coding plan subscription is unavailable in this distribution";

function unavailable(): Promise<never> {
  return Promise.reject(new Error(UNAVAILABLE_MESSAGE));
}

export function createCodingPlanSubscriptionService(
  dependencies: CodingPlanSubscriptionServiceDependencies,
): ICodingPlanSubscriptionService {
  return {
    batchPreview: async () => ({ productList: [], isSubscribed: false, isAuthenticated: null }),
    getStaticProducts: async () => ({}),
    getStaticTeamProducts: async () => ({}),
    getStartPlanPreview: async () => null,
    getManualClaimPlanPreviews: async () => ({ plans: [] }),
    claimManualPlan: async () => ({ success: false, code: -1, message: UNAVAILABLE_MESSAGE }),
    getOffPeakClientConfig: async () => ({
      enabled: false,
      modelSelectionView: (await dependencies.resolveOffPeakModelSelectionView?.()) ?? {
        revision: 0,
        providers: [],
      },
    }),
    // 灰度模式只剩本地覆盖（ANET_DYNAMIC_WORKFLOW_MODE）与缺省值两个来源，
    // 用户选择仍套到"提供"上；规则只写在 shared 的 applyDynamicWorkflowUserMode 里。
    getDynamicWorkflowClientConfig: async () => {
      const offer = resolveDynamicWorkflowClientConfig({ remote: undefined, env: process.env });
      const resolveUserMode = dependencies.resolveDynamicWorkflowUserMode;
      return resolveUserMode ? applyDynamicWorkflowUserMode(offer, await resolveUserMode()) : offer;
    },
    getModelContextBudgetStrategy: async () => DEFAULT_ANET_MODEL_CONTEXT_BUDGET_STRATEGY,
    getBillingDiscount: async () => undefined,
    getRequestVerificationConfig: async () => null,
    getForceUpdateConfig: async () => null,
    productInfo: unavailable,
    preview: unavailable,
    createSign: unavailable,
    updateSign: unavailable,
    checkPayment: unavailable,
    checkPendingOrders: async () => ({ hasPendingOrders: false }),
    queryStripeCards: async () => [],
    bindStripeCard: unavailable,
    unbindStripeCard: unavailable,
    payStripe: unavailable,
    checkPaypalSupport: async () => ({ isSupport: false }),
    createPaypalSetupToken: unavailable,
    subscribePaypal: unavailable,
    getEnterprisePricing: async () => ({ productList: [] }),
    getEnterpriseBalance: async () => ({ giveBalance: 0, cashBalance: 0, totalBalance: 0 }),
    calculateEnterpriseOrder: unavailable,
    createEnterpriseOrder: unavailable,
    getEnterprisePendingOrders: async () => [],
    cancelEnterpriseOrder: unavailable,
    continueEnterpriseOrderPayment: unavailable,
    checkEnterpriseOrderStatus: unavailable,
  };
}
