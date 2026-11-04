import { z } from "zod";
import {
  parseANetBuiltinModelConfigRules,
  parseANetBuiltinProviderConfigRules,
  type ModelConfigRules,
  type ProviderConfigMap,
  type ProviderTemplateMap,
} from "@anet/provider";

export const ANET_BUILTIN_RELEASE_SCHEMA_VERSION = 1 as const;

export interface ANetBuiltinConfigContent {
  readonly providers: ProviderConfigMap;
  readonly providerTemplates: ProviderTemplateMap;
  readonly modelConfigRules: ModelConfigRules;
}

export interface ANetBuiltinRelease {
  readonly schemaVersion: typeof ANET_BUILTIN_RELEASE_SCHEMA_VERSION;
  readonly revision: number;
  readonly config: ANetBuiltinConfigContent;
}

const releaseSchema = z
  .object({
    schemaVersion: z.literal(ANET_BUILTIN_RELEASE_SCHEMA_VERSION),
    revision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    config: z
      .object({
        providerConfigRules: z.unknown(),
        modelConfigRules: z.unknown(),
      })
      .strict(),
  })
  .strict();

export function decodeANetBuiltinRelease(input: unknown): ANetBuiltinRelease {
  const parsed = releaseSchema.parse(input);
  const { providers, providerTemplates } = parseANetBuiltinProviderConfigRules(
    parsed.config.providerConfigRules,
  );
  return Object.freeze({
    schemaVersion: ANET_BUILTIN_RELEASE_SCHEMA_VERSION,
    revision: parsed.revision,
    config: Object.freeze({
      providers,
      providerTemplates,
      modelConfigRules: parseANetBuiltinModelConfigRules(parsed.config.modelConfigRules),
    }),
  });
}

export function encodeANetBuiltinRelease(release: ANetBuiltinRelease): object {
  return {
    schemaVersion: ANET_BUILTIN_RELEASE_SCHEMA_VERSION,
    revision: release.revision,
    config: {
      providerConfigRules: {
        templateRules: release.config.providerTemplates.toJSON(),
        providerRules: release.config.providers.toJSON(),
      },
      modelConfigRules: release.config.modelConfigRules.toANetBuiltinJSON(),
    },
  };
}

export function serializeANetBuiltinRelease(release: ANetBuiltinRelease): string {
  return JSON.stringify(encodeANetBuiltinRelease(release));
}
