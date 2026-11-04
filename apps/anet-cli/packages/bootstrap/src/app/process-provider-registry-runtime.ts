import {
  AccountProviderService,
  MutableAccountProviderConfigSource,
  parseAccountProviderConfigMap,
  type AccountProviderConfigSnapshot,
  type AccountProviderStates,
} from "@anet/provider";
import {
  disposeInSequence,
  isBuiltinModelProviderId,
  resolveRuntimeANetEndpointOrigin,
  ANET_VERSION,
} from "@anet/shared";
import { dirname, join } from "node:path";
import {
  NodeModelSelectionConfigRepository,
  NodeProviderRegistryRuntime,
  resolveNodeProviderRuntimePaths,
  downloadANetBuiltinRelease,
  resolveANetBuiltinClientPlatform,
  ANET_BUILTIN_PROVIDER_BUNDLED_CONFIG_FILE_ENV,
  ANET_BUILTIN_REMOTE_REFRESH_ENV,
  type ANetBuiltinRefreshEvent,
} from "@anet/provider-node";
import {
  createSharedANetCredentialStore,
  type SharedANetCredentialStore,
} from "@anet/adapters/auth";
import { readLegacyCliPersonalProviderConfig } from "./legacy-cli-personal-provider-config-importer.js";
import {
  createStandaloneProviderRuntimeHeadersPort,
  readStandaloneAccountProviderConfigSnapshot,
} from "./standalone-account-provider-runtime.js";

export interface ProcessProviderRegistryRuntimeOptions {
  /** Standalone Prompt CLI / TUI 自己拥有账号凭据与旧配置的一次性导入。 */
  readonly standalone?: {
    readonly credentialStore?: SharedANetCredentialStore;
    readonly legacyCliUserConfigFilePath?: string;
    readonly onAccountInitializationError?: (error: unknown) => void;
    readonly request?: typeof fetch;
    readonly onBuiltinRefreshError?: (error: unknown) => void;
    readonly onBuiltinRefreshResult?: (event: ANetBuiltinRefreshEvent) => void;
  };
}

export async function startProcessProviderRegistryRuntime(
  env: Readonly<Record<string, string | undefined>>,
  options: ProcessProviderRegistryRuntimeOptions = {},
) {
  const paths = resolveNodeProviderRuntimePaths(env);
  if (!paths) {
    throw new Error("缺少进程 Provider Registry 的 ANet Built-in / Personal Config 路径");
  }

  const accountSource = new MutableAccountProviderConfigSource();
  const credentialStore = options.standalone
    ? (options.standalone.credentialStore ?? createSharedANetCredentialStore({ env: { ...env } }))
    : undefined;
  let standaloneAccount: AccountProviderService | undefined;
  const bundledFile = options.standalone
    ? env[ANET_BUILTIN_PROVIDER_BUNDLED_CONFIG_FILE_ENV]?.trim()
    : undefined;
  // 内置 provider 目录原本每次启动都从上游 endpoint 拉一份,与随包配置取
  // revision 较高者生效。上游发布一个比随包更高的 revision,就会把我们在随包
  // 配置里加的 provider 模板静默换掉 —— 包括 token.anet.chat 那一条,用户会
  // 发现模板突然不见了而没有任何提示。目录是本产品的一部分,不接受远端改写,
  // 所以默认不拉;要恢复上游行为就设 ANET_BUILTIN_REMOTE_REFRESH=1。
  const remoteRefresh = isBuiltinRemoteRefreshEnabled(env);
  const runtime = new NodeProviderRegistryRuntime({
    ...paths,
    ...(bundledFile
      ? {
          anetBuiltinFilePath: bundledFile,
          anetBuiltinActiveFilePath: paths.anetBuiltinFilePath,
          ...(remoteRefresh ? {
          anetBuiltinRemote: {
            controlFilePath: join(
              dirname(paths.anetBuiltinFilePath),
              "anet-builtin-refresh.json",
            ),
            resolveEndpointKey: () => resolveRuntimeANetEndpointOrigin(env),
            fetchRelease: (endpointOrigin, signal) =>
              downloadANetBuiltinRelease({
                endpointOrigin,
                signal,
                appVersion: ANET_VERSION,
                platform: resolveANetBuiltinClientPlatform(),
                request: options.standalone?.request ?? globalThis.fetch,
              }),
            onRefreshResult: options.standalone?.onBuiltinRefreshResult,
          },
          } : {}),
        }
      : {}),
    onANetBuiltinRefreshError: options.standalone?.onBuiltinRefreshError,
    accountSource,
    ...(credentialStore
      ? {
          createAccountSource(configService) {
            standaloneAccount = new AccountProviderService({
              configSource: configService,
              async resolve({ configRevision, configuredProviders }) {
                // 使用本轮捕获的 Built-in，而不是异步读另一份文件后仅贴上新 revision。
                const snapshot = await readStandaloneAccountProviderConfigSnapshot(
                  credentialStore,
                  env,
                  {
                    revision: configRevision,
                    providers: configuredProviders,
                  },
                );
                return {
                  providers: snapshot.providers,
                  states: snapshot.states ?? {},
                };
              },
            });
            standaloneAccount.onDidRefreshError(({ error }) => {
              try {
                options.standalone?.onAccountInitializationError?.(error);
              } catch {
                /* 观测回调不能改变账号事实。 */
              }
            });
            return standaloneAccount;
          },
        }
      : {}),
    ...(options.standalone
      ? {
          importLegacy: () =>
            readLegacyCliPersonalProviderConfig({
              ...(options.standalone?.legacyCliUserConfigFilePath
                ? { filePath: options.standalone.legacyCliUserConfigFilePath }
                : {}),
            }),
        }
      : {}),
  });
  const disposeRecovery = standaloneAccount
    ? runtime.onDidCheckANetBuiltin(async () => {
        const [config, account] = await Promise.all([
          runtime.configService.read(),
          standaloneAccount!.read(),
        ]);
        if (config.anetBuiltinRevision !== account.basedOnANetBuiltinRevision)
          await standaloneAccount!.refresh("builtin-account-recovery");
      })
    : undefined;
  // 复用 AccountService 的串行、过期结果丢弃机制，凭据变化与 Built-in 变化不能各自发布。
  const standaloneHeaders = credentialStore
    ? createStandaloneProviderRuntimeHeadersPort(credentialStore, env)
    : undefined;
  const disposeCredentialSubscription = credentialStore?.onDidChange?.(async () => {
    await standaloneHeaders?.invalidateChangedCredentials();
    await standaloneAccount!.refresh("standalone-credentials-changed");
    await runtime.registryService.refresh("standalone-credentials-barrier");
  });
  try {
    await runtime.start();
    const snapshot = runtime.registryService.getSnapshot()!;
    const modelSelectionConfigRepository = new NodeModelSelectionConfigRepository({
      personalRepository: runtime.personalRepository,
    });
    try {
      const configuredDefaultModelSelection = await modelSelectionConfigRepository.read();
      return Object.freeze({
        accountSource: standaloneAccount ?? accountSource,
        async syncAccountProviderConfig(next: AccountProviderConfigSnapshot): Promise<boolean> {
          if (standaloneAccount)
            throw new Error("Standalone Account 由本进程管理，不接收 Host 覆盖");
          const changed = accountSource.replace(next, "host-account-config");
          // Source 去重只证明收过，不证明上次刷新成功。重交时仍刷新；配套配置未到
          // 则由 Registry 保留完整旧快照，不能把接收确认冒充应用确认。
          await runtime.registryService.refresh("host-account-config");
          return changed;
        },
        dispose() {
          // 六步之间没有依赖,但原先是裸语句序列:任何一步抛错,后面的资源全部不释放。
          // `runtime` 排在最后,而它持有文件监视器 —— 漏掉它的后果是进程做完所有工作
          // 也不退出。逐个独立捕获,全部执行完再抛第一个错误。
          disposeInSequence([
            () => disposeCredentialSubscription?.(),
            () => standaloneHeaders?.clearProjectTokens(),
            () => disposeRecovery?.(),
            () => standaloneAccount?.dispose(),
            () => modelSelectionConfigRepository.dispose(),
            () => runtime.dispose(),
          ]);
        },
        ...(credentialStore
          ? {
              providerRuntimeHeadersPort: standaloneHeaders!,
            }
          : {}),
        runtime,
        snapshot,
        modelSelectionConfigRepository,
        configuredDefaultModelSelection,
      });
    } catch (error) {
      // 这条路径原先漏了 runtime / disposeRecovery / standaloneAccount(外层 catch 有)。
      // 此时 runtime 已经 start 过,它的文件监视器已经建立;函数又是以 reject 结束,
      // 调用方拿不到对象也就无法注销 —— 句柄只能一直留着,进程不退出。
      disposeInSequence([
        () => disposeCredentialSubscription?.(),
        () => disposeRecovery?.(),
        () => standaloneAccount?.dispose(),
        () => modelSelectionConfigRepository.dispose(),
        () => runtime.dispose(),
      ]);
      throw error;
    }
  } catch (error) {
    disposeInSequence([
      () => disposeCredentialSubscription?.(),
      () => disposeRecovery?.(),
      () => standaloneAccount?.dispose(),
      () => runtime.dispose(),
    ]);
    throw error;
  }
}

