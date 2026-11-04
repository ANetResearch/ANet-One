import { disposeInSequence } from "@anet/shared";
import {
  ProviderConfigService,
  type ProviderConfigLayerSnapshot,
  type ProviderConfigLayerUpdate,
} from "@anet/provider";
import { NodeANetBuiltinProviderConfigSource } from "./anet-builtin-provider-config-source.js";
import {
  EndpointScopedANetBuiltinSource,
  type EndpointScopedANetBuiltinSourceOptions,
} from "./endpoint-scoped-anet-builtin-source.js";
import {
  ANetBuiltinRemoteSynchronizer,
  type ANetBuiltinRemoteSynchronizerOptions,
  type ANetBuiltinRefreshResult,
} from "./anet-builtin-remote-synchronizer.js";
import {
  NodePersonalProviderConfigRepository,
  type PersonalProviderConfigRecoveryEvent,
} from "./personal-provider-config-repository.js";

export interface NodeProviderConfigRuntimeOptions {
  readonly anetBuiltinFilePath: string;
  readonly anetBuiltinActiveFilePath?: string;
  readonly anetBuiltinRemote?: Omit<ANetBuiltinRemoteSynchronizerOptions, "source">;
  readonly anetBuiltinEnvironment?: Omit<EndpointScopedANetBuiltinSourceOptions, "bundledFilePath">;
  readonly onANetBuiltinRefreshError?: (error: unknown) => void;
  readonly onPersonalConfigRecovery?: (event: PersonalProviderConfigRecoveryEvent) => void;
  readonly onPersonalConfigPollingError?: (error: unknown) => void;
  readonly personalFilePath: string;
  readonly personalPollingIntervalMs?: number | false;
  readonly importLegacy?: (
    anetBuiltin: ProviderConfigLayerSnapshot,
  ) => Promise<ProviderConfigLayerUpdate | null>;
  readonly watch?: boolean;
}

/** 组装一个 Node.js 进程内共享的 ANet Built-in/Personal Config 运行边界。 */
export class NodeProviderConfigRuntime {
  readonly configService: ProviderConfigService;
  readonly #anetBuiltinSource:
    | NodeANetBuiltinProviderConfigSource
    | EndpointScopedANetBuiltinSource;
  readonly #personalRepository: NodePersonalProviderConfigRepository;
  readonly #remoteSynchronizer?: ANetBuiltinRemoteSynchronizer;
  readonly #onRemoteRefreshError?: (error: unknown) => void;
  #startPromise: Promise<void> | null = null;
  #disposed = false;
  readonly #checkListeners = new Set<() => Promise<void>>();
  #checkTimer: ReturnType<typeof setInterval> | null = null;
  #checkInFlight: Promise<void> | null = null;

