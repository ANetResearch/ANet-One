/** 账号型 Provider 的 OAuth provider id;取值由 family 注册表决定。 */
export type AccountApiProviderId = string;

export interface RemoteEnvelope<T> {
  code?: number;
  data?: T;
}

export interface RemoteProjectInfo {
  projectId?: string;
  projectName?: string;
  projectType?: number | string | null;
}

export interface RemoteOrganizationInfo {
  organizationId?: string;
  organizationName?: string;
  projects?: RemoteProjectInfo[];
}

export interface RemoteCustomerInfo {
  organizations?: RemoteOrganizationInfo[];
}

export interface RemoteApiKeySummary {
  apiKey?: string;
  keyType?: number | null;
  name?: string;
}

export interface RemoteApiKeySecret {
  secretKey?: string;
}

export const DEFAULT_ORG_NAME = "默认机构";
export const DEFAULT_PROJECT_NAME = "默认项目";
export const ANET_API_KEY_NAME = "anet-api-key";
