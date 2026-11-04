// 登录入口门禁此前没有任何测试覆盖（全仓 1763 个测试文件里没有一个引用
// shouldOpenLoginEntry 或 useProviderAvailabilityLoginEntryGuard）。
//
// 位置：packages/ui/src/root/useProviderAvailabilityLoginEntryGuard.ts。
// 行为：判据原为 `!providerFamilyDomain || (!user && !hasUsableProvider)`。
//   providerFamilyDomain 的取值被 zod 限定为已注册的 provider family
//   (packages/shared/src/validationAppSettings.ts)。
// 影响：用自建网关（base_url + api_key）的用户没有可填的 providerFamilyDomain，
//   于是无论 provider 多么可用，每次启动都被强制弹回 WelcomeScreen，
//   canRestoreWorkspaceSession 一并被阻断。
// 发现方式：2026-11-02 测绘改造面时，provider 面把"新增模板"评为低风险，
//   登录面给出了这个门的判据，两面没有互相引用；核对后确认只做模板不改门
//   在端到端上不成立。
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../../..");

function source(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

describe("登录入口门禁", () => {
  it("判据只看是否有可用 provider，不看选过哪家厂商", () => {
    const src = source("packages/ui/src/root/useProviderAvailabilityLoginEntryGuard.ts");
    const line = src.split("\n").find((l) => l.includes("const shouldOpenLoginEntry"));
    expect(line, "找不到 shouldOpenLoginEntry 的赋值").toBeTruthy();
    expect(
      line!.trim(),
      "判据被改回依赖 providerFamilyDomain —— 自建网关的用户会被每次启动的登录门挡住",
    ).toBe("const shouldOpenLoginEntry = !user && !hasUsableProvider;");
  });
});
