import { buildANetEndpointUrls, DEFAULT_ANET_ENDPOINT_ORIGIN } from "@anet/shared";

interface WebImportMetaEnv {
  VITE_DEV_ORIGIN?: string;
  VITE_ANET_BASE_URL?: string;
  VITE_ANET_ENDPOINT_ORIGIN?: string;
  VITE_WEB_REMOTE_ALLOW_DEV_RETURN_TO?: string;
}

export interface WebOAuthConfig {
  redirectUri: string;
  devOrigin?: string;
  shareRedirectUri: string;
  allowDevReturnToRedirect: boolean;
}

export function createWebOAuthConfig(env: WebImportMetaEnv = {}): WebOAuthConfig {
  const devOrigin = env.VITE_DEV_ORIGIN?.trim().replace(/\/$/, "");
  const anetEndpointUrls = buildANetEndpointUrls(
    env.VITE_ANET_BASE_URL?.trim() ||
      env.VITE_ANET_ENDPOINT_ORIGIN?.trim() ||
      DEFAULT_ANET_ENDPOINT_ORIGIN,
  );

  return {
    redirectUri: anetEndpointUrls.webRemoteCallbackUrl,
    shareRedirectUri: anetEndpointUrls.webShareCallbackUrl,
    ...(devOrigin ? { devOrigin } : {}),
    allowDevReturnToRedirect: env.VITE_WEB_REMOTE_ALLOW_DEV_RETURN_TO === "true",
  };
}

const env = ((import.meta as ImportMeta & { env?: WebImportMetaEnv }).env ??
  {}) as WebImportMetaEnv;

export const WEB_OAUTH_CONFIG: WebOAuthConfig = createWebOAuthConfig(env);

export function resolveWebAuthDevReturnTo(
  config: WebOAuthConfig,
  surface: "remote" | "share" = "remote",
): string | undefined {
  return config.devOrigin
    ? `${config.devOrigin}/${surface === "share" ? "share/callback" : "remote/v4"}`
    : undefined;
}
