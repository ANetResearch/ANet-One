import { decodeCustomModelValue, encodeCustomModelValue } from "@anet/shared";

// 旧报表身份映射表。上游在此把运行时的套餐/账号 provider id 映射回改版前的统计桶;
// 那些 provider 已随厂商移除,表为空,legacyTelemetryProviderId 对所有输入原样返回。
// 保留表与查询函数,是因为事件构造处的调用链(model_provider / model_name 投影)仍在使用;
// 只在事件构造处使用,禁止回流业务配置。
const legacyProviderIds: Readonly<Record<string, string>> = Object.freeze({});

export function legacyTelemetryProviderId(providerId: string): string {
  return Object.hasOwn(legacyProviderIds, providerId) ? legacyProviderIds[providerId]! : providerId;
}

/** 只替换已知 Provider 前缀；纯模型 ID、未知身份及模型内部编码保持原样。 */
export function legacyTelemetryModelValue(value: string): string {
  const custom = decodeCustomModelValue(value);
  if (custom) {
    const providerId = legacyTelemetryProviderId(custom.providerId);
    return providerId === custom.providerId
      ? value
      : encodeCustomModelValue(providerId, custom.modelName);
  }
  const slash = value.indexOf("/");
  if (slash < 1) return value;
  const providerId = value.slice(0, slash);
  return legacyTelemetryProviderId(providerId) + value.slice(slash);
}

/** 对话事件完成归因后再投影，不改 request/child/seed 的原始事实。 */
export function legacyTelemetryModelFields(detail: Record<string, string>): Record<string, string> {
  return {
    ...detail,
    ...(detail.model_provider !== undefined
      ? { model_provider: legacyTelemetryProviderId(detail.model_provider) }
      : {}),
    ...(detail.model_name !== undefined
      ? { model_name: legacyTelemetryModelValue(detail.model_name) }
      : {}),
  };
}
