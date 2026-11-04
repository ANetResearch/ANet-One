import type { ANetSessionFile, ANetTaskMeta } from "@anet/shared";
import { anetSessionFileSchema, anetTaskMetaSchema, anetTaskModeSchema } from "@anet/shared";

export type LegacyTaskSessionFile = Omit<ANetSessionFile, "meta"> & {
  meta: Omit<ANetTaskMeta, "mode"> & { mode?: ANetTaskMeta["mode"] };
};

const legacyTaskSessionFileSchema = anetSessionFileSchema.extend({
  // Claude 原生迁移会按清洗路径删除 meta.mode。
  // legacy snapshot 读取/写入仍要校验其它必需字段，但不能再强制把被过滤字段补回文件。
  meta: anetTaskMetaSchema.extend({
    mode: anetTaskModeSchema.optional(),
  }),
});

export function parseLegacyTaskSessionFile(input: unknown): LegacyTaskSessionFile {
  return legacyTaskSessionFileSchema.parse(input);
}

export function safeParseLegacyTaskSessionFile(input: unknown) {
  return legacyTaskSessionFileSchema.safeParse(input);
}
