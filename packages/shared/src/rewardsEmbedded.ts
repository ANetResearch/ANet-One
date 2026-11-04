import { z } from "zod";

export const REWARDS_PARTITION = "persist:anet-rewards";
export const REWARDS_CONTEXT_EVENT = "anet-rewards-context";
export const rewardsContextSchema = z.object({
  theme: z.enum(["anet-light", "anet-dark"]),
  locale: z.enum(["zh-CN", "en-US"]),
  auth: z.object({
    status: z.enum(["ready", "anonymous"]),
    provider: z.string().min(1).nullable(),
    revision: z.number().int().nonnegative(),
  }),
});
export type RewardsContext = z.infer<typeof rewardsContextSchema>;

export function isTrustedRewardsUrl(
  value: string,
  options: { dev?: boolean; e2e?: boolean } = {},
): boolean {
  try {
    const url = new URL(value);
    if (url.username || url.password) return false;
    // 上游把自有营销站列为可信来源。本分发不内置营销页地址:可信来源只有显式配置的
    // VITE_REWARDS_WEBVIEW_ORIGIN(经 resolveRewardsOrigin 的 override 进来)、开发态和 e2e。
    const trusted =
      (options.dev === true && url.origin === "http://localhost:3000") ||
      (options.e2e === true &&
        url.protocol === "http:" &&
        ["127.0.0.1", "localhost"].includes(url.hostname));
    return (
      trusted &&
      /^\/(cn|en)\/rewards\/?$/.test(url.pathname) &&
      url.searchParams.get("embedded") === "app"
    );
  } catch {
    return false;
  }
}

export function resolveRewardsOrigin(options: {
  env: "test" | "production";
  dev?: boolean;
  override?: string;
  e2e?: boolean;
}): string {
  try {
    if (
      options.override &&
      isTrustedRewardsUrl(buildRewardsUrl(options.override, "en-US", "anet-dark"), options)
    )
      return new URL(options.override).origin;
  } catch {
    // 配置值非法时回到受信任的环境地址，不让菜单点击直接抛异常。
  }
  // 未配置即没有营销页。返回空串,入口据此不露出(见 isRewardsFeatureConfigured)。
  return "";
}

/**
 * 奖励中心是否可用。空 origin 表示本分发没有配置营销页服务端,菜单入口不应露出 ——
 * 露出但点了没反应比不露出更糟。
 */
export function isRewardsFeatureConfigured(options: {
  env: "test" | "production";
  dev?: boolean;
  override?: string;
  e2e?: boolean;
}): boolean {
  return resolveRewardsOrigin(options).length > 0;
}

export function buildRewardsUrl(
  origin: string,
  locale: string,
  theme: RewardsContext["theme"],
): string {
  if (!origin.trim()) {
    // origin 为空时 new URL 会抛错。返回空串让调用方按"不可用"处理。
    return "";
  }
  const url = new URL(`/${locale === "zh-CN" ? "cn" : "en"}/rewards`, origin);
  url.searchParams.set("embedded", "app");
  url.searchParams.set("theme", theme);
  return url.toString();
}
