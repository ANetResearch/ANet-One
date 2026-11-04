/**
 * 把假 provider 服务器接成一条**真**的模型链（apps/anet-cli/packages/dynamic-workflow/docs/execution-engine.md「Verification」）：
 * 真 `ProviderRegistry`（一个 api-key provider 指向假服务器）→ 真 `AiSdkModelAdapter`（真 fetch、
 * 极小的重试底延迟）→ 真 `ApiProviderModelRuntime.modelFactory`。矩阵与自测都从这里拿模型，
 * 于是 3008 事故走过的那条 HTTP 解析路径（fetch 包装 → 业务码 → runner → driver）一段不少。
 *
 * `createModelAdapter`（bootstrap/src/model-factory.ts）不透出 retry 选项，所以这里直接 new。
 * `env: {}` 是刻意的：proxy-aware fetch 没有 env 时会读 process.env，开发机上的 HTTP_PROXY
 * 会把回环请求劫走。
 */

import { AiSdkModelAdapter, type AiSdkModelRetryOptions } from "@anet/adapters/model";
import type { ModelStatusSink } from "@anet/contracts";
import {
  ModelConfig,
  ModelInputFormatConfig,
  ModelOptionSpecsConfig,
  ModelOutputFormatConfig,
  ModelPropertiesConfig,
  ProviderRegistry,
  type ModelSelection,
  type Provider,
} from "@anet/provider";
import {
  ApiProviderModelRuntime,
  type RuntimeModelFactory,
} from "../../src/app/provider-registry-model-runtime.js";
import { createApiKeyProviderConfig } from "../provider-config-fixtures.js";
import type { WireFormat } from "./fake-provider-server.js";

export const FAULT_PROVIDER_ID = "fault-test";
export const FAULT_MODEL_ID = "alpha";
/** governor 桶的 key（`workflowConcurrencyKey`）。 */
export const FAULT_CONCURRENCY_KEY = `${FAULT_PROVIDER_ID}/${FAULT_MODEL_ID}`;
const FAULT_REASONING_LEVEL = "medium";

/** 矩阵里每个 actor runtime 的 selection；factory 直接解引用 `options.reasoningLevel`，所以必须带。 */
export const FAULT_MODEL_SELECTION: ModelSelection = {
  providerId: FAULT_PROVIDER_ID,
  modelId: FAULT_MODEL_ID,
  options: { reasoningLevel: FAULT_REASONING_LEVEL },
} as ModelSelection;

/** 矩阵的步调杠杆之一：runner 的本地退避从 10ms 起、50ms 封顶（无上限预算下 maxAttempts 不生效）。 */
const FAULT_RETRY_OPTIONS: AiSdkModelRetryOptions = {
  backoffFactor: 2,
  baseDelayMs: 10,
  jitter: true,
  maxAttempts: 8,
  maxDelayMs: 50,
};

/**
 * 流空闲上限的缺省值。
 *
 * 这个数必须只在**服务器真的不发事件**时才到期。假 provider 在 1 ms 内就把整条流写完，
 * 所以到期只可能意味着客户端没拿到事件循环。旧值 300 ms 在 CPU 被抢占时就会到期：健康
 * 基线上会多出一次 stream_idle_timeout 重试，请求数比逻辑请求数多一个（托管 runner 上
 * 出现过，本机把核压满也能复现）。放宽到 5 s 后，同样的加压下不再到期。
 *
 * hang 行要的是相反的东西——让它尽快到期，那一行自己传
 * {@link FAULT_HANG_STREAM_IDLE_TIMEOUT_MS}。
 */
const FAULT_STREAM_IDLE_TIMEOUT_MS = 5_000;

/** hang 判决靠它变成一次 stream_idle_timeout 重试。注意：每次重试 +30s（stream-idle-timeout.ts 的增量）。 */
export const FAULT_HANG_STREAM_IDLE_TIMEOUT_MS = 300;

export interface FaultProviderModelOptions {
  baseURL: string;
  apiFormat: WireFormat;
  statusSink?: ModelStatusSink;
  retry?: AiSdkModelRetryOptions;
  streamIdleTimeoutMs?: number;
}

function faultModelConfig(): ModelConfig {
  return new ModelConfig({
    enabled: true,
    properties: new ModelPropertiesConfig({
      requiresMfjsToolSchema: false,
      contextWindow: 200_000,
      inputFormat: new ModelInputFormatConfig({
        supportsText: true,
        supportsImage: false,
        supportsVideo: false,
        supportsAudio: false,
        supportsPdf: false,
      }),
      outputFormat: new ModelOutputFormatConfig({ supportsText: true }),
      supportsToolCall: true,
      supportsJsonSchemaOutput: true,
      supportsNativeWebSearch: false,
      supportsMidConversationSystem: true,
    }),
    optionSpecs: new ModelOptionSpecsConfig({
      // 两种 wire 都认 max_tokens；reasoningLevel 不映射到请求体，免得假服务器收到未知字段。
      maxOutputTokens: { max: 1_000_000, map: '{"max_tokens": maxOutputTokens}' },
      reasoningLevel: { values: ["disabled", FAULT_REASONING_LEVEL], map: "{}" },
    }),
  });
}

function createFaultProviderRegistry(options: {
  baseURL: string;
  apiFormat: WireFormat;
}): ProviderRegistry {
  const provider: Provider = {
    providerId: FAULT_PROVIDER_ID,
    config: createApiKeyProviderConfig({
      apiFormat: options.apiFormat,
      apiKey: "fault-test-key",
      baseURL: options.baseURL,
      models: [FAULT_MODEL_ID],
    }),
    models: [{ modelId: FAULT_MODEL_ID, config: faultModelConfig() }],
  } as unknown as Provider;
  return new ProviderRegistry([provider]);
}

function createFaultModelAdapter(options: FaultProviderModelOptions): AiSdkModelAdapter {
  return new AiSdkModelAdapter({
    env: {},
    retry: options.retry ?? FAULT_RETRY_OPTIONS,
    streamIdleTimeoutMs: options.streamIdleTimeoutMs ?? FAULT_STREAM_IDLE_TIMEOUT_MS,
    ...(options.statusSink === undefined ? {} : { statusSink: options.statusSink }),
  });
}

export function createFaultModelFactory(options: FaultProviderModelOptions): {
  modelFactory: RuntimeModelFactory;
  adapter: AiSdkModelAdapter;
  registry: ProviderRegistry;
  dispose(): void;
} {
  const registry = createFaultProviderRegistry(options);
  const adapter = createFaultModelAdapter(options);
  const runtime = new ApiProviderModelRuntime({ registry, modelAdapter: adapter });
  runtime.start();
  return {
    modelFactory: runtime.modelFactory,
    adapter,
    registry,
    dispose: () => runtime.dispose(),
  };
}
