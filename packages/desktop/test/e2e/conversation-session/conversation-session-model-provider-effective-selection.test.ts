import { ProviderConfig } from "@anet/provider";
import { NodePersonalProviderConfigRepository } from "@anet/provider-node";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import type { ModelSelection } from "@anet/shared";
import {
  TID_MODEL_PROVIDER_CONNECTION_MODE_ITEM,
  TID_MODEL_PROVIDER_CONNECTION_MODE_TRIGGER,
  TID_MODEL_PROVIDER_NAV_ITEM,
  TID_SETTINGS_BACK_BUTTON,
  TID_SETTINGS_SECTION_NAV,
  TID_TASK_SETTINGS_BUTTON,
  testId,
} from "@anet/shared/test-ids";
import {
  clearAppData,
  clickTestIdByDom,
  DEFAULT_WORKSPACE,
  waitForWorkspaceApp,
  getE2EAppDataPaths,
} from "../helpers/desktop-app.js";
import {
  FIXTURE_INDIVIDUAL_PLAN_PROVIDER_ID,
  FIXTURE_START_PLAN_PROVIDER_ID,
  FIXTURE_TEAM_PLAN_PROVIDER_ID,
} from "../helpers/fixture-provider-ids.js";
import {
  E2E_PLAN_DEFAULT_MODEL,
  E2E_PLAN_NON_DEFAULT_MODEL,
  restartIntoWorkspace,
  seedFamilyConnectionSelection,
  seedFamilyOAuthCredential,
  readFamilyConnectionSelection,
  waitForDraftThoughtLevelState,
  waitForSelectedModel,
  waitForPlanModelIoRequest,
} from "../helpers/model-provider-restart.js";
import {
  getV4ComposerText,
  prepareV4ConversationE2E,
  setV4ComposerText,
  switchV4Model,
  sendV4PromptAndWaitAccepted,
  waitForV4TimelineContaining,
  waitForV4Pane,
  E2E_REPLY_TOKEN,
} from "#e2e/helpers/v4-conversation";
import { startDraftFromProject } from "#e2e/helpers/project-sidebar";
import { sel } from "../helpers/selectors.js";

const individual = FIXTURE_INDIVIDUAL_PLAN_PROVIDER_ID;
const team = FIXTURE_TEAM_PLAN_PROVIDER_ID;

