import { fork } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HttpClientPort, HttpClientRequest, HttpClientResponse } from "@anet/contracts";
import {
  CliOAuthError,
  SHARED_ANET_CREDENTIAL_KEYS,
  createCliOAuthClient,
  createCodingPlanApiKeyResolver,
  createSharedANetCredentialStore,
  loadSharedANetCredentialSync,
  resolveFamilyOAuthCredentialKeys,
} from "../src/auth/index.js";
import { registerModelProviderFamilySpecs } from "@anet/shared";

// 家族注册表在本分发中为空;这里注入一个夹具家族,验证凭据键按注册表推导。
// 本分发的 provider family 注册表为空;这里注册夹具家族,被测链路按注册表工作。
// 用 registerModelProviderFamilySpecs() 而不是 vi.mock("@anet/shared"):被 mock 的只是
// barrel 的导出,而 @anet/shared 内部的派生表引用的是同模块局部常量,
// model-provider-types.ts 又直接 import "./model-provider-family.js" —— 两者都绕不过
// barrel 上的 mock,mock 之后所有查询函数仍按空表工作。
registerModelProviderFamilySpecs([
  {
  id: "family-a",
  label: "Family A",
  rootDomain: "family-a.example",
  oauthProviderId: "family-a",
  startPlanProviderId: "family-a-start-plan",
  individualCodingPlanProviderId: "account:family-a-individual-coding-plan",
  teamCodingPlanProviderId: "account:family-a-team-coding-plan",
  teamCodingPlanManageUrl: "",
  },
]);

const FAMILY_ID = "family-a";
const FAMILY_KEYS = {
  accessToken: "oauth:family-a:access_token",
  refreshToken: "oauth:family-a:refresh_token",
  userInfo: "oauth:family-a:user_info",
};

