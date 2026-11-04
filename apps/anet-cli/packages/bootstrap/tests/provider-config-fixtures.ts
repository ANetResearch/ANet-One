import {
  ApiKeyAccessConfig,
  ProviderApiConfig,
  ProviderConfig,
  ProviderAccountAccessConfig,
  type ModelId,
  type ProviderApiType,
  type ProviderAccountMode,
} from "@anet/provider";

interface CommonProviderFixtureInput {
  readonly label?: string | null;
  readonly apiFormat?: ProviderApiType | null;
  readonly baseURL?: string | null;
  readonly headers?: Readonly<Record<string, string>> | null;
  readonly models?: readonly ModelId[] | null;
  readonly enabled?: boolean | null;
}

export function createApiKeyProviderConfig(
  input: CommonProviderFixtureInput & {
    readonly apiKey?: string | null;
  } = {},
): ProviderConfig {
  return new ProviderConfig({
    label: input.label,
    access: new ApiKeyAccessConfig({ apiKey: input.apiKey }),
    api: createProviderApi(input),
    builtinModelIds: input.models,
    personalModelIds: [],
    enabled: input.enabled ?? true,
    visibility: "visible",
  });
}

export function createAccountProviderConfig(
  input: CommonProviderFixtureInput & {
    readonly family?: "family-b" | "family-a" | null;
    readonly mode?: ProviderAccountMode | null;
  } = {},
): ProviderConfig {
  return new ProviderConfig({
    label: input.label,
    access: new ProviderAccountAccessConfig({
      family: input.family ?? "family-b",
      mode: input.mode ?? "individual-coding-plan",
    }),
    api: createProviderApi(input),
    builtinModelIds: input.models,
    personalModelIds: [],
    enabled: input.enabled ?? true,
    visibility: "visible",
  });
}

function createProviderApi(input: CommonProviderFixtureInput): ProviderApiConfig | undefined {
  return input.apiFormat !== undefined || input.baseURL !== undefined || input.headers !== undefined
    ? new ProviderApiConfig({
        type: input.apiFormat,
        baseUrl: input.baseURL,
        headers: input.headers,
      })
    : undefined;
}
