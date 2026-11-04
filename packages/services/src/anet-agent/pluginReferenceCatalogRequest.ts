import {
  anetProtocolMethods,
  anetPluginsReferenceCatalogResultSchema,
  type ANetPluginsReferenceCatalogParams,
} from "@anet/shared";
import type { ANetProtocolClient } from "#src/anet-agent/anetProtocolClient.js";

/** 旧协议严格校验响应；新展示字段走独立入口，只有 -32601 能证明旧 Agent 不支持。 */
export async function requestPluginReferenceCatalog(
  client: Pick<ANetProtocolClient, "request">,
  params: ANetPluginsReferenceCatalogParams,
) {
  try {
    return await client.request(
      anetProtocolMethods.pluginsReferenceCatalogWithCategory,
      params,
      anetPluginsReferenceCatalogResultSchema,
    );
  } catch (error) {
    if (!(typeof error === "object" && error !== null && "code" in error && error.code === -32601))
      throw error;
    return client.request(
      anetProtocolMethods.pluginsReferenceCatalog,
      params,
      anetPluginsReferenceCatalogResultSchema,
    );
  }
}
