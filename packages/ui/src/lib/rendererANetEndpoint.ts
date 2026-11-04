import { buildRuntimeANetEndpointUrls, ANET_ENV, type RuntimeANetEndpointEnv } from "@anet/shared";

interface RendererImportMetaEnv {
  VITE_ANET_BASE_URL?: string;
  VITE_ANET_ENDPOINT_ORIGIN?: string;
}

function readRendererImportMetaEnv(): RendererImportMetaEnv {
  return ((import.meta as ImportMeta & { env?: RendererImportMetaEnv }).env ??
    {}) as RendererImportMetaEnv;
}

export function createRendererANetEndpointEnv(
  env: RendererImportMetaEnv = readRendererImportMetaEnv(),
): RuntimeANetEndpointEnv {
  return {
    ANET_ENV,
    // UI 侧的 anet-plan 占位 provider 以前只看 ANET_ENV，
    // 没有消费 Vite 注入的 base url，导致自定义测试域名时 renderer 和 host/service 可能不一致。
    ANET_BASE_URL: env.VITE_ANET_BASE_URL,
    ANET_ENDPOINT_ORIGIN: env.VITE_ANET_ENDPOINT_ORIGIN,
  };
}

export const RENDERER_ANET_ENDPOINT_URLS = buildRuntimeANetEndpointUrls(
  createRendererANetEndpointEnv(),
);
