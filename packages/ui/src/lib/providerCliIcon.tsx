import { ANetAboutLogo } from "@/components/ui/ANetAboutLogo.js";

// 没有任何内置厂商 provider 时，CLI 图标统一使用 ANet 自身标记。
// 代价：不同 provider 之间在此处无法靠图标区分，调用方需要另行给出文字标签。
export function renderProviderCliIcon(_provider?: string, className?: string) {
  return <ANetAboutLogo className={className} />;
}