  constructor(options: NodeProviderConfigRuntimeOptions) {
    this.#anetBuiltinSource = options.anetBuiltinEnvironment
      ? new EndpointScopedANetBuiltinSource({
          bundledFilePath: options.anetBuiltinFilePath,
          ...options.anetBuiltinEnvironment,
        })
      : new NodeANetBuiltinProviderConfigSource({
          bundledFilePath: options.anetBuiltinFilePath,
          activeFilePath: options.anetBuiltinActiveFilePath,
          watch: options.watch,
        });
    this.#remoteSynchronizer =
      options.anetBuiltinRemote &&
      this.#anetBuiltinSource instanceof NodeANetBuiltinProviderConfigSource
        ? new ANetBuiltinRemoteSynchronizer({
            source: this.#anetBuiltinSource,
            ...options.anetBuiltinRemote,
          })
        : undefined;
    this.#onRemoteRefreshError = options.onANetBuiltinRefreshError;
    this.#personalRepository = new NodePersonalProviderConfigRepository({
      filePath: options.personalFilePath,
      onRecovery: options.onPersonalConfigRecovery,
      onPollingError: options.onPersonalConfigPollingError,
      pollingIntervalMs: options.personalPollingIntervalMs,
      ...(options.importLegacy
        ? {
            importLegacy: async () => options.importLegacy!(await this.#anetBuiltinSource.read()),
          }
        : {}),
    });
    this.configService = new ProviderConfigService({
      anetBuiltinSource: this.#anetBuiltinSource,
      personalRepository: this.#personalRepository,
    });
  }

  resolveANetBuiltinActiveFilePath(): Promise<string> {
    return this.#anetBuiltinSource instanceof NodeANetBuiltinProviderConfigSource
      ? Promise.resolve(this.#anetBuiltinSource.activeFilePath)
      : this.#anetBuiltinSource.resolveActiveFilePath();
  }

  get personalRepository(): import("@anet/provider").PersonalProviderConfigRepository {
    return this.#personalRepository;
  }

  /** Environment 同一周期检查中恢复未对齐依赖，不被下载 TTL 或失败挡住。 */
  onDidCheckANetBuiltin(listener: () => Promise<void>): () => void {
    this.#checkListeners.add(listener);
    return () => this.#checkListeners.delete(listener);
  }

  start(): Promise<void> {
    if (this.#disposed) throw new Error("NodeProviderConfigRuntime 已 dispose");
    if (this.#startPromise) return this.#startPromise;
    const startPromise = this.configService.read().then(() => {
      if (this.#disposed) return;
      void this.#checkBackground();
      // Managed Worker 无下载配置也无恢复 owner，不建立周期任务。
      if (
        this.#remoteSynchronizer ||
        this.#anetBuiltinSource instanceof EndpointScopedANetBuiltinSource ||
        this.#checkListeners.size > 0
      ) {
        this.#checkTimer = setInterval(() => {
          void this.#checkBackground();
        }, 60_000);
        this.#checkTimer.unref?.();
      }
    });
    this.#startPromise = startPromise;
    void startPromise.catch(() => {
      if (this.#startPromise === startPromise) this.#startPromise = null;
    });
    return startPromise;
  }

  refreshANetBuiltin(options?: { readonly force?: boolean }): Promise<ANetBuiltinRefreshResult> {
    if (this.#disposed) return Promise.resolve("disposed");
    if (this.#anetBuiltinSource instanceof EndpointScopedANetBuiltinSource) {
      return this.#anetBuiltinSource.refresh(options);
    }
    return this.#remoteSynchronizer?.refresh(options) ?? Promise.resolve("skipped");
  }

  #checkBackground(): Promise<void> {
    if (this.#disposed) return Promise.resolve();
    if (this.#checkInFlight) return this.#checkInFlight;
    const check = Promise.allSettled([
      this.refreshANetBuiltin(),
      ...[...this.#checkListeners].map((listener) => Promise.resolve().then(listener)),
    ])
      .then((results) => {
        if (this.#disposed) return;
        for (const result of results)
          if (result.status === "rejected") this.#onRemoteRefreshError?.(result.reason);
      })
      .finally(() => {
        if (this.#checkInFlight === check) this.#checkInFlight = null;
      });
    this.#checkInFlight = check;
    return check;
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    // 四个被注销对象之间没有依赖,但它们原先写成裸语句序列:任何一个 dispose() 抛错,
    // 后面的就不再执行。`#anetBuiltinSource` 排在最后,而它持有一个 fs.watch 句柄 ——
    // 漏掉它的后果是进程做完所有工作也不退出。改为逐个独立捕获,全部执行完再抛。
    disposeInSequence([
      () => {
        if (this.#checkTimer) clearInterval(this.#checkTimer);
        this.#checkTimer = null;
        this.#checkListeners.clear();
      },
      () => this.#remoteSynchronizer?.dispose(),
      () => this.configService.dispose(),
      () => this.#personalRepository.dispose(),
      () => this.#anetBuiltinSource.dispose(),
    ]);
  }
}

export function createNodeProviderConfigRuntime(
  options: NodeProviderConfigRuntimeOptions,
): NodeProviderConfigRuntime {
  return new NodeProviderConfigRuntime(options);
}
