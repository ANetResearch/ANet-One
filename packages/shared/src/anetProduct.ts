/**
 * 本分发对外露出的产品标识与链接。
 *
 * 上游把产品名、下载页、文档页、插件图标 CDN 分散写死在十几个文件里，指向
 * 上游自有域名与其 CDN。这里集中一份,改发布渠道时只改这一处;同时让
 * "有没有漏改" 可以被一条检查机械判定(见 packages/shared/test/noVendorEndpoints.test.ts)。
 */
export const ANET_PRODUCT_NAME = "ANet One";
export const ANET_PRODUCT_REPO_URL = "https://github.com/ANetResearch/ANet-One";
export const ANET_PRODUCT_RELEASES_URL = `${ANET_PRODUCT_REPO_URL}/releases`;
export const ANET_PRODUCT_DOCS_URL = `${ANET_PRODUCT_REPO_URL}/blob/main/README.md`;

/** 本分发内置的 LLM 渠道:填 token 即连。它是服务地址,不是厂商主页。 */
export const ANET_TOKEN_SERVICE_URL = "https://token.anet.chat";

/**
 * 插件图标的静态资源基址。
 *
 * 上游写死其自有 CDN:用户每次打开插件列表或建议提示卡片,都会把 IP 和
 * 正在浏览哪些插件告诉该 CDN。本分发默认留空 —— 空值表示不取远端图标,UI 回落到
 * 本地占位图标。要自建图标站就设置 ANET_PLUGIN_ASSETS_BASE_URL。
 */
export function resolvePluginAssetsBaseUrl(env: Record<string, string | undefined> = {}): string {
  return env.ANET_PLUGIN_ASSETS_BASE_URL?.trim() ?? "";
}

/**
 * 拼插件图标 URL。基址未配置时返回 undefined,调用方按"没有图标"处理,
 * 而不是拼出一个指向第三方 CDN 的地址。
 */
export function buildPluginAssetUrl(
  relativePath: string,
  env: Record<string, string | undefined> = {},
): string | undefined {
  const base = resolvePluginAssetsBaseUrl(env);
  if (!base) {
    return undefined;
  }
  return `${base.replace(/\/+$/, "")}/${relativePath.replace(/^\/+/, "")}`;
}
