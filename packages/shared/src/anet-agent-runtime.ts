export type ANetAgentBinaryKind = "native-binary";

export interface ANetAgentRuntimeDescriptor {
  binaryKind: ANetAgentBinaryKind;
  binaryEnvVar: string;
  bundledResourceDir: string;
  version: string;
  spawnArgs: string[];
  nativeConfigDir: string;
  nativeConfigFileName: string;
  missingBinaryMessage: string;
  resolveEntrySegments(platform: string): string[];
  /**
   * 桌面端把 agent 的 JS bundle（anet.cjs）打进 resources/anet-agent，由 app 内置的 Electron Node runtime
   * （ELECTRON_RUN_AS_NODE）直接执行，避免再随包内置一份独立 Node 二进制。
   * 这里只放纯 JS 入口文件名，平台无关（与 resolveEntrySegments 的原生二进制路径平行）。
   */
  nodeBundleEntryFile: string;
  resolveNodeBundleSegments(): string[];
}

export function resolvePlatformBinaryName(binaryName: string, platform: string): string {
  return platform === "win32" ? `${binaryName}.exe` : binaryName;
}

export const ANET_AGENT_RUNTIME: ANetAgentRuntimeDescriptor = {
  binaryKind: "native-binary",
  binaryEnvVar: "ANET_AGENT_BINARY_PATH",
  bundledResourceDir: "anet-agent",
  version: "0.13.3",
  spawnArgs: ["app-server", "--stdio"],
  nativeConfigDir: ".anet-one/cli",
  nativeConfigFileName: "config.json",
  missingBinaryMessage:
    "[ANet Agent] agent binary 未找到，请设置 ANET_AGENT_WORKDIR、ANET_AGENT_BINARY_PATH 或先准备 agent 运行时资源",
  resolveEntrySegments: (platform) => [resolvePlatformBinaryName("anet-agent", platform)],
  nodeBundleEntryFile: "anet.cjs",
  resolveNodeBundleSegments() {
    return [this.nodeBundleEntryFile];
  },
};

export function getANetAgentRuntime(): ANetAgentRuntimeDescriptor {
  return ANET_AGENT_RUNTIME;
}
