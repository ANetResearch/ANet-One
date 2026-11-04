import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { EndpointScopedANetBuiltinSource } from "../src/endpoint-scoped-anet-builtin-source.js";
import { UNCONFIGURED_ANET_BUILTIN_ENDPOINT_KEY } from "../src/anet-builtin-cache-paths.js";

/* 桌面端(packages/services/src/node.ts)用的就是这个 Source,而本分发缺省
   `resolveEndpointOrigin()` 返回空串。此前 #resolveCurrent 直接走严格 normalize,
   空串即抛,桌面端在装配 Provider 配置运行时就起不来 —— 不是"刷新不可用"。 */
let roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.map((dir) => rm(dir, { force: true, recursive: true })));
  roots = [];
});

/* 用仓库里真实的随包配置,而不是手写一份 fixture:手写的 schema 一旦不对,
   read() 会因为解析失败而抛,看起来像"修法没生效",实际是 fixture 的问题。 */
const BUNDLED_FILE_PATH = fileURLToPath(
  new URL("../../../config/provider/anet-builtin.json", import.meta.url),
);

async function createRoot() {
  const dir = await mkdtemp(join(tmpdir(), "anet-endpoint-scoped-"));
  roots.push(dir);
  return { dir, bundledFilePath: BUNDLED_FILE_PATH };
}

function createSource(dir: string, bundledFilePath: string, resolveEndpointOrigin: () => string) {
  return new EndpointScopedANetBuiltinSource({
    bundledFilePath,
    environmentConfigRoot: join(dir, "config"),
    platform: "linux-x86_64",
    appVersion: "3.17.1",
    resolveEndpointOrigin,
    fetchRelease: async () => {
      throw new Error("本用例不应触发远端刷新");
    },
  });
}

describe("EndpointScopedANetBuiltinSource 在未配置控制面时", () => {
  it("read() 与 resolveActiveFilePath() 都不抛,落在固定缓存桶", async () => {
    const { dir, bundledFilePath } = await createRoot();
    const source = createSource(dir, bundledFilePath, () => "");
    try {
      await expect(source.read()).resolves.toBeTruthy();
      const active = await source.resolveActiveFilePath();
      expect(active).toContain(join("3.17.1", UNCONFIGURED_ANET_BUILTIN_ENDPOINT_KEY));
    } finally {
      source.dispose();
    }
  });

  it("配了真实 origin 时仍按 origin 分桶", async () => {
    const { dir, bundledFilePath } = await createRoot();
    const source = createSource(dir, bundledFilePath, () => "https://cp.example.test");
    try {
      const active = await source.resolveActiveFilePath();
      expect(active).toMatch(/endpoint-[0-9a-f]{32}/);
      expect(active).not.toContain(UNCONFIGURED_ANET_BUILTIN_ENDPOINT_KEY);
    } finally {
      source.dispose();
    }
  });
});
