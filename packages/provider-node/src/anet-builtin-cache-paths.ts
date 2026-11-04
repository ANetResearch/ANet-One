import { createHash } from "node:crypto";
import { join } from "node:path";

export function resolveANetBuiltinClientPlatform(): string {
  const target = process.platform === "win32" ? "windows" : process.platform;
  const arch =
    process.arch === "arm64" ? "aarch64" : process.arch === "x64" ? "x86_64" : process.arch;
  return `${target}-${arch}`;
}

export interface ANetBuiltinCachePathOptions {
  readonly environmentConfigRoot: string;
  readonly platform: string;
  readonly appVersion: string;
  readonly anetEndpointOrigin: string;
}

export interface ANetBuiltinCachePaths {
  readonly activeFilePath: string;
  readonly controlFilePath: string;
}

/** 按平台与 App 版本隔离 Active/LKG；路径本身就是兼容范围。 */
export function resolveANetBuiltinCachePaths(
  options: ANetBuiltinCachePathOptions,
): ANetBuiltinCachePaths {
  const platform = normalizeSegment(options.platform, "platform");
  const appVersion = normalizeSegment(options.appVersion, "appVersion");
  const endpointKey = createANetBuiltinEndpointKey(options.anetEndpointOrigin);
  const directory = join(
    options.environmentConfigRoot,
    "runtime",
    "provider",
    platform,
    appVersion,
    endpointKey,
  );
  return {
    activeFilePath: join(directory, "anet-builtin.json"),
    controlFilePath: join(directory, "anet-builtin-refresh.json"),
  };
}

function endpointDigestKey(normalizedOrigin: string): string {
  const digest = createHash("sha256").update(normalizedOrigin).digest("hex").slice(0, 32);
  return `endpoint-${digest}`;
}

/**
 * 未配置控制面时用的缓存段。
 *
 * 本分发缺省不内置任何产品服务端地址,`resolveRuntimeANetEndpointOrigin` 返回空串。
 * 此前 `createANetBuiltinEndpointKey` 对空串直接抛 `ANet Built-in Endpoint Origin
 * 不能为空`,而 CLI 入口(`provider-runtime-env.ts`)每次启动都要算这个路径,于是
 * 终端 Agent 在缺省分发里根本起不来 —— 不是"该功能不可用",是整个进程启不动。
 *
 * 取空串的 sha256 段,而不是一个可读的字面量:缓存段的形状(`endpoint-<32 位
 * 十六进制>`)是对外的既有约定,`provider-runtime-env.test.ts` 两处断言都按这个形状
 * 校验。空串不是任何合法 origin 的规范化结果(合法 origin 必带 scheme),所以这个段
 * 不会和任何已配置控制面的段相撞。
 */
export const UNCONFIGURED_ANET_BUILTIN_ENDPOINT_KEY = endpointDigestKey("");

/** 将 ANet 控制面 Origin 规范化后映射为安全、稳定且碰撞风险可忽略的缓存路径段。 */
export function createANetBuiltinEndpointKey(anetEndpointOrigin: string): string {
  if (!anetEndpointOrigin.trim()) return UNCONFIGURED_ANET_BUILTIN_ENDPOINT_KEY;
  return endpointDigestKey(normalizeANetBuiltinEndpointOrigin(anetEndpointOrigin));
}

export function normalizeANetBuiltinEndpointOrigin(value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error("ANet Built-in Endpoint Origin 不能为空");
  const url = new URL(normalized);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("ANet Built-in Endpoint Origin 只支持 HTTP(S)");
  }
  return url.origin;
}

function normalizeSegment(value: string, name: string): string {
  const normalized = value.trim();
  if (!normalized || normalized === "." || normalized === ".." || /[\\/]/u.test(normalized)) {
    throw new Error(`ANet Built-in ${name} 不是合法路径段`);
  }
  return normalized;
}
