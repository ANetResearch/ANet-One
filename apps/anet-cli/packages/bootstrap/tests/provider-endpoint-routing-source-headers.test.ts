import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { arch as readOsArch, release as readOsRelease, tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createProviderEndpointRoutingSourceHeaders } from "../src/provider-endpoint-routing-source-headers.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })),
  );
});

describe("createProviderEndpointRoutingSourceHeaders", () => {
  it("adds runtime attribution and reuses an existing deviceMid for the config GET", async () => {
    const dataBaseDir = await mkdtemp(
      join(tmpdir(), "anet-routing-source-headers-"),
    );
    tempDirs.push(dataBaseDir);
    const stateDir = join(dataBaseDir, ".anet-one", "v2");
    await mkdir(stateDir, { recursive: true });
    await writeFile(
      join(stateDir, "telemetry-state.json"),
      JSON.stringify({ deviceMid: "mid-routing-1" }),
      "utf8",
    );

    const headers = await createProviderEndpointRoutingSourceHeaders({
      appVersion: "1.2.3",
      env: {
        ANET_DATA_BASE_DIR: dataBaseDir,
        ANET_ENV: "test",
        ANET_TEST_BASE_URL: "https://routing-config.example.test",
      },
      sourceTitle: "electron",
    });

    expect(headers).toMatchObject({
      "HTTP-Referer": "https://routing-config.example.test",
      "User-Agent": "ANet/1.2.3",
      "X-Client-Language": expect.any(String),
      "X-Client-Timezone": expect.any(String),
      "X-Device-Mid": "mid-routing-1",
      "X-Os-Category": osCategory(process.platform),
      "X-Os-Version": readOsRelease(),
      "X-Platform": `${process.platform}-${readOsArch()}`,
      "X-Release-Channel": "test",
      "X-Title": "ANet One@electron",
      "X-ANet-App-Version": "1.2.3",
    });
    expect(headers).not.toHaveProperty("Authorization");
  });

  it("defaults to CLI attribution and does not create a missing device identity", async () => {
    const dataBaseDir = await mkdtemp(
      join(tmpdir(), "anet-routing-no-device-mid-"),
    );
    tempDirs.push(dataBaseDir);

    const headers = await createProviderEndpointRoutingSourceHeaders({
      // 本分发不内置产品服务端地址:ANET_ENV=production 时没有缺省 origin,
      // resolveRuntimeANetEndpointOrigin 返回空串(anetEndpoint.ts 的
      // DEFAULT_ANET_ENDPOINT_ORIGIN)。"未配置时 HTTP-Referer 为空、不回落到任何默认
      // 域名"由 model-default-headers-wire.test.ts 单独守着;这一条要验的是
      // production 通道下的归因,所以显式给一个 production 地址,
      // 让 HTTP-Referer 断言仍然落在"按已配置的 endpoint 归因"上。
      env: {
        ANET_DATA_BASE_DIR: dataBaseDir,
        ANET_ENV: "production",
        ANET_PRODUCTION_BASE_URL: "https://routing-production.example.test",
        ANET_APP_VERSION: "2.0.0",
      },
    });

    expect(headers).toMatchObject({
      "HTTP-Referer": "https://routing-production.example.test",
      "User-Agent": "ANet/2.0.0",
      "X-Release-Channel": "production",
      "X-Title": "ANet One@cli",
    });
    expect(headers).not.toHaveProperty("X-Device-Mid");
  });
});

function osCategory(platform: NodeJS.Platform): string {
  if (platform === "darwin") return "macos";
  if (platform === "win32") return "windows";
  return "linux";
}
