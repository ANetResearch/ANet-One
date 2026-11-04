import { describe, expect, it } from "vitest";
import {
  DEFAULT_ENABLED_OFFICIAL_PLUGIN_IDS,
  OFFICIAL_PLUGIN_DEFINITIONS,
  VENDOR_HOSTED_OFFICIAL_PLUGIN_NAMES,
} from "../src/app/official-plugin-definitions.js";

// 三个上游插件原本默认启用,而它们的功能都发生在上游厂商的服务端:
// image-search 把搜索词发往 ${ANET_BASE_URL}/api/v1/mcp/server/image_search,
// anet-site 把站点部署到上游托管,anet-guide 打开上游产品文档。
// 本发行版不做上游登录,前两者既无法认证又会把内容带出本机。
// 这三个名字在测试里写死,不从 VENDOR_HOSTED_OFFICIAL_PLUGIN_NAMES 取。
// 从被测常量取的写法挡不住"从名单里漏掉一项":漏掉 image-search 的同时也漏掉了对
// 它的检查,断言照样通过(2026-11-02 用 mutation testing 发现)。
const MUST_NOT_DEFAULT_ENABLE = ["image-search", "anet-site", "anet-guide"] as const;

describe("默认启用名单", () => {
  it("不含依赖上游服务端的插件", () => {
    for (const name of MUST_NOT_DEFAULT_ENABLE) {
      const matched = [...DEFAULT_ENABLED_OFFICIAL_PLUGIN_IDS].filter((id) =>
        id.startsWith(`${name}@`),
      );
      expect(matched, `${name} 不应默认启用`).toEqual([]);
    }
  });

  it("剔除名单覆盖了上面写死的每一项", () => {
    for (const name of MUST_NOT_DEFAULT_ENABLE) {
      expect(VENDOR_HOSTED_OFFICIAL_PLUGIN_NAMES, `${name} 不在剔除名单里`).toContain(name);
    }
  });

  it("剔除名单里的每一项都确实是上游定义里存在且原本默认启用的插件", () => {
    // 否则改名或上游删插件后,名单会静默变成一串无效字符串,而测试照样通过。
    for (const name of VENDOR_HOSTED_OFFICIAL_PLUGIN_NAMES) {
      const definition = OFFICIAL_PLUGIN_DEFINITIONS.find(
        (candidate) => candidate.name === name,
      );
      expect(definition, `上游定义里没有 ${name}`).toBeDefined();
      expect(definition?.defaultEnabled, `${name} 本来就不是默认启用,无需剔除`).toBe(true);
    }
  });

  it("其余原本默认启用的插件仍然默认启用", () => {
    const expected = OFFICIAL_PLUGIN_DEFINITIONS.filter(
      (definition) =>
        definition.defaultEnabled && !VENDOR_HOSTED_OFFICIAL_PLUGIN_NAMES.includes(definition.name),
    );
    expect(expected.length).toBeGreaterThan(0);
    expect(DEFAULT_ENABLED_OFFICIAL_PLUGIN_IDS.size).toBe(expected.length);
    for (const definition of expected) {
      const present = [...DEFAULT_ENABLED_OFFICIAL_PLUGIN_IDS].some((id) =>
        id.startsWith(`${definition.name}@`),
      );
      expect(present, `${definition.name} 应保持默认启用`).toBe(true);
    }
  });
});
