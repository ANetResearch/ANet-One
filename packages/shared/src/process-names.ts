import { ANET_PRODUCT_NAME } from "./anetProduct.js";

const ANET_PROCESS_PREFIX = "anet";
const MAX_PROCESS_NAME_SEGMENT_LENGTH = 24;

function sanitizeProcessNameSegment(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!normalized) {
    return null;
  }

  return normalized.slice(0, MAX_PROCESS_NAME_SEGMENT_LENGTH);
}

function joinANetProcessName(...segments: Array<string | null | undefined>): string {
  const sanitizedSegments = segments
    .map((segment) => sanitizeProcessNameSegment(segment))
    .filter((segment): segment is string => Boolean(segment));
  return [ANET_PROCESS_PREFIX, ...sanitizedSegments].join("-");
}

function pickWorkspaceTag(workspacePath: string | null | undefined): string | undefined {
  const trimmedPath = workspacePath?.trim();
  if (!trimmedPath) {
    return undefined;
  }

  const parts = trimmedPath.split(/[\\/]+/).filter(Boolean);
  return parts.at(-1) ?? trimmedPath;
}

export function formatANetMainProcessName(): string {
  return joinANetProcessName("main");
}

export function formatANetGpuProcessName(): string {
  return joinANetProcessName("gpu");
}

export function formatANetHostProcessName(label?: string): string {
  return joinANetProcessName("host", label);
}

export function formatANetRendererProcessName(windowTitle?: string): string {
  const normalizedTitle = windowTitle?.trim();
  if (!normalizedTitle || normalizedTitle === ANET_PRODUCT_NAME) {
    return joinANetProcessName("renderer", "main");
  }

  if (normalizedTitle === "Resource Manager") {
    return joinANetProcessName("renderer", "resource-manager");
  }

  const remoteWindowPrefix = `${ANET_PRODUCT_NAME} - `;
  if (normalizedTitle.startsWith(remoteWindowPrefix)) {
    return joinANetProcessName(
      "renderer",
      "remote",
      normalizedTitle.slice(remoteWindowPrefix.length),
    );
  }

  return joinANetProcessName("renderer", normalizedTitle);
}

export function formatANetAgentProcessName(provider: string, workspacePath?: string): string {
  return joinANetProcessName("agent", provider, pickWorkspaceTag(workspacePath));
}

export function formatANetUtilityProcessName(name?: string, type = "utility"): string {
  return joinANetProcessName(type, name);
}
