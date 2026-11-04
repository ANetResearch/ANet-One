import { readFile } from "node:fs/promises";
import { clearAppData, getE2EAppDataPaths } from "./helpers/desktop-app.js";
import { FIXTURE_FAMILY_A_ID, FIXTURE_FAMILY_B_ID } from "./helpers/fixture-provider-ids.js";

const OAUTH_CREDENTIAL_KEYS = [
  "oauth:active_provider",
  `oauth:${FIXTURE_FAMILY_B_ID}:access_token`,
  `oauth:${FIXTURE_FAMILY_B_ID}:refresh_token`,
  `oauth:${FIXTURE_FAMILY_B_ID}:user_info`,
  `oauth:${FIXTURE_FAMILY_A_ID}:access_token`,
  `oauth:${FIXTURE_FAMILY_A_ID}:refresh_token`,
  `oauth:${FIXTURE_FAMILY_A_ID}:user_info`,
  "anetjwttoken",
] as const;

describe("OAuth 凭据损坏恢复", () => {
  after(async () => {
    await browser.electron.restoreAllMocks();
    await clearAppData();
  });

  it("冷启动遇到无法解密的 OAuth 凭据时清理损坏登录态并保留独立 bot 凭据", async () => {
    await waitForCorruptOAuthCredentialsCleanup();
    expect((await readCredentials())["bot:e2e:credential"]).toBe("e2e-independent-bot-token");
  });
});

async function waitForCorruptOAuthCredentialsCleanup() {
  try {
    await browser.waitUntil(
      async () => {
        const credentials = await readCredentials();
        return OAUTH_CREDENTIAL_KEYS.every((key) => !(key in credentials));
      },
      {
        timeout: 30000,
        timeoutMsg: "损坏 OAuth 凭据没有被清理",
      },
    );
  } catch (error) {
    const credentials = await readCredentials().catch(() => null);
    const keys = credentials ? Object.keys(credentials).sort().join(", ") : "<missing>";
    throw new Error(`损坏 OAuth 凭据没有被清理，当前凭据 key: ${keys}`, {
      cause: error,
    });
  }
}

async function readCredentials(): Promise<Record<string, string>> {
  const { credentialsFile } = getE2EAppDataPaths();
  return JSON.parse(await readFile(credentialsFile, "utf-8")) as Record<string, string>;
}
