import type { ProviderConfigLayerSnapshot, ProviderSource } from "@anet/provider";
import {
  normalizeANetBuiltinEndpointOrigin,
  resolveANetBuiltinCachePaths,
} from "./anet-builtin-cache-paths.js";
import { NodeANetBuiltinProviderConfigSource } from "./anet-builtin-provider-config-source.js";
import {
  ANetBuiltinRemoteSynchronizer,
  type ANetBuiltinRefreshResult,
  type ANetBuiltinRemoteSynchronizerOptions,
} from "./anet-builtin-remote-synchronizer.js";

export interface EndpointScopedANetBuiltinSourceOptions {
  readonly bundledFilePath: string;
  readonly environmentConfigRoot: string;
  readonly platform: string;
  readonly appVersion: string;
  readonly resolveEndpointOrigin: () => string | Promise<string>;
  readonly fetchRelease: ANetBuiltinRemoteSynchronizerOptions["fetchRelease"];
  readonly onRefreshResult?: ANetBuiltinRemoteSynchronizerOptions["onRefreshResult"];
  readonly watch?: boolean;
}

/**
 * 让 Environment 的 ANet 控制面 Endpoint 同时决定 Active/LKG 与刷新控制路径。
 * Endpoint 切换只替换当前 Source，不读取上一 Endpoint 的缓存。
 */
export class EndpointScopedANetBuiltinSource implements ProviderSource<ProviderConfigLayerSnapshot> {
  readonly #options: EndpointScopedANetBuiltinSourceOptions;
  readonly #listeners = new Set<(reason: string) => void>();
  #current: CurrentEndpointSource | null = null;
  #ensureInFlight: Promise<CurrentEndpointSource> | null = null;
  #disposed = false;

  constructor(options: EndpointScopedANetBuiltinSourceOptions) {
    this.#options = options;
  }

  async read(): Promise<ProviderConfigLayerSnapshot> {
    return (await this.#ensureCurrent()).source.read();
  }

  onDidChange(listener: (reason: string) => void): () => void {
    this.#assertNotDisposed();
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  async refresh(options?: { readonly force?: boolean }): Promise<ANetBuiltinRefreshResult> {
    return (await this.#ensureCurrent()).synchronizer.refresh(options);
  }

  /** 返回当前 Environment Endpoint 对应、已完成物化的 Active Config 路径。 */
  async resolveActiveFilePath(): Promise<string> {
    return (await this.#ensureCurrent()).activeFilePath;
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#current?.dispose();
    this.#current = null;
    this.#listeners.clear();
  }

  async #ensureCurrent(): Promise<CurrentEndpointSource> {
    this.#assertNotDisposed();
    if (this.#ensureInFlight) return this.#ensureInFlight;
    const ensure = this.#resolveCurrent().finally(() => {
      if (this.#ensureInFlight === ensure) this.#ensureInFlight = null;
    });
    this.#ensureInFlight = ensure;
    return ensure;
  }

  async #resolveCurrent(): Promise<CurrentEndpointSource> {
    /* 缺省分发不内置控制面地址,`resolveEndpointOrigin()` 返回空串。这里原先直接
       `normalizeANetBuiltinEndpointOrigin(...)`,空串即抛,而桌面端在装配 Provider
       配置运行时就会走到这里 —— 结果是桌面端起不来,不是"刷新不可用"。
       空串按"未配置"处理:缓存路径走固定桶(见 createANetBuiltinEndpointKey),
       远端刷新那一侧仍然要求真实 origin,见下面 synchronizer 的 resolveEndpointKey。 */
    const rawOrigin = await this.#options.resolveEndpointOrigin();
    const endpointOrigin = rawOrigin.trim() ? normalizeANetBuiltinEndpointOrigin(rawOrigin) : "";
    const paths = resolveANetBuiltinCachePaths({
      environmentConfigRoot: this.#options.environmentConfigRoot,
      platform: this.#options.platform,
      appVersion: this.#options.appVersion,
      anetEndpointOrigin: endpointOrigin,
    });
    if (this.#current?.activeFilePath === paths.activeFilePath) return this.#current;

    const source = new NodeANetBuiltinProviderConfigSource({
      bundledFilePath: this.#options.bundledFilePath,
      activeFilePath: paths.activeFilePath,
      watch: this.#options.watch,
    });
    const sourceDispose = source.onDidChange((reason) => this.#emit(reason));
    const synchronizer = new ANetBuiltinRemoteSynchronizer({
      source,
      controlFilePath: paths.controlFilePath,
      resolveEndpointKey: async () =>
        normalizeANetBuiltinEndpointOrigin(await this.#options.resolveEndpointOrigin()),
      fetchRelease: this.#options.fetchRelease,
      onRefreshResult: this.#options.onRefreshResult,
    });
    try {
      await source.read();
      this.#assertNotDisposed();
    } catch (error) {
      sourceDispose();
      synchronizer.dispose();
      source.dispose();
      throw error;
    }

    const previous = this.#current;
    const current = new CurrentEndpointSource(
      paths.activeFilePath,
      source,
      synchronizer,
      sourceDispose,
    );
    this.#current = current;
    previous?.dispose();
    if (previous) this.#emit("endpoint-changed");
    return current;
  }

  #emit(reason: string): void {
    if (this.#disposed) return;
    for (const listener of this.#listeners) listener(reason);
  }

  #assertNotDisposed(): void {
    if (this.#disposed) throw new Error("EndpointScopedANetBuiltinSource 已 dispose");
  }
}

class CurrentEndpointSource {
  constructor(
    readonly activeFilePath: string,
    readonly source: NodeANetBuiltinProviderConfigSource,
    readonly synchronizer: ANetBuiltinRemoteSynchronizer,
    readonly sourceDispose: () => void,
  ) {}

  dispose(): void {
    this.sourceDispose();
    this.synchronizer.dispose();
    this.source.dispose();
  }
}