describe("SR87 当前有效选择与原意图", () => {
  after(async () => {
    await browser.electron.restoreAllMocks();
    await clearAppData();
  });

  it("R95C-01: 旧关闭档位只读对应，发送后保存 disabled，实际请求关闭思考", async function () {
    this.timeout(180000);
    await prepareV4ConversationE2E({ skipProvider: true });
    await restartIntoWorkspace({
      afterElectronProcessExit: async () => {
        await seedFamilyConnectionSelection({ kind: "individual-coding-plan" });
        await seedFamilyOAuthCredential();
        await seedLegacyDisabledPlanModel();
      },
    });
    await waitForWorkspaceApp(DEFAULT_WORKSPACE, 30000);
    await selectConnection(`coding-plan:${individual}`);
    // 冷启动的默认 workspace 尚未经过项目草稿导航，先从真实项目入口建立作用域。
    await startDraftFromProject(DEFAULT_WORKSPACE);
    const draftStorageKey = await currentDraftStorageKey();
    await switchV4Model(individual, E2E_PLAN_DEFAULT_MODEL, "disabled");
    await setV4ComposerText("E2E_R95C_LEGACY_DRAFT");
    await browser.waitUntil(
      async () =>
        await browser.execute((workspace) => {
          const value = JSON.parse(localStorage.getItem(workspace) ?? "{}");
          return value.scopes?.__draft__?.text === "E2E_R95C_LEGACY_DRAFT";
        }, draftStorageKey),
      { timeout: 10000 },
    );
    // 旧页面 beforeunload 会刷新内存草稿；在其后 pagehide 才注入旧存储，避免 fixture 被退出保存覆盖。
    const previousDocument = await browser.execute(() => performance.timeOrigin);
    await browser.execute(
      (workspace, providerId) => {
        const key = workspace;
        window.addEventListener(
          "pagehide",
          () => {
            const value = JSON.parse(localStorage.getItem(key)!);
            value.scopes.__draft__.modelSelection = {
              providerId,
              modelId: E2E_PLAN_DEFAULT_MODEL,
              options: { reasoningLevel: "nothink" },
            };
            localStorage.setItem(key, JSON.stringify(value));
          },
          { once: true },
        );
        window.location.reload();
      },
      draftStorageKey,
      individual,
    );
    await browser.waitUntil(
      async () => (await browser.execute(() => performance.timeOrigin)) !== previousDocument,
      { timeout: 15000, timeoutMsg: "旧选择 fixture 后 Renderer 未重新加载" },
    );
    await waitForWorkspaceApp(DEFAULT_WORKSPACE, 30000);
    await waitForSelectedModel(individual, E2E_PLAN_DEFAULT_MODEL);
    await waitForDraftThoughtLevelState({
      current: "disabled",
      values: ["disabled", "high", "max"],
    });
    const beforeEditing = await browser.execute(
      (workspace) =>
        JSON.parse(localStorage.getItem(workspace) ?? "{}").scopes?.__draft__?.modelSelection,
      draftStorageKey,
    );
    expect(beforeEditing?.options?.reasoningLevel).toBe("nothink");
    await setV4ComposerText("E2E_R95C_EDIT_TEXT_ONLY");
    await browser
      .waitUntil(
        async () =>
          await browser.execute((workspace) => {
            const draft = JSON.parse(localStorage.getItem(workspace) ?? "{}").scopes?.__draft__;
            return (
              draft?.text === "E2E_R95C_EDIT_TEXT_ONLY" &&
              draft.modelSelection?.options?.reasoningLevel === "nothink"
            );
          }, draftStorageKey),
        { timeout: 10000, timeoutMsg: "只读解析或正文编辑改写了原档位" },
      )
      .catch(async (error) => {
        const persisted = await browser.execute(
          (workspace) => localStorage.getItem(workspace),
          draftStorageKey,
        );
        throw new Error(
          `${String(error)}; beforeEditing=${JSON.stringify(beforeEditing)}; persisted=${persisted}`,
        );
      });
    await sendV4PromptAndWaitAccepted(
      "E2E_R95C_SEND: Reply briefly.",
      "E2E_R95C_SEND",
      "旧关闭档位发送未接纳",
      20000,
    );
    const request = await waitForPlanModelIoRequest("E2E_R95C_SEND");
    expect(request).toMatchObject({
      model: E2E_PLAN_DEFAULT_MODEL,
      thinking: { type: "disabled" },
    });
    expect(request).not.toHaveProperty("output_config.effort");
    await waitForV4TimelineContaining("coding-plan-e2e-ok");
    await expectAcceptedSelection({
      providerId: individual,
      modelId: E2E_PLAN_DEFAULT_MODEL,
      options: { reasoningLevel: "disabled" },
    });
  });

  it("SR87-01: 套餐切换只对应当前模型和档位，正文保存不覆盖原选择", async function () {
    this.timeout(180000);
    await prepareV4ConversationE2E({ skipProvider: true });
    await restartIntoWorkspace({
      afterElectronProcessExit: async () => {
        await seedFamilyConnectionSelection({ kind: "individual-coding-plan" });
        await seedFamilyOAuthCredential();
      },
    });
    const original = {
      providerId: individual,
      modelId: E2E_PLAN_NON_DEFAULT_MODEL,
      options: { reasoningLevel: "high" },
    };
    await waitForWorkspaceApp(DEFAULT_WORKSPACE, 30000);
    await selectConnection(`coding-plan:${individual}`);
    // 冷启动的默认 workspace 尚未经过项目草稿导航，先从真实项目入口建立作用域。
    await startDraftFromProject(DEFAULT_WORKSPACE);
    const draftStorageKey = await currentDraftStorageKey();
    // 从真实选择入口建立用户意图，不在已挂载编辑器背后修改 localStorage。
    await switchV4Model(individual, original.modelId, "high");
    try {
      await waitForSelectedModel(individual, original.modelId);
    } catch (error) {
      const state = await browser.execute(() => ({
        text: document.body.innerText.slice(-5000),
        drafts: Object.fromEntries(
          Object.entries(localStorage).filter(([key]) =>
            key.startsWith("anet-v4-composer-drafts:v1:"),
          ),
        ),
      }));
      throw new Error(`${String(error)}; initialState=${JSON.stringify(state)}`);
    }
    await setV4ComposerText("E2E_SR87_ACCOUNT_INTENT");

    await selectConnection("team:family-a:product-team-a:org-team-a:proj-team-a");

    await waitForSelectedModel(team, original.modelId);
    await waitForDraftThoughtLevelState({ current: "high", values: ["low", "high", "max"] });
    expect(await getV4ComposerText()).toBe("E2E_SR87_ACCOUNT_INTENT");
    await setV4ComposerText("E2E_SR87_ACCOUNT_INTENT_EDITED");
    await browser.waitUntil(
      async () => {
        const draft = await browser.execute(
          (workspace) => JSON.parse(localStorage.getItem(workspace) ?? "{}").scopes?.__draft__,
          draftStorageKey,
        );
        return draft?.text === "E2E_SR87_ACCOUNT_INTENT_EDITED";
      },
      { timeout: 10000, timeoutMsg: "正文没有保存" },
    );
    const saved = await browser.execute(
      (workspace) =>
        JSON.parse(localStorage.getItem(workspace) ?? "{}").scopes?.__draft__?.modelSelection,
      draftStorageKey,
    );
    expect(saved).toEqual(original);
    try {
      await sendV4PromptAndWaitAccepted(
        `E2E_SR87_ACCOUNT_SEND: Reply with exactly "${E2E_REPLY_TOKEN}".`,
        "E2E_SR87_ACCOUNT_SEND",
        "账号对应后的首发未接纳",
        20000,
      );
    } catch (error) {
      const text = await browser.execute(() => document.body.innerText.slice(-5000));
      throw new Error(`${String(error)}; visible=${text}`);
    }
    // Account 请求走套餐 Mock 的 Endpoint，不经过 Personal 上游 回放代理。
    // 读取真实 Agent model-io，验证发出的最终请求而不是盯错代理造成假失败。
    const request = await waitForPlanModelIoRequest("E2E_SR87_ACCOUNT_SEND");
    expect(request).toMatchObject({
      model: original.modelId,
      thinking: { type: "enabled" },
      output_config: { effort: "high" },
    });
    // 等模型实际返回的固定回复，而不是正文中用户自己写入的 reply token。
    await waitForV4TimelineContaining("coding-plan-e2e-ok");
    await expectAcceptedSelection({ ...original, providerId: team });
  });
});

