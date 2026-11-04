import type { ProviderConfigObject } from "@anet/provider";

/** 视觉徽标只反映模型声明的图片输入能力，不按 provider 或型号做展示例外。 */
export function shouldShowModelVisionBadge(
  _modelId: string,
  supportsImage: boolean | null | undefined,
  _access?: ProviderConfigObject["access"],
): boolean {
  return supportsImage === true;
}
