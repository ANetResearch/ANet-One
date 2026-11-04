import type { z } from "zod";

/** 每个字段保持原 schema，只派生覆盖所需的缺省/null；嵌套结构由调用方显式派生。 */
export function sparseShape<T extends Record<string, z.ZodType>>(shape: T) {
  return Object.fromEntries(
    Object.entries(shape).map(([key, schema]) => [key, schema.nullable().optional()]),
  ) as { [K in keyof T]: z.ZodOptional<z.ZodNullable<T[K]>> };
}

/**
 * Account Provider 的 access 判别值。Provider 配置(packages/provider)与 ANet 协议
 * (anet-protocol)各有一份 access schema,但判别值必须同一个,否则协议下发的 access
 * 写进 Provider 配置后读不回来。两处都从这里取,改名只改这一行。
 */
export const PROVIDER_ACCOUNT_ACCESS_TYPE = "provider-account" as const;