async function selectConnection(key: string) {
  await clickTestIdByDom(TID_TASK_SETTINGS_BUTTON, { timeout: 15000 });
  await clickTestIdByDom(testId(TID_SETTINGS_SECTION_NAV, "modelProvider"), { timeout: 15000 });
  await clickTestIdByDom(
    testId(TID_MODEL_PROVIDER_NAV_ITEM, `preset:${FIXTURE_START_PLAN_PROVIDER_ID}`),
    { timeout: 30000 },
  );
  await clickTestIdByDom(TID_MODEL_PROVIDER_CONNECTION_MODE_TRIGGER, { timeout: 15000 });
  const option = await $(sel(testId(TID_MODEL_PROVIDER_CONNECTION_MODE_ITEM, key)));
  await option.waitForDisplayed({ timeout: 30000 });
  await option.click();
  // 点击触发异步保存；用例先建立已保存连接，不能把旧设置当成后续选模的前提。
  const expectedKind = key.startsWith("team:") ? "team-coding-plan" : "individual-coding-plan";
  await browser.waitUntil(
    async () => (await readFamilyConnectionSelection())?.kind === expectedKind,
    {
      timeout: 15000,
      timeoutMsg: `连接方式尚未保存：${key}`,
    },
  );
  await clickTestIdByDom(TID_SETTINGS_BACK_BUTTON, { timeout: 15000 });
}

async function seedLegacyDisabledPlanModel() {
  // 默认套餐已下架历史模型；兼容回归显式提供该模型，能力和请求映射仍继承正式规则。
  const repository = new NodePersonalProviderConfigRepository({
    filePath: getE2EAppDataPaths().configFile,
    pollingIntervalMs: false,
  });
  try {
    await repository.update((current) => ({
      ...current,
      providers: current.providers.setRule({
        providerId: individual,
        config: new ProviderConfig({ personalModelIds: [E2E_PLAN_DEFAULT_MODEL] }),
      }),
    }));
  } finally {
    repository.dispose();
  }
}

async function currentDraftStorageKey() {
  return browser.execute((workspace) => {
    const raw = localStorage.getItem(
      `anet-composer-workspace-scope:v1:${JSON.stringify(["desktop", workspace])}`,
    );
    if (!raw) throw new Error("草稿缺少 workspace 到项目 scope 的映射");
    const intent = JSON.parse(raw);
    return `anet-v4-composer-project-drafts:v1:${JSON.stringify([
      intent.clientNamespace,
      intent.hostId,
      intent.projectId,
    ])}`;
  }, DEFAULT_WORKSPACE);
}

async function expectAcceptedSelection(expected: ModelSelection) {
  const state = await waitForV4Pane(
    (pane) => Boolean(pane.sessionId) && pane.sessionId !== "draft" && !pane.canStop,
    "接纳后的会话未完成",
  );
  // 空正文不保存 Composer 草稿；接纳结果以 CLI 会话持久化为准。
  const db = new DatabaseSync(join(getE2EAppDataPaths().storageRoot, "cli/db/db.sqlite"), {
    readOnly: true,
  });
  try {
    const row = db
      .prepare(
        "SELECT data FROM session_entry WHERE session_id=? AND type='runtime/model_selection' ORDER BY id DESC LIMIT 1",
      )
      .get(state.sessionId!);
    expect(row).toBeDefined();
    expect(JSON.parse(String(row!.data)).modelSelection).toEqual(expected);
  } finally {
    db.close();
  }
}
