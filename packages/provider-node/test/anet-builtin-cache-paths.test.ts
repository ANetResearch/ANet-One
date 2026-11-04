import { describe, expect, it } from "vitest";
import {
  createANetBuiltinEndpointKey,
  normalizeANetBuiltinEndpointOrigin,
  resolveANetBuiltinCachePaths,
  UNCONFIGURED_ANET_BUILTIN_ENDPOINT_KEY,
} from "../src/anet-builtin-cache-paths.js";

const base = {
  environmentConfigRoot: "/home/u/.anet-one/v2",
  platform: "linux-x86_64",
  appVersion: "3.17.1",
};

describe("ANet Built-in 缓存路径", () => {
  /* 本分发缺省不内置控制面地址,origin 是空串。CLI 入口每次启动都要算这个路径,
     所以这里一抛异常,终端 Agent 在缺省分发里就完全启动不了。 */
  it("未配置 origin 时给出固定缓存段,而不是抛错", () => {
    expect(() => createANetBuiltinEndpointKey("")).not.toThrow();
    expect(createANetBuiltinEndpointKey("")).toBe(UNCONFIGURED_ANET_BUILTIN_ENDPOINT_KEY);
    expect(createANetBuiltinEndpointKey("   ")).toBe(UNCONFIGURED_ANET_BUILTIN_ENDPOINT_KEY);
    const paths = resolveANetBuiltinCachePaths({ ...base, anetEndpointOrigin: "" });
    expect(paths.activeFilePath).toBe(
      `/home/u/.anet-one/v2/runtime/provider/linux-x86_64/3.17.1/${UNCONFIGURED_ANET_BUILTIN_ENDPOINT_KEY}/anet-builtin.json`,
    );
  });

  /* 缓存段的形状 endpoint-<32 位十六进制> 是既有约定
     (apps/anet-cli/packages/cli/tests/provider-runtime-env.test.ts 两处按它校验),
     未配置的那一段也必须是这个形状,同时不能和任何真实 origin 的段相撞。 */
  it("未配置段与真实段同形状,且互不相撞", () => {
    expect(UNCONFIGURED_ANET_BUILTIN_ENDPOINT_KEY).toMatch(/^endpoint-[0-9a-f]{32}$/);
    const real = createANetBuiltinEndpointKey("https://example.test");
    expect(real).toMatch(/^endpoint-[0-9a-f]{32}$/);
    expect(real).not.toBe(UNCONFIGURED_ANET_BUILTIN_ENDPOINT_KEY);
    // 任何合法 origin 规范化后都带 scheme,所以空串的摘要不可能被真实 origin 命中。
    for (const origin of [
      "http://localhost:3000",
      "https://a.example.test",
      "https://b.test:8443",
    ]) {
      expect(createANetBuiltinEndpointKey(origin)).not.toBe(UNCONFIGURED_ANET_BUILTIN_ENDPOINT_KEY);
    }
  });

  it("不同 origin 彼此隔离,同一 origin 稳定", () => {
    const a = createANetBuiltinEndpointKey("https://a.example.test");
    const b = createANetBuiltinEndpointKey("https://b.example.test");
    expect(a).not.toBe(b);
    expect(createANetBuiltinEndpointKey("https://a.example.test/")).toBe(a);
  });

  /* 下载链路仍然需要一个真实 origin,那里的严格校验不能被这次改动放宽。 */
  it("normalize 对空值与非 HTTP(S) 仍然抛错", () => {
    expect(() => normalizeANetBuiltinEndpointOrigin("")).toThrow(/不能为空/);
    expect(() => normalizeANetBuiltinEndpointOrigin("ftp://x.example.test")).toThrow(
      /只支持 HTTP\(S\)/,
    );
  });
});