/** 把协议信封解析为进程 Registry 使用的第三层 Account Config Overlay。 */
export function parseProcessAccountProviderConfigSnapshot(input: {
  readonly revision: string;
  readonly basedOnANetBuiltinRevision: string;
  readonly providers: unknown;
  readonly states?: AccountProviderStates;
}): AccountProviderConfigSnapshot {
  const revision = input.revision.trim();
  if (!revision) throw new Error("Account Config revision 不能为空");
  const basedOnANetBuiltinRevision = input.basedOnANetBuiltinRevision.trim();
  if (!basedOnANetBuiltinRevision) {
    throw new Error("Account Config Built-in revision 不能为空");
  }
  const providers = parseAccountProviderConfigMap(input.providers);
  for (const [providerId, provider] of providers.entries()) {
    // 仅约束托管 Worker 的普通账号信封；独立 CLI、API 和闲时不需要 current。
    if (
      isBuiltinModelProviderId(providerId) &&
      provider.access?.type === "provider-account" &&
      provider.access.entitled &&
      typeof input.states?.[providerId]?.current !== "boolean"
    ) {
      throw new Error(`Account State 缺少 current: ${providerId}`);
    }
  }
  return Object.freeze({
    revision,
    basedOnANetBuiltinRevision,
    providers,
    // 与 Overlay 属于同一快照；不能只更新 revision 却丢掉当前连接事实。
    ...(input.states ? { states: input.states } : {}),
  });
}

/**
 * 是否从上游 endpoint 刷新内置 provider 目录。默认否。
 *
 * 目录与随包配置取 revision 较高者生效,所以上游发布一个更高的 revision 就会把
 * 本仓库在随包配置里加的 provider 模板静默换掉,用户只会看到模板消失。目录是本
 * 产品的一部分,因此默认不拉;设 ANET_BUILTIN_REMOTE_REFRESH=1 可恢复上游行为。
 */
export function isBuiltinRemoteRefreshEnabled(
  env: Readonly<Record<string, string | undefined>>,
): boolean {
  return env[ANET_BUILTIN_REMOTE_REFRESH_ENV]?.trim() === "1";
}
