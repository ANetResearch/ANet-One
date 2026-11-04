import { expect, it } from "vitest";
import { createE2EStartupCredentialSeed } from "./e2e/helpers/e2e-startup-credentials.js";

it.each([
  "plugin-management-discovery-presentation.test.ts",
  "plugin-management-ui-market.test.ts",
  "conversation-session-plugin-marketplace-installed-roundtrip.test.ts",
  "plugin-store-auto-refresh-throttled.test.ts",
  "plugin-store-auto-refresh-on-enter.test.ts",
])("插件市场回放 %s 不注入真实账号控制面无效的身份", (spec) => {
  expect(
    createE2EStartupCredentialSeed({
      specs: [spec],
      legacyAuthToken: "fake-auth-token",
      restoredOAuthCredentials: {
        "oauth:active_provider": "family-b",
        "oauth:family-b:access_token": "fake-access-token",
        "oauth:family-b:user_info": "{}",
        anetjwttoken: "fake-anet-jwt",
      },
    }),
  ).toEqual({});
});
