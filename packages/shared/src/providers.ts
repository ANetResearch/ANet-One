import { z } from "zod";

/**
 * ANet agent 提供方的单一真源。
 *
 * 类型 ANetProvider、运行时 schema anetProviderSchema 都从这里派生,
 * 避免各处内联 z.enum([...]) 副本随新增/删除 provider 漂移。
 * 本模块只依赖 zod(叶子),可被 validation / anet-protocol 等无环引用。
 */
// 取值曾经是厂商的模型系列名。它会落到任务索引库的 provider 列并出现在 relay payload 里,
// 因此不是单纯的内部常量:旧值由 anet-agent-policy.ts 的 legacyANetProviderSchema 在读取侧接受。
export const ANET_PROVIDERS = ["anet"] as const;

export const anetProviderSchema = z.enum(ANET_PROVIDERS);

export type ANetProvider = (typeof ANET_PROVIDERS)[number];