const TEST_ENV = {
  ANET_CREDENTIAL_SECRET: "test-secret",
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("shared ANet credentials", () => {
  it("stores family login credentials under keys derived from the family registry", async () => {
    const dir = await mkdtemp(join(tmpdir(), "anet-auth-"));

    try {
      const store = createSharedANetCredentialStore({
        baseDir: dir,
        env: TEST_ENV,
      });

      await store.saveFamilyLoginCredentials(FAMILY_ID, {
        accessToken: "family-access-token",
        jwtToken: "anet-jwt-token",
        user: {
          email: "alice@example.com",
          name: "Alice",
          user_id: "u_1",
        },
      });

      const raw = JSON.parse(await readFile(store.filePath, "utf-8")) as Record<string, string>;
      expect(store.filePath).toBe(join(dir, ".anet-one", "v2", "credentials.json"));
      expect(resolveFamilyOAuthCredentialKeys(FAMILY_ID)).toEqual(FAMILY_KEYS);
      expect(raw[FAMILY_KEYS.accessToken]?.startsWith("enc:v1:")).toBe(true);
      expect(await store.load(SHARED_ANET_CREDENTIAL_KEYS.activeProvider)).toBe(FAMILY_ID);
      expect(await store.load(FAMILY_KEYS.accessToken)).toBe("family-access-token");
      expect(await store.load(SHARED_ANET_CREDENTIAL_KEYS.anetJwtToken)).toBe("anet-jwt-token");
      expect(
        loadSharedANetCredentialSync(FAMILY_KEYS.accessToken, {
          baseDir: dir,
          env: TEST_ENV,
        }),
      ).toBe("family-access-token");
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  });

  it("rejects login credential writes for an unregistered family", async () => {
    const dir = await mkdtemp(join(tmpdir(), "anet-auth-"));

    try {
      const store = createSharedANetCredentialStore({ baseDir: dir, env: TEST_ENV });

      expect(resolveFamilyOAuthCredentialKeys("unregistered")).toBeNull();
      await expect(
        store.saveFamilyLoginCredentials("unregistered", {
          accessToken: "token",
          jwtToken: "jwt",
          user: { user_id: "u_1" },
        }),
      ).rejects.toThrow("Unknown model provider family: unregistered");
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  });

  it("reads legacy plaintext credential values", async () => {
    const dir = await mkdtemp(join(tmpdir(), "anet-auth-"));
    const credentialsDir = join(dir, ".anet-one", "v2");
    const credentialsPath = join(credentialsDir, "credentials.json");

    try {
      await mkdir(credentialsDir, { recursive: true });
      await writeFile(
        credentialsPath,
        JSON.stringify({
          [FAMILY_KEYS.accessToken]: "legacy-token",
        }),
      );

      const store = createSharedANetCredentialStore({
        baseDir: dir,
        env: TEST_ENV,
      });

      expect(await store.load(FAMILY_KEYS.accessToken)).toBe("legacy-token");
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  });

  it("preserves every key across concurrent read-modify-write mutations", async () => {
    const dir = await mkdtemp(join(tmpdir(), "anet-auth-concurrent-"));
    const store = createSharedANetCredentialStore({
      baseDir: dir,
      env: TEST_ENV,
    });
    const entries = Array.from({ length: 40 }, (_, index) => [`key-${index}`, `value-${index}`]);

    try {
      await Promise.all(entries.map(([key, value]) => store.save(key!, value!)));

      await Promise.all(
        entries.map(async ([key, value]) => {
          await expect(store.load(key!)).resolves.toBe(value);
        }),
      );
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  });

  it("deletes a credential only when its expected plaintext value is still current", async () => {
    const dir = await mkdtemp(join(tmpdir(), "anet-auth-compare-delete-"));
    const store = createSharedANetCredentialStore({
      baseDir: dir,
      env: TEST_ENV,
    });

    try {
      await store.save("oauth:snapshot", "snapshot-a");

      await expect(store.deleteIfValue("oauth:snapshot", "stale-snapshot")).resolves.toBe(false);
      await expect(store.load("oauth:snapshot")).resolves.toBe("snapshot-a");
      await expect(store.deleteIfValue("oauth:snapshot", "snapshot-a")).resolves.toBe(true);
      await expect(store.load("oauth:snapshot")).resolves.toBeNull();
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  });

  it("publishes a replacement credential and removes legacy keys in one mutation", async () => {
    const dir = await mkdtemp(join(tmpdir(), "anet-auth-replace-"));
    const store = createSharedANetCredentialStore({
      baseDir: dir,
      env: TEST_ENV,
    });

    try {
      await store.save("oauth:legacy-client", "client-a");
      await store.save("oauth:legacy-tokens", "tokens-a");

      await store.saveReplacing("oauth:canonical", "pair-a", [
        "oauth:legacy-client",
        "oauth:legacy-tokens",
      ]);

      await expect(store.load("oauth:canonical")).resolves.toBe("pair-a");
      await expect(store.load("oauth:legacy-client")).resolves.toBeNull();
      await expect(store.load("oauth:legacy-tokens")).resolves.toBeNull();
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  });

  it("preserves every key across independent Node processes", async () => {
    const dir = await mkdtemp(join(tmpdir(), "anet-auth-processes-"));
    const credentialsPath = join(dir, "credentials.json");
    const processCount = 4;
    const keysPerProcess = 8;

    try {
      await runConcurrentCredentialWorkers(credentialsPath, processCount, keysPerProcess);
      const store = createSharedANetCredentialStore({
        env: TEST_ENV,
        filePath: credentialsPath,
      });
      await Promise.all(
        Array.from({ length: processCount }, (_, processIndex) =>
          Array.from({ length: keysPerProcess }, async (_, keyIndex) => {
            await expect(store.load(`worker-${processIndex}:key-${keyIndex}`)).resolves.toBe(
              `value-${processIndex}-${keyIndex}`,
            );
          }),
        ).flat(),
      );
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  }, 15_000);

  it("backs up corrupt JSON and refuses to overwrite it", async () => {
    const dir = await mkdtemp(join(tmpdir(), "anet-auth-corrupt-"));
    const credentialsPath = join(dir, "credentials.json");
    const store = createSharedANetCredentialStore({
      env: TEST_ENV,
      filePath: credentialsPath,
    });

    try {
      await writeFile(credentialsPath, "{not-json", {
        encoding: "utf-8",
        mode: 0o644,
      });

      await Promise.all(
        Array.from({ length: 8 }, () =>
          expect(store.load("safe-key")).rejects.toThrow("Shared ANet credentials are corrupt"),
        ),
      );
      await expect(store.save("safe-key", "safe-value")).rejects.toThrow(
        "Shared ANet credentials are corrupt",
      );
      await expect(readFile(credentialsPath, "utf-8")).resolves.toBe("{not-json");
      const backups = (await readdir(dir)).filter((file) =>
        /^credentials\.json\.corrupt-.*\.bak$/.test(file),
      );
      expect(backups).toHaveLength(1);
      await expect(readFile(join(dir, backups[0]!), "utf-8")).resolves.toBe("{not-json");
      if (process.platform !== "win32") {
        expect((await stat(join(dir, backups[0]!))).mode & 0o777).toBe(0o600);
      }
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  });

  it("deduplicates corrupt credential backups across independent Node processes", async () => {
    const dir = await mkdtemp(join(tmpdir(), "anet-auth-corrupt-processes-"));
    const credentialsPath = join(dir, "credentials.json");

    try {
      await writeFile(credentialsPath, "{not-json", "utf-8");
      await runConcurrentCredentialWorkers(credentialsPath, 6, 0, "read-corrupt");

      const backups = (await readdir(dir)).filter((file) =>
        /^credentials\.json\.corrupt-.*\.bak$/.test(file),
      );
      expect(backups).toHaveLength(1);
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  });
});

async function runConcurrentCredentialWorkers(
  filePath: string,
  processCount: number,
  keysPerProcess: number,
  operation: "save" | "read-corrupt" = "save",
): Promise<void> {
  const workerUrl = new URL("./fixtures/shared-credentials-concurrent-process.ts", import.meta.url);
  const children = Array.from({ length: processCount }, (_, processIndex) =>
    fork(workerUrl, {
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
      execArgv: ["--import", "tsx"],
      stdio: ["ignore", "ignore", "inherit", "ipc"],
    }),
  );

  try {
    await Promise.all(
      children.map(
        (child) =>
          new Promise<void>((resolve, reject) => {
            child.once("error", reject);
            child.once("exit", (code) =>
              reject(new Error(`credential child exited early: ${code}`)),
            );
            child.on("message", (message: { type?: unknown }) => {
              if (message.type === "ready") resolve();
            });
          }),
      ),
    );

    const results = children.map(
      (child) =>
        new Promise<void>((resolve, reject) => {
          child.once("error", reject);
          child.once("exit", (code) => {
            if (code !== 0) reject(new Error(`credential child exited with code ${code}`));
          });
          child.on("message", (message: { error?: unknown; type?: unknown }) => {
            if (message.type === "done") resolve();
            if (message.type === "error") reject(new Error(String(message.error)));
          });
        }),
    );

    children.forEach((child, processIndex) => {
      child.send({
        filePath,
        keysPerProcess,
        operation,
        processIndex,
        type: "start",
      });
    });
    await Promise.all(results);
  } finally {
    for (const child of children) {
      if (child.connected) child.disconnect();
      child.kill();
    }
  }
}

// CLI 浏览器登录的轮询客户端按 providerId 泛化（家族 id），ready 数据统一为 accessToken。
describe("CLI OAuth client", () => {
  it("initializes and polls the backend device flow", async () => {
    const httpClient = new FakeHttpClient([
      jsonResponse({
        code: 0,
        msg: "",
        data: {
          flow_id: "flow-1",
          poll_token: "poll-token",
          authorize_url: "https://auth.vendor-a.example/oauth/authorize?state=state",
          expires_at: 1735000000,
          poll_interval_sec: 2,
        },
      }),
      jsonResponse({
        code: 0,
        msg: "",
        data: {
          status: "ready",
          token: "jwt-token",
          user: {
            user_id: "u_1",
            email: "alice@example.com",
            name: "Alice",
          },
          "family-a": {
            access_token: "family-access-token",
          },
        },
      }),
    ]);
    const client = createCliOAuthClient({
      baseUrl: "https://anet.example/api/v1/",
      httpClient,
      providerId: "family-a",
    });

    const init = await client.init({ pollToken: "poll-token" });
    const poll = await client.poll({
      flowId: init.flow_id,
      pollToken: "poll-token",
    });

    expect(httpClient.requests[0]).toMatchObject({
      method: "POST",
      url: "https://anet.example/api/v1/oauth/cli/init",
      headers: {
        Authorization: "Bearer poll-token",
        "Content-Type": "application/json",
      },
    });
    expect(new TextDecoder().decode(httpClient.requests[0]?.body)).toBe('{"provider":"family-a"}');
    expect(httpClient.requests[1]).toMatchObject({
      method: "GET",
      url: "https://anet.example/api/v1/oauth/cli/poll/flow-1",
      headers: {
        Authorization: "Bearer poll-token",
      },
    });
    expect(poll).toMatchObject({
      status: "ready",
      token: "jwt-token",
      providerId: "family-a",
      accessToken: "family-access-token",
    });
  });

  it("surfaces backend business errors", async () => {
    const client = createCliOAuthClient({
      httpClient: new FakeHttpClient([
        jsonResponse({
          code: 3004,
          msg: "invalid_flow",
          data: {},
        }),
      ]),
      providerId: "family-a",
    });

    await expect(client.init({ pollToken: "poll-token" })).rejects.toMatchObject({
      businessCode: 3004,
      message: "invalid_flow",
      name: "CliOAuthError",
    } satisfies Partial<CliOAuthError>);
  });
});
describe("Coding Plan API key resolver", () => {
  // 未注册任何厂商换证实现：解析必须返回明确的“不可用”错误，而不是伪造令牌。
  it("reports unavailable when no provider is registered", async () => {
    const resolver = createCodingPlanApiKeyResolver({ httpClient: new FakeHttpClient([]) });
    await expect(
      resolver.resolve({ accessToken: "login-token", family: "any" }),
    ).rejects.toMatchObject({
      name: "CodingPlanApiKeyError",
      message: "project_token_unavailable",
    });
  });

  it("requires a login token", async () => {
    const resolver = createCodingPlanApiKeyResolver({ httpClient: new FakeHttpClient([]) });
    await expect(resolver.resolve({ accessToken: " ", family: "any" })).rejects.toThrow(
      "project_token_login_required",
    );
  });
});

class FakeHttpClient implements HttpClientPort {
  readonly requests: HttpClientRequest[] = [];

  constructor(private readonly responses: HttpClientResponse[]) {}

  async request(request: HttpClientRequest): Promise<HttpClientResponse> {
    this.requests.push(request);
    const response = this.responses.shift();
    if (!response) {
      throw new Error("No fake response configured");
    }
    return response;
  }
}

function jsonResponse(body: unknown, status = 200): HttpClientResponse {
  const encoded = new TextEncoder().encode(JSON.stringify(body));
  return {
    body: encoded,
    bytes: encoded.byteLength,
    durationMs: 1,
    headers: {
      "content-type": "application/json",
    },
    status,
    statusText: status === 200 ? "OK" : "Error",
    url: "https://anet.example/api/v1",
  };
}
