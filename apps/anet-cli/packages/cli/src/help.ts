import { getANetCopy, type SupportedLocale, type UiLocale } from "@anet/i18n";

export function formatCliHelp(
  version: string,
  locale?: UiLocale,
  detectedLocale?: SupportedLocale,
): string {
  return getANetCopy(locale, detectedLocale).cli.help(version);
}
