import { DEFAULT_ANET_ENDPOINT_ORIGIN } from "./anetEndpoint.js";

export const ANET_SOURCE_HEADERS = {
  "User-Agent": "ANet/unknown",
  "HTTP-Referer": DEFAULT_ANET_ENDPOINT_ORIGIN,
  "X-Title": "ANet One@electron",
} as const;

export interface BuildANetSourceHeadersFromContextOptions {
  appVersion?: string;
  arch?: string;
  clientLanguage?: string;
  clientTimezone?: string;
  deviceMid?: string;
  endpointOrigin?: string;
  osVersion?: string;
  platform?: string;
  releaseChannel?: string;
  sourceTitle?: string;
}

export function normalizeANetSourceHeaderValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || !/^[\x20-\x7e]+$/.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

export function buildANetSourceHeadersFromContext(
  options: BuildANetSourceHeadersFromContextOptions = {},
): Record<string, string> {
  const appVersion = normalizeANetSourceHeaderValue(options.appVersion);
  const arch = normalizeANetSourceHeaderValue(options.arch);
  const clientLanguage = normalizeANetSourceHeaderValue(options.clientLanguage) ?? "unknown";
  const clientTimezone = normalizeANetSourceHeaderValue(options.clientTimezone) ?? "unknown";
  const deviceMid = normalizeANetSourceHeaderValue(options.deviceMid);
  const endpointOrigin =
    normalizeANetSourceHeaderValue(options.endpointOrigin) ?? DEFAULT_ANET_ENDPOINT_ORIGIN;
  const osVersion = normalizeANetSourceHeaderValue(options.osVersion);
  const platform = normalizeANetSourceHeaderValue(options.platform);
  const releaseChannel = normalizeANetSourceHeaderValue(options.releaseChannel);
  const sourceTitle = normalizeANetSourceHeaderValue(options.sourceTitle) ?? "electron";

  return {
    ...ANET_SOURCE_HEADERS,
    "HTTP-Referer": endpointOrigin,
    "User-Agent": `ANet/${appVersion ?? "unknown"}`,
    ...(appVersion ? { "X-ANet-App-Version": appVersion } : {}),
    "X-Title": `ANet One@${sourceTitle}`,
    ...(platform && arch ? { "X-Platform": `${platform}-${arch}` } : {}),
    ...(releaseChannel ? { "X-Release-Channel": releaseChannel } : {}),
    "X-Client-Language": clientLanguage,
    "X-Client-Timezone": clientTimezone,
    ...(platform ? { "X-Os-Category": normalizeOsCategory(platform) } : {}),
    ...(osVersion ? { "X-Os-Version": osVersion } : {}),
    ...(deviceMid ? { "X-Device-Mid": deviceMid } : {}),
  };
}

function normalizeOsCategory(platform: string): string {
  switch (platform) {
    case "darwin":
      return "macos";
    case "win32":
      return "windows";
    default:
      return "linux";
  }
}
