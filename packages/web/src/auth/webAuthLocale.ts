import type { WebOAuthProviderId } from "./browserOAuthCredentialRepo.js";

type WebAuthLocale = "zh-CN" | "en-US";

interface WebAuthPageCopy {
  brand: string;
  loginTitle: string;
  loginDescription: string;
  loginAction: (provider: WebOAuthProviderId) => string;
  loginUnavailable: string;
  callbackTitle: string;
  callbackDescription: string;
  callbackErrorTitle: string;
  callbackErrorDescription: string;
  retryAction: string;
}

const WEB_AUTH_COPY = {
  "zh-CN": {
    brand: "ANet",
    loginTitle: "登录后继续使用 Web 远程控制",
    loginDescription: "请使用与电脑端相同的登录方式和账号。",
    loginAction: (provider) => `使用 ${provider} 登录`,
    loginUnavailable: "当前构建未接入任何登录方式。",
    callbackTitle: "正在完成登录",
    callbackDescription: "请稍候，正在校验账号身份。",
    callbackErrorTitle: "登录失败",
    callbackErrorDescription: "授权流程未完成，请重新登录。",
    retryAction: "重新登录",
  },
  "en-US": {
    brand: "ANet",
    loginTitle: "Sign In To Continue",
    loginDescription: "Use the same sign-in method and account as on your computer.",
    loginAction: (provider) => `Sign in with ${provider}`,
    loginUnavailable: "No sign-in method is available in this build.",
    callbackTitle: "Finishing Sign-In",
    callbackDescription: "Verifying your account identity.",
    callbackErrorTitle: "Sign-In Failed",
    callbackErrorDescription: "The authorization flow did not complete. Sign in again.",
    retryAction: "Sign In Again",
  },
} satisfies Record<WebAuthLocale, WebAuthPageCopy>;

function resolveWebAuthLocale(language?: string): WebAuthLocale {
  const candidate =
    language ??
    document.documentElement.lang ??
    navigator.language ??
    navigator.languages?.[0] ??
    "";

  return candidate.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
}

export function getWebAuthCopy(locale: WebAuthLocale = resolveWebAuthLocale()): WebAuthPageCopy {
  return WEB_AUTH_COPY[locale];
}
