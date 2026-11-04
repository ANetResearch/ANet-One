import { type ANetProvider } from "@anet/shared";

const BOT_NATIVE_MODEL_PROVIDER_PREFIX = "native:";

export function resolveTaskModel(model: string | undefined): string | undefined {
  return model && model !== "default" ? model : undefined;
}

export function getNativeModelProviderId(anetProvider: ANetProvider): string {
  return `${BOT_NATIVE_MODEL_PROVIDER_PREFIX}${anetProvider}`;
}
