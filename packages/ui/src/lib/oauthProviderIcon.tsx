import type { OAuthProviderId } from "@anet/shared";
import { LogInIcon } from "lucide-react";
import { cn } from "@/components/lib/utils.js";

// 当前没有内置的 OAuth 厂商，图标表为空，统一回退到通用登录图标。
// 保留 provider 参数与映射表结构，后续接入 provider 时只需在此登记素材。
const OAUTH_PROVIDER_ICON_SRC: Partial<Record<OAuthProviderId, string>> = {};

export function renderOAuthProviderIcon(provider: OAuthProviderId, className?: string) {
  const src = OAUTH_PROVIDER_ICON_SRC[provider];
  if (!src) {
    return <LogInIcon className={cn("shrink-0", className)} />;
  }

  return (
    <img src={src} alt="" aria-hidden="true" className={cn("shrink-0 object-contain", className)} />
  );
}
