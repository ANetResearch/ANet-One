import { existsSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import {
  materializeANetBuiltinProviderConfig,
  NodeANetBuiltinProviderConfigSource,
  PERSONAL_PROVIDER_CONFIG_FILE_NAME,
  resolveANetBuiltinCachePaths,
  resolveANetBuiltinClientPlatform,
  ANET_BUILTIN_PROVIDER_BUNDLED_CONFIG_FILE_ENV,
  ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV,
  ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV,
  type ANetBuiltinRefreshEvent,
} from "@anet/provider-node";
import { resolveRuntimeANetEndpointOrigin, ANET_VERSION } from "@anet/shared";
import type { CliEnv } from "./env.js";

export const SEA_ANET_BUILTIN_PROVIDER_CONFIG_ASSET_KEY = "anet-provider/anet-builtin.json";

export function createCliProviderRefreshReporter(
  stderr: Pick<NodeJS.WriteStream, "write"> = process.stderr,
) {
  return {
    onBuiltinRefreshError(error: unknown) {
      stderr.write(
        `ANet Built-in 刷新失败: ${error instanceof Error ? error.message : "unknown error"}\n`,
      );
    },
    onBuiltinRefreshResult(event: ANetBuiltinRefreshEvent) {
      // TTL 检查不是生产事件；成功更新才默认留痕，不能输出 CDN URL 查询参数或内容。
      if (event.result === "updated" || process.env.NODE_ENV !== "production") {
        stderr.write(
          `ANet Built-in ${event.result}${event.reason ? ` (${event.reason})` : ""}${event.revision === undefined ? "" : ` revision=${event.revision} source=CDN`}\n`,
        );
      }
    },
  };
}

type SeaProviderConfigAssets = Pick<typeof import("node:sea"), "getAsset" | "isSea">;

interface PrepareCliProviderRuntimeEnvOptions {
  readonly argv: readonly string[];
  readonly env: CliEnv;
  readonly dataBaseDir?: string;
  readonly entrypoint?: string;
  readonly sea?: SeaProviderConfigAssets;
  readonly appVersion?: string;
  readonly platform?: string;
}

/** 为运行 Core 或写入模型选择的 CLI Entry 定位同一 Environment 的 Provider Config。 */
export async function prepareCliProviderRuntimeEnv(
  options: PrepareCliProviderRuntimeEnvOptions,
): Promise<Record<string, string>> {
  if (!requiresProviderRuntime(options.argv)) return {};

  const explicitANetBuiltin = options.env[ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV]?.trim();
  const explicitPersonal = options.env[ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV]?.trim();
  const dataBaseDir = options.dataBaseDir ?? options.env.ANET_DATA_BASE_DIR?.trim() ?? homedir();
  if (explicitANetBuiltin && explicitPersonal) {
    return {
      [ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV]: explicitANetBuiltin,
      [ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV]: explicitPersonal,
    };
  }

  const anetBuiltinFilePath =
    explicitANetBuiltin ??
    (await resolveBundledANetBuiltinProviderConfig({
      dataBaseDir,
      entrypoint: options.entrypoint ?? process.argv[1],
      sea: options.sea ?? getSeaProviderConfigAssets(),
    }));
  const personalFilePath =
    explicitPersonal ?? join(dataBaseDir, ".anet-one", "v2", PERSONAL_PROVIDER_CONFIG_FILE_NAME);
  const appVersion = options.appVersion ?? ANET_VERSION;
  const platform = options.platform ?? resolveANetBuiltinClientPlatform();
  const anetEndpointOrigin = resolveRuntimeANetEndpointOrigin(options.env);
  const cachePaths = resolveANetBuiltinCachePaths({
    environmentConfigRoot: join(dataBaseDir, ".anet-one", "v2"),
    platform,
    appVersion,
    anetEndpointOrigin,
  });
  const source = new NodeANetBuiltinProviderConfigSource({
    bundledFilePath: anetBuiltinFilePath,
    activeFilePath: cachePaths.activeFilePath,
    watch: false,
  });
  // 入口只准备资源和路径；下载由 Prompt/TUI 长生命周期 Runtime 持有并取消。
  try {
    await source.read();
  } finally {
    source.dispose();
  }

  return {
    [ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV]: cachePaths.activeFilePath,
    [ANET_BUILTIN_PROVIDER_BUNDLED_CONFIG_FILE_ENV]: anetBuiltinFilePath,
    [ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV]: personalFilePath,
  };
}

function requiresProviderRuntime(argv: readonly string[]): boolean {
  if (argv.some((arg) => arg === "--help" || arg === "-h" || arg === "--version" || arg === "-v")) {
    return false;
  }
  if (
    argv.some(
      (arg) =>
        arg === "--prompt" ||
        arg.startsWith("--prompt=") ||
        arg === "--target" ||
        arg.startsWith("--target="),
    )
  ) {
    return true;
  }

  const command = argv[0];
  if (command === undefined || command.startsWith("-")) return true;
  return (
    command === "tui" ||
    command === "app-server" ||
    command === "agent-server" ||
    command === "login" ||
    command === "logout"
  );
}

async function resolveBundledANetBuiltinProviderConfig(input: {
  readonly dataBaseDir: string;
  readonly entrypoint: string | undefined;
  readonly sea: SeaProviderConfigAssets | undefined;
}): Promise<string> {
  if (input.sea?.isSea()) {
    const content = input.sea.getAsset(SEA_ANET_BUILTIN_PROVIDER_CONFIG_ASSET_KEY, "utf8");
    return materializeANetBuiltinProviderConfig({
      environmentConfigRoot: join(input.dataBaseDir, ".anet-one", "v2"),
      content,
    });
  }

  const entrypoint = input.entrypoint?.trim();
  if (!entrypoint) throw new Error("无法定位 CLI ANet Built-in Provider Config：缺少入口路径");
  // 全局 bin 可以是软链接，随包配置必须相对真实入口定位。
  const entryDirectory = dirname(realpathSync(resolve(entrypoint)));
  const candidates = [
    join(entryDirectory, "provider", "anet-builtin.json"),
    resolve(entryDirectory, "../../../../../config/provider/anet-builtin.json"),
  ];
  const candidate = candidates.find((filePath) => existsSync(filePath));
  if (candidate) return candidate;
  throw new Error(`无法定位 CLI ANet Built-in Provider Config：${candidates.join(", ")}`);
}

function getSeaProviderConfigAssets(): SeaProviderConfigAssets | undefined {
  const getBuiltinModule = process.getBuiltinModule as
    | ((id: "node:sea") => typeof import("node:sea"))
    | undefined;
  return getBuiltinModule?.("node:sea");
}
