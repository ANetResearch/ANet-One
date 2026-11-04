import { describe, expect, it } from "vitest";
import { DEFAULT_PLUGIN_MARKETPLACES } from "@anet/shared";

/* 单独一个文件:DEFAULT_PLUGIN_MARKETPLACES 在 import 时求值,而 plugins.test.ts 用
   vi.hoisted 把 ANET_OFFICIAL_PLUGIN_MARKETPLACE_SOURCE 设成了一个测试地址。
   vitest 默认按文件隔离模块注册表,所以这里拿到的是"没配置"那一份。
   本分发留空 source 是刻意的:刷新一次官方插件清单就会把用户 IP 和版本告诉那个远端,
   并允许它改写清单内容。回落到任何默认域名都必须让这条用例失败。 */
describe("官方插件市场的缺省 source", () => {
  it("未配置环境变量时为空字符串,不指向任何远端", () => {
    expect(process.env.ANET_OFFICIAL_PLUGIN_MARKETPLACE_SOURCE).toBeUndefined();
    const official = DEFAULT_PLUGIN_MARKETPLACES.find(
      (marketplace) => marketplace.id === "anet-plugins-official",
    );
    expect(official).toBeDefined();
    expect(official?.source).toBe("");
  });

  it("Claude 官方市场仍用 catalog 名而不是 URL", () => {
    const claude = DEFAULT_PLUGIN_MARKETPLACES.find(
      (marketplace) => marketplace.id === "claude-plugins-official",
    );
    expect(claude?.source).toBe("anthropics/claude-plugins-official");
  });
});
