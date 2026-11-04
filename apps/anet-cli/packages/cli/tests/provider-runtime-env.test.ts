import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import test from "node:test";
import {
  ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV,
  ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV,
} from "@anet/provider-node";
import {
  SEA_ANET_BUILTIN_PROVIDER_CONFIG_ASSET_KEY,
  prepareCliProviderRuntimeEnv,
} from "../src/provider-runtime-env.js";

const temporaryDirectories: string[] = [];

test.afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

test("preserves explicitly injected provider runtime paths", async () => {
  const prepared = await prepareCliProviderRuntimeEnv({
    argv: ["--prompt", "hello"],
    env: {
      [ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV]: "/injected/anet-builtin.json",
      [ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV]: "/injected/personal.json",
    },
  });

  assert.deepEqual(prepared, {
    [ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV]: "/injected/anet-builtin.json",
    [ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV]: "/injected/personal.json",
  });
});

test("resolves the development ANet Built-in Config and shared Personal Config", async () => {
  const root = await temporaryDirectory();
  const entrypoint = join(root, "apps/anet-cli/packages/cli/src/main.ts");
  const anetBuiltinFilePath = join(root, "config/provider/anet-builtin.json");
  await mkdir(dirname(entrypoint), { recursive: true });
  await mkdir(dirname(anetBuiltinFilePath), { recursive: true });
  // 随包配置按入口真实路径（解析软链接后）定位，入口文件必须真实存在。
  await writeFile(entrypoint, "");
  await writeFile(anetBuiltinFilePath, EMPTY_RELEASE);

  const prepared = await prepareCliProviderRuntimeEnv({
    argv: ["tui"],
    dataBaseDir: join(root, "home"),
    entrypoint,
    env: {},
    appVersion: "test-version",
    platform: "test-platform",
  });

  assertActiveConfigPath(prepared[ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV], join(root, "home"));
  assert.equal(
    prepared[ANET_PERSONAL_PROVIDER_CONFIG_FILE_ENV],
    join(root, "home/.anet-one/v2/provider_config.json"),
  );
  const activeFilePath = prepared[ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV];

  const loginPrepared = await prepareCliProviderRuntimeEnv({
    argv: ["login"],
    dataBaseDir: join(root, "home"),
    entrypoint,
    env: {},
    appVersion: "test-version",
    platform: "test-platform",
  });
  assert.equal(loginPrepared[ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV], activeFilePath);
  const logoutPrepared = await prepareCliProviderRuntimeEnv({
    argv: ["logout"],
    dataBaseDir: join(root, "home"),
    entrypoint,
    env: {},
    appVersion: "test-version",
    platform: "test-platform",
  });
  assert.equal(logoutPrepared[ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV], activeFilePath);
  // 临时目录本身可能经过软链接（macOS 的 /tmp、/var），随包配置报告的是真实路径。
  assert.equal(
    prepared.ANET_BUILTIN_PROVIDER_BUNDLED_CONFIG_FILE,
    await realpath(anetBuiltinFilePath),
  );
  await assert.rejects(access(join(dirname(activeFilePath!), "anet-builtin-refresh.json")));
});

test("materializes the SEA config in the fixed environment resource path, separate from downloads", async () => {
  const root = await temporaryDirectory();
  const anetBuiltinContent = EMPTY_RELEASE;
  let reads = 0;
  const prepared = await prepareCliProviderRuntimeEnv({
    argv: ["--prompt", "hello"],
    dataBaseDir: root,
    env: {},
    sea: {
      getAsset(key, encoding) {
        assert.equal(key, SEA_ANET_BUILTIN_PROVIDER_CONFIG_ASSET_KEY);
        assert.equal(encoding, "utf8");
        reads += 1;
        return anetBuiltinContent;
      },
      isSea: () => true,
    },
    appVersion: "test-version",
    platform: "test-platform",
  });

  const anetBuiltinFilePath = prepared[ANET_BUILTIN_PROVIDER_CONFIG_FILE_ENV];
  assert.ok(anetBuiltinFilePath);
  assertActiveConfigPath(anetBuiltinFilePath, root);
  assert.deepEqual(
    JSON.parse(await readFile(anetBuiltinFilePath, "utf8")),
    JSON.parse(anetBuiltinContent),
  );
  assert.equal(reads, 1);
  const resource = join(
    root,
    ".anet-one",
    "v2",
    "runtime",
    "provider",
    "bundled",
    "anet-builtin.json",
  );
  assert.notEqual(resource, anetBuiltinFilePath);
  assert.deepEqual(JSON.parse(await readFile(resource, "utf8")), JSON.parse(anetBuiltinContent));
  assert.equal(prepared.ANET_BUILTIN_PROVIDER_BUNDLED_CONFIG_FILE, resource);
  await assert.rejects(access(join(dirname(anetBuiltinFilePath), "anet-builtin-refresh.json")));
});

test("does not resolve provider assets for commands that do not run Core", async () => {
  assert.deepEqual(
    await prepareCliProviderRuntimeEnv({
      argv: ["doctor", "--json"],
      env: {},
    }),
    {},
  );
  for (const flag of ["--help", "-h", "--version", "-v"]) {
    assert.deepEqual(
      await prepareCliProviderRuntimeEnv({
        argv: [flag],
        env: {},
      }),
      {},
    );
  }
});

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "anet-cli-provider-runtime-"));
  temporaryDirectories.push(directory);
  return directory;
}

function assertActiveConfigPath(filePath: string | undefined, dataBaseDir: string): void {
  assert.ok(filePath);
  // 不能用斜杠正则误拒绝 Windows；逐层校验仍包含环境、平台、版本和 Endpoint。
  assert.equal(
    dirname(dirname(filePath)),
    join(dataBaseDir, ".anet-one", "v2", "runtime", "provider", "test-platform", "test-version"),
  );
  assert.match(basename(dirname(filePath)), /^endpoint-[a-f0-9]{32}$/u);
  assert.equal(basename(filePath), "anet-builtin.json");
}

const EMPTY_RELEASE =
  '{"schemaVersion":1,"revision":1,"config":{"providerConfigRules":{"templateRules":[],"providerRules":[]},"modelConfigRules":{"modelRules":[],"modelApiRules":[],"providerSiteRules":[],"templateModelRules":[],"builtinProviderModelRules":[]}}}';
