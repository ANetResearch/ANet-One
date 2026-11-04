import { describe, expect, it } from "vitest";
import { resourcePath } from "./routes.ts";

const SITE = "1978123456789012480";
const DEP = "1978123456789012481";

describe("resourcePath", () => {
  it.each([
    ["anet-site://usage", "/api/v1/sites/usage"],
    ["anet-site://plans", "/api/v1/sites/plans"],
    ["anet-site://sites", "/api/v1/sites"],
    ["anet-site://sites?cursor=", "/api/v1/sites"],
    ["anet-site://sites?cursor=a%2Fb&limit=20", "/api/v1/sites?cursor=a%2Fb&limit=20"],
    [`anet-site://sites/${SITE}`, `/api/v1/sites/${SITE}`],
    [
      `anet-site://sites/${SITE}/deployments?cursor=x`,
      `/api/v1/sites/${SITE}/deployments?cursor=x`,
    ],
    [`anet-site://sites/${SITE}/deployments/${DEP}`, `/api/v1/sites/${SITE}/deployments/${DEP}`],
    [`anet-site://sites/${SITE}/cover`, `/api/v1/sites/${SITE}/cover`],
    [
      `anet-site://sites/${SITE}/deployments/${DEP}/logs?offset=12`,
      `/api/v1/sites/${SITE}/deployments/${DEP}/logs?offset=12`,
    ],
  ])("maps %s", (uri, path) => {
    expect(resourcePath(uri)).toBe(path);
  });

  it.each([
    "anet-site://other",
    "https://sites/1",
    "anet-site://usage?cursor=1",
    "anet-site://plans?limit=1",
    "anet-site://plans/free",
    "anet-site://sites/abc",
    "anet-site://sites/0123",
    "anet-site://sites/1/deployments/2/logs/extra",
    "anet-site://sites/1/cover/2",
    "anet-site://sites/1/cover?offset=1",
    "anet-site://sites/1/settings",
    "anet-site://sites/1/deployments/2/logs?offset=-1",
    "anet-site://sites?limit=1e3",
    "anet-site://sites?cursor=a&cursor=b",
    "anet-site://sites/1/deployments/2?offset=1",
    "anet-site://user@sites",
    "anet-site://sites/..%2Fusage",
    "not a uri",
  ])("rejects %s", (uri) => {
    expect(resourcePath(uri)).toBeUndefined();
  });
});
