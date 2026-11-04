import { isWebRemoteControlThemeSeed, type WebRemoteControlThemeSeed } from "@anet/shared";

export const WEB_REMOTE_CONTROL_DEFAULT_THEME: WebRemoteControlThemeSeed = "anet-dark";

function normalizeWebRemoteControlThemeSeed(
  theme: WebRemoteControlThemeSeed | string,
): WebRemoteControlThemeSeed {
  // 扫码链接与落盘偏好都可能只写 light/dark,在这里收口成带前缀的取值。
  if (theme === "dark") return "anet-dark";
  if (theme === "light") return "anet-light";
  return theme as WebRemoteControlThemeSeed;
}

export function resolveWebRemoteControlInitialTheme({
  storedTheme,
  qrTheme,
  defaultTheme = WEB_REMOTE_CONTROL_DEFAULT_THEME,
}: {
  storedTheme?: string | null;
  qrTheme?: string | null;
  defaultTheme?: WebRemoteControlThemeSeed;
}): WebRemoteControlThemeSeed {
  if (isWebRemoteControlThemeSeed(storedTheme)) {
    return normalizeWebRemoteControlThemeSeed(storedTheme);
  }

  if (isWebRemoteControlThemeSeed(qrTheme)) {
    return normalizeWebRemoteControlThemeSeed(qrTheme);
  }

  return normalizeWebRemoteControlThemeSeed(defaultTheme);
}

export function seedWebRemoteControlThemePreference(qrTheme?: string | null): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  const storedTheme = localStorage.getItem("anet-theme");
  const resolvedTheme = resolveWebRemoteControlInitialTheme({ storedTheme, qrTheme });
  if (!storedTheme && isWebRemoteControlThemeSeed(qrTheme)) {
    // Bugfix: 手机远控首次打开原来只用 Web 默认主题，无法继承扫码时桌面端主题。
    // 这里只在手机本地还没有主题偏好时写入一次，后续手机改主题不会反向影响桌面端。
    localStorage.setItem("anet-theme", resolvedTheme);
  }
}
