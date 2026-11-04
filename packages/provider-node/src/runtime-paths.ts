export const ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV = "ANET_BUILTIN_PROVIDER_CONFIG_FILE";
export const ANET_BUILTIN_PROVIDER_BUNDLED_CONFIG_FILE_ENV =
  "ANET_BUILTIN_PROVIDER_BUNDLED_CONFIG_FILE";
export const ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV = "ANET_PERSONAL_PROVIDER_CONFIG_FILE";
export const PERSONAL_PROVIDER_CONFIG_FILE_NAME = "provider_config.json";
/** 设为 "1" 才从上游 endpoint 刷新内置 provider 目录;默认不刷新。 */
export const ANET_BUILTIN_REMOTE_REFRESH_ENV = "ANET_BUILTIN_REMOTE_REFRESH";

export interface NodeProviderRuntimePaths {
  readonly anetBuiltinFilePath: string;
  readonly personalFilePath: string;
}

export function createNodeProviderRuntimePathEnv(
  paths: NodeProviderRuntimePaths,
): Record<string, string> {
  return {
    [ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV]: paths.anetBuiltinFilePath,
    [ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV]: paths.personalFilePath,
  };
}

export function resolveNodeProviderRuntimePaths(
  env: Readonly<Record<string, string | undefined>>,
): NodeProviderRuntimePaths | null {
  const anetBuiltinFilePath = env[ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV]?.trim();
  const personalFilePath = env[ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV]?.trim();
  if (!anetBuiltinFilePath && !personalFilePath) return null;
  if (!anetBuiltinFilePath || !personalFilePath) {
    throw new Error("ANet Built-in 与 Personal Provider Config 路径必须同时提供");
  }
  return Object.freeze({ anetBuiltinFilePath, personalFilePath });
}
