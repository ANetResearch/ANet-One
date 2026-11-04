import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSqliteSessionStore } from "@anet/adapters/storage";
import { describe, expect, it, vi } from "vitest";
import { createRegistryBackedTestApp } from "./helpers/registry-backed-test-app.js";
import type { ANetApp } from "../src/app/types.js";
import { registerModelProviderFamilySpecs } from "@anet/shared";

// 本分发的 provider family 注册表为空;这里注册夹具家族,被测链路按注册表工作。
// 用 registerModelProviderFamilySpecs() 而不是 vi.mock("@anet/shared"):被 mock 的只是
// barrel 的导出,而 @anet/shared 内部的派生表引用的是同模块局部常量,
// model-provider-types.ts 又直接 import "./model-provider-family.js" —— 两者都绕不过
// barrel 上的 mock,mock 之后所有查询函数仍按空表工作。
registerModelProviderFamilySpecs(
  ["family-a", "family-b"].map((id) => ({
    id,
    label: id,
    rootDomain: `${id}.invalid`,
    oauthProviderId: id,
    startPlanProviderId: `account:${id}-start-plan`,
    individualCodingPlanProviderId: `account:${id}-individual-coding-plan`,
    teamCodingPlanProviderId: `account:${id}-team-coding-plan`,
    teamCodingPlanManageUrl: "",
  })),
);


const { resolveRuntimeConfig } = vi.hoisted(() => ({ resolveRuntimeConfig: vi.fn() }));
vi.mock("../src/app/runtime-config.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/app/runtime-config.js")>();
  return {
    ...original,
    resolveAppRuntimeConfig: (...args: Parameters<typeof original.resolveAppRuntimeConfig>) => {
      resolveRuntimeConfig(...args);
      return original.resolveAppRuntimeConfig(...args);
    },
  };
});

describe("App 初始化旧 Subagent 身份", () => {
  // 真实文件迁移与 App 初始化在高负载下可能超过默认 5 秒，保留全部迁移顺序断言。
  // 本分发不内置厂商 provider,旧 `builtin:*` id 没有可落的当前身份:
  // migrateLegacyModelProviderId 对所有 `builtin:*` 返回 undefined,
  // migrateLegacyOfficialModelId 原样返回模型名(见
  // packages/shared/src/legacy-model-provider-identity.ts 的说明)。因此
  // migrateSubagentMarkdownProvider 不会改写任何 model 行 —— 用户目录与项目目录的
  // Markdown 都保持原字节,旧身份原样进入 Runtime。本用例守的是这件事:
  // Subagent 身份不会在初始化时被暗中改写,同时 agents-state.json 仍完成结构迁移
  // (builtInModelOverrides → builtInModelSelectionOverrides)。
  it("用户目录与项目目录都不改写 Markdown；旧身份原样进入 Runtime，状态文件只换结构", async () => {
    const root = await mkdtemp(join(tmpdir(), "anet-subagent-init-"));
    const directory = join(root, ".anet-one", "agents");
    const file = join(directory, "legacy.md");
    const markdown =
      "---\nname: legacy\ndescription: legacy profile\nmodel: builtin:family-b-coding-plan/model-b\nthoughtLevel: high\n---\nreview";
    const store = await createSqliteSessionStore({ dbPath: ":memory:" });
    let app: ANetApp | undefined;
    let creation: Promise<ANetApp> | undefined;
    try {
      await mkdir(directory, { recursive: true });
      await writeFile(file, markdown);
      const userRoot = join(root, "storage", "agents");
      await mkdir(userRoot, { recursive: true });
      await writeFile(
        join(userRoot, "user.md"),
        markdown.replace("name: legacy", "name: user-legacy"),
      );
      await mkdir(join(root, "storage", "v2"), { recursive: true });
      const stateFile = join(root, "storage", "v2", "agents-state.json");
      await writeFile(
        stateFile,
        JSON.stringify({
          builtInModelOverrides: { Explore: "builtin:family-b-coding-plan/model-b" },
          builtInThoughtLevelOverrides: { Explore: "high" },
        }),
      );
      resolveRuntimeConfig.mockClear();
      creation = Promise.resolve(
        createRegistryBackedTestApp({
          env: { ANET_STORAGE_DIR: join(root, "storage") },
          skipUserConfig: true,
          sessionStore: store,
          runtimeConfig: { workingDirectory: root, mcp: { enabled: false } },
        }),
      );
      app = await creation;
      const legacySelection = {
        providerId: "builtin:family-b-coding-plan",
        modelId: "model-b",
        options: { reasoningLevel: "high" },
      };
      // 用户目录的 Profile 与项目目录的 Profile 读到同一个旧身份:没有可落的新 id,
      // 两边都不改写。
      expect(resolveRuntimeConfig.mock.calls[0]?.[0].subagentProfiles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "user-legacy",
            source: "user",
            modelSelection: legacySelection,
          }),
        ]),
      );
      expect(resolveRuntimeConfig.mock.calls[0]?.[0].subagentProfiles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "legacy",
            source: "project",
            modelSelection: legacySelection,
          }),
        ]),
      );
      // 两个 Markdown 都保持原字节:身份没有被静默换掉,也没有被"规范"成别的写法。
      expect(await readFile(join(userRoot, "user.md"), "utf8")).toBe(
        markdown.replace("name: legacy", "name: user-legacy"),
      );
      expect(await readFile(file, "utf8")).toBe(markdown);
      // 状态文件的结构迁移与身份迁移是两件事:旧的字符串 map 仍要换成正式的选择 map,
      // 只是其中的 provider id 原样保留。
      const migratedState = JSON.parse(await readFile(stateFile, "utf8"));
      expect(migratedState.builtInModelSelectionOverrides.Explore).toEqual(legacySelection);
      // 旧字段不删除:回滚到旧版本仍要能读到它(与 0020 的"旧对象不删除、不覆盖"同一条)。
      expect(migratedState.builtInModelOverrides).toEqual({
        Explore: "builtin:family-b-coding-plan/model-b",
      });
    } finally {
      app ??= await creation;
      await app?.close?.();
      store.close();
      await rm(root, { recursive: true, force: true });
    }
  }, 30_000);
});
