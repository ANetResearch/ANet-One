import { z } from "zod";
import { PROVIDER_ACCOUNT_ACCESS_TYPE, sparseShape } from "@anet/shared/config-schema";

export const providerApiTypeDataSchema = z.enum([
  "anthropic-messages",
  "openai-chat-completions",
  "openai-responses",
]);
export const PERSONAL_PROVIDER_GROUP = "standard-personal" as const;
/** Account Provider 家族分组的后缀。分组名由家族 id 拼出:`<familyId>-family`。 */
export const PROVIDER_FAMILY_GROUP_SUFFIX = "-family" as const;
export function isProviderFamilyGroup(group: string): boolean {
  return group.endsWith(PROVIDER_FAMILY_GROUP_SUFFIX);
}
export function providerFamilyGroup(familyId: string): string {
  return `${familyId}${PROVIDER_FAMILY_GROUP_SUFFIX}`;
}
// 分组取值随家族注册表变化,不能写成固定 enum:注册表为空时 enum 会退化成单成员,
// `.exclude(["standard-personal"])` 会得到空 enum 而在构造期抛错。改为字符串 + 细化判定。
export const providerGroupDataSchema = z.string().min(1);
export const providerFamilyGroupDataSchema = providerGroupDataSchema.refine(
  (group) => group !== PERSONAL_PROVIDER_GROUP,
  { message: `Account Provider 分组不能是 ${PERSONAL_PROVIDER_GROUP}` },
);
export const personalProviderGroupDataSchema = z.literal(PERSONAL_PROVIDER_GROUP);
export const providerAccountModeDataSchema = z.enum([
  "start-plan",
  "individual-coding-plan",
  "team-coding-plan",
  "off-peak",
  // 加速卡访问类别；与 anetProviderAccountAccessSchema.mode 同值，改动需同步两处。
  "highspeed",
]);
export const providerVisibilityDataSchema = z.enum(["visible", "hidden"]);
export const providerLogoDataSchema = z
  .object({ type: z.literal("builtin"), key: z.string().min(1) })
  .strict();

const nonBlankRequiredString = z.string().refine((value) => value.trim().length > 0, {
  message: "必填配置不能为空",
  params: { configIssueCode: "required-field-missing" },
});

export const apiKeyAccessDataSchema = z
  .object({
    type: z.enum(["api-key", "coding-plan-api-key"]),
    apiKey: z.string().nullable().optional(),
    apiKeyManagementUrl: z.string().url().nullable().optional(),
  })
  .strict();
export const completeApiKeyAccessDataSchema = apiKeyAccessDataSchema.extend({
  apiKey: nonBlankRequiredString,
});

export const completeProviderAccountAccessDataSchema = z
  .object({
    type: z.literal(PROVIDER_ACCOUNT_ACCESS_TYPE),
    // 家族 id 来自家族注册表,不是固定枚举:注册表为空时任何固定取值都是死分支。
    accountType: z.string().min(1),
    mode: providerAccountModeDataSchema,
    entitled: z.boolean(),
  })
  .strict();
export const providerAccountAccessDataSchema = z
  .object({
    ...sparseShape(completeProviderAccountAccessDataSchema.shape),
    type: completeProviderAccountAccessDataSchema.shape.type,
  })
  .strict();
export const providerAccessDataSchema = z.discriminatedUnion("type", [
  apiKeyAccessDataSchema,
  providerAccountAccessDataSchema,
]);
export const completeProviderAccessDataSchema = z.discriminatedUnion("type", [
  completeApiKeyAccessDataSchema,
  completeProviderAccountAccessDataSchema,
]);

export const completeProviderApiDataSchema = z
  .object({
    type: providerApiTypeDataSchema,
    baseUrl: nonBlankRequiredString.pipe(z.string().url()),
    headers: z.record(z.string(), z.string()).readonly().nullable().optional(),
  })
  .strict();
export const providerApiDataSchema = z
  .object({
    ...sparseShape(completeProviderApiDataSchema.shape),
    baseUrl: z.string().url().nullable().optional(),
  })
  .strict();
// Personal 允许暂存编辑中的 endpoint；完整 schema 仍拒绝，且只影响该 Provider 的准入。
export const personalProviderApiDataSchema = providerApiDataSchema.extend({
  baseUrl: z.string().nullable().optional(),
});

const modelIdsDataSchema = z.array(z.string().min(1)).readonly().nullable().optional();
export const providerConfigDataSchema = z
  .object({
    group: providerGroupDataSchema.nullable().optional(),
    logo: providerLogoDataSchema.nullable().optional(),
    access: providerAccessDataSchema.nullable().optional(),
    api: providerApiDataSchema.nullable().optional(),
    builtinModelIds: modelIdsDataSchema,
    personalModelIds: modelIdsDataSchema,
    modelOrder: modelIdsDataSchema,
    visibility: providerVisibilityDataSchema.nullable().optional(),
  })
  .strict();
export const completeProviderConfigDataSchema = providerConfigDataSchema.extend({
  group: providerGroupDataSchema,
  access: completeProviderAccessDataSchema,
  api: completeProviderApiDataSchema,
});

export const providerTemplateNameMapDataSchema = z
  .object({
    "zh-CN": z.string().min(1).optional(),
    "en-US": z.string().min(1).optional(),
  })
  .strict();
export const providerTemplateDataSchema = z
  .object({
    templateId: z.string().min(1),
    templateNameMap: providerTemplateNameMapDataSchema,
    config: providerConfigDataSchema,
  })
  .strict();
