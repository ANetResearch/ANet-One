import {
  getModelProviderFamilySpec,
  ProjectAccessTokenClient,
  type ApiClient,
  type ProjectAccessTokenMaterial,
  type ANetAccountAccess,
} from "@anet/shared";
import type { ICredentialService } from "#src/credential/credential.js";
import { createServiceLogger } from "#src/logger/serviceLogger.js";
import { resolveAccountFamilyOrigin } from "#src/model-provider/accountFamilyOrigin.js";
import { readApiJson } from "#src/providers/api/apiJson.js";

const log = createServiceLogger("account-provider-team-plan-request-key");
const ANET_JWT_TOKEN_KEY = "anetjwttoken";
const TEAM_PLAN_RUNTIME_KEY_REQUEST_TIMEOUT_MS = 15_000;

interface TeamPlanRequestKeyDependencies {
  readonly apiClient: ApiClient;
  readonly tokenClient?: ProjectAccessTokenClient;
  readonly accountIdentity?: string;
  readonly rejectedProjectTokenFingerprint?: string;
  readonly credentialService?: Pick<ICredentialService, "load">;
  readonly access: Extract<ANetAccountAccess, { planKind: "team-coding-plan" }>;
}

export async function resolveAccountTeamPlanRuntimeApiKey(
  params: TeamPlanRequestKeyDependencies,
): Promise<string | null> {
  return (await resolveAccountTeamPlanRuntimeMaterial(params))?.token ?? null;
}

export async function resolveAccountTeamPlanRuntimeMaterial(
  params: TeamPlanRequestKeyDependencies,
): Promise<ProjectAccessTokenMaterial | null> {
  const { family, organizationId, projectId } = params.access;
  const familySpec = getModelProviderFamilySpec(family);
  const host = resolveAccountFamilyOrigin(family);
  if (!familySpec || !host) {
    log.warn(undefined, "Team Plan runtime key projection skipped: family unregistered", {
      family,
      projectId,
    });
    return null;
  }
  const oauthProviderId = familySpec.oauthProviderId;
  const token =
    (await params.credentialService?.load(`oauth:${oauthProviderId}:access_token`))?.trim() ?? "";
  if (!token) {
    log.warn(undefined, "Team Plan runtime key projection skipped: OAuth token missing", {
      family,
      projectId,
    });
    return null;
  }
  const anetJwtToken = (await params.credentialService?.load(ANET_JWT_TOKEN_KEY))?.trim() ?? "";
  if (anetJwtToken && token === anetJwtToken) {
    // 业务接口只接受登录 access token，不能使用旧版本误存的 ANet JWT。
    log.warn(undefined, "Team Plan runtime key projection skipped: stale anet JWT token", {
      family,
      projectId,
    });
    return null;
  }

  const client =
    params.tokenClient ??
    new ProjectAccessTokenClient({
      request: (url, init) =>
        readApiJson(params.apiClient, url, {
          ...init,
          timeoutMs: TEAM_PLAN_RUNTIME_KEY_REQUEST_TIMEOUT_MS,
        }),
      observe: (event) => log.warn(undefined, "团队项目 Token 获取失败", event),
    });
  const result = await client.resolve({
    origin: host,
    family,
    loginToken: token,
    accountId: params.accountIdentity ?? family,
    rejectedProjectTokenFingerprint: params.rejectedProjectTokenFingerprint,
    team: { organizationId, projectId },
  });
  if (
    (await params.credentialService?.load(`oauth:${oauthProviderId}:access_token`))?.trim() !==
    token
  ) {
    client.clear();
    throw new Error("project_token_scope_invalidated");
  }
  return result;
}
