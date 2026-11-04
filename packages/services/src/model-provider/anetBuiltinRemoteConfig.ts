import { downloadANetBuiltinRelease, type ANetBuiltinRelease } from "@anet/provider-node";
import type { ApiClient } from "@anet/shared";

export interface FetchANetBuiltinRemoteReleaseOptions {
  readonly apiClient: ApiClient;
  readonly endpointOrigin: string;
  readonly appVersion: string;
  readonly platform: string;
  readonly signal?: AbortSignal;
}

/** Services 仅注入既有网络装配；URL、预算与 Release 校验由 provider-node 唯一实现。 */
export async function fetchANetBuiltinRemoteRelease(
  options: FetchANetBuiltinRemoteReleaseOptions,
): Promise<ANetBuiltinRelease | null> {
  return downloadANetBuiltinRelease({
    endpointOrigin: options.endpointOrigin,
    appVersion: options.appVersion,
    platform: options.platform,
    signal: options.signal,
    request: (url, init) => options.apiClient.request(url, init),
  });
}
