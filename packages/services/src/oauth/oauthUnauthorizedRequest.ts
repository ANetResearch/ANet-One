import type { ICredentialService } from "#src/credential/credential.js";

/**
 * 业务类 OAuth 请求的识别依赖具体 provider 的接口域名与路径。本分发不内置任何
 * provider，因此没有请求会被判定为业务请求，核验材料恒为 null。
 * 接入自建 provider 时在这里按 provider id 补充域名/路径匹配。
 * 代价：未接入 provider 时，业务接口返回 401 不会触发自动退出登录。
 */
async function isCurrentBusinessOAuthCredentialRequest(_options: {
  input: string | URL;
  headers: Headers;
  credentialService: Pick<ICredentialService, "load">;
  env?: NodeJS.ProcessEnv;
}): Promise<boolean> {
  return false;
}

export async function isOAuthBusinessRequest(_options: {
  input: string | URL;
  credentialService: Pick<ICredentialService, "load">;
  env?: NodeJS.ProcessEnv;
  provider?: string | null;
}): Promise<boolean> {
  return false;
}

/** Host 私有的只读身份核验材料，不进入 RPC、配置或日志。无 provider 时恒为 null。 */
export async function resolveOAuthBusinessCredentialValidationRequest(_options: {
  input: string | URL;
  headers: Headers;
  credentialService: Pick<ICredentialService, "load">;
  env?: NodeJS.ProcessEnv;
}): Promise<{ url: string; authorization: string; emptyBodyMeansInvalid: boolean } | null> {
  return null;
}

export async function isCurrentOAuthBusinessCredentialRequest(options: {
  input: string | URL;
  headers: Headers;
  credentialService: Pick<ICredentialService, "load">;
  env?: NodeJS.ProcessEnv;
}): Promise<boolean> {
  return isCurrentBusinessOAuthCredentialRequest(options);
}

// 这里只判定候选请求；实际退出须由 OAuthService 在会话变更队列内复核，不能依赖异步旧快照。
export async function isCurrentOAuthCredentialRequest(options: {
  input: string | URL;
  headers: Headers;
  credentialService: Pick<ICredentialService, "load">;
  env?: NodeJS.ProcessEnv;
}): Promise<boolean> {
  const authorization = options.headers.get("authorization")?.trim() ?? "";
  if (!authorization) return false;
  const currentJwt = (await options.credentialService.load("anetjwttoken"))?.trim() ?? "";
  if (currentJwt && authorization === `Bearer ${currentJwt}`) return true;
  return isCurrentBusinessOAuthCredentialRequest(options);
}
