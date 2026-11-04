import { requestSecurityEndpointEnv } from "./request-security-edition/index.js";

const LIVE_TEAM_SPEC = "conversation-session-r3-live-family-team.test.ts";
const LIVE_SHARE_SPEC = "conversation-session-share-ssh-artifact.test.ts";
// 这两个 live 用例跑的是真实账号,需要一个真实控制面。上游把厂商地址写死在这里;
// 本分发从环境变量读,未配置时为空 —— 没有账号也就跑不了这两个用例,这是应有的结果,
// 而不是默默指向第三方。
const PRODUCTION_E2E_PROVIDER_CONFIG_ORIGIN = process.env.ANET_E2E_LIVE_BASE_URL?.trim() ?? "";

export function getE2EProviderEndpointEnv(
  specs: readonly string[],
  providerPreset: string,
  httpMode: string,
): Record<string, string> {
  // 普通用例是否切到生产控制面只由官方版本的请求安全校验实现决定（开源版为空），
  // 公共 helper 不再复制 preset 判断，避免两处规则漂移。
  if (!isProductionAccountRun(specs)) return requestSecurityEndpointEnv(providerPreset, httpMode);
  return {
    ANET_BASE_URL: PRODUCTION_E2E_PROVIDER_CONFIG_ORIGIN,
    ANET_ENDPOINT_ORIGIN: PRODUCTION_E2E_PROVIDER_CONFIG_ORIGIN,
    // SSH 透传 ANET_ENV，因此远端与本机落在同一环境档位。
    ANET_ENV: "production",
  };
}

export function shouldUseProductionE2EProviderEndpoint(
  specs: readonly string[],
  providerPreset: string,
  httpMode: string,
): boolean {
  return Object.keys(getE2EProviderEndpointEnv(specs, providerPreset, httpMode)).length > 0;
}

function isProductionAccountRun(specs: readonly string[]): boolean {
  const names = specs.map((spec) => spec.replaceAll("\\", "/").split("/").at(-1));
  const liveSpec = names.find((name) => name === LIVE_TEAM_SPEC || name === LIVE_SHARE_SPEC);
  if (!liveSpec) return false;
  // 根因：live-team / SSH share 导入生产 JWT，默认测试域的 401 会清理 OAuth 并遮挡后续交互。
  // 生产控制面属于这个独立用例，不能扩散到同一 launcher 的其他 spec。
  if (!names.every((name) => name === liveSpec)) {
    throw new Error(
      `${liveSpec === LIVE_TEAM_SPEC ? "live-team" : "live-share"} 必须独立运行，不能与其他 spec 共用生产控制面`,
    );
  }
  return true;
}
