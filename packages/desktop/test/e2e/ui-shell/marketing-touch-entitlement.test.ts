import { encodeCustomModelValue } from "@anet/shared";
import {
  TID_CHAT_MODEL_SELECT_GROUP,
  TID_CHAT_MODEL_SELECT_ITEM,
  TID_CHAT_MODEL_SELECT_TRIGGER,
  TID_MODEL_PROVIDER_CONNECTION_MODE_ITEM,
  TID_MODEL_PROVIDER_CONNECTION_MODE_TRIGGER,
  TID_MODEL_PROVIDER_NAV_ITEM,
  TID_MODEL_PROVIDER_START_PLAN_COUNT_SHORTCUT,
  TID_SETTINGS_PAGE,
  TID_SETTINGS_SECTION_NAV,
  TID_SUBAGENT_ROW,
  TID_TASK_SETTINGS_BUTTON,
  testId,
} from "@anet/shared/test-ids";
import {
  clearAppData,
  waitForDefaultWorkspaceReady,
  clickTestIdByDom,
  clickTestIdByWebDriver,
  readSettings,
  seedSettings,
  waitForTestIdByDom,
} from "../helpers/desktop-app.js";
import {
  FIXTURE_FAMILY_A_ID,
  FIXTURE_INDIVIDUAL_PLAN_PROVIDER_ID,
  FIXTURE_START_PLAN_PROVIDER_ID,
} from "../helpers/fixture-provider-ids.js";

describe("Marketing Touch 领取后的权益与模型连接", () => {
  after(async () => {
    await browser.electron.restoreAllMocks();
    await clearAppData();
  });
  it("MTC-06 / BSM-20：领取后的权益刷新与连接切换互不覆盖", async function () {
    this.timeout(120_000);
    // 通过隔离服务 fixture 准备已领取状态；真实 Banner/安全校验/上报链路由 delivery 用例覆盖。
    const base = process.env[MANUAL_CLAIM_MOCK_BASE_URL_ENV];
    if (!base) throw new Error("Missing isolated marketing fixture");
    // 多个 spec 共用 HTTP 服务；显式重建本例的独立弹窗，不能依赖前例残留。
    await fetch(base + "/__e2e/marketing/reset", {
      method: "POST",
      body: JSON.stringify({ popup: true }),
    });
    await fetch(base + "/__e2e/marketing/release", { method: "POST" });
    await fetch(base + "/api/v1/anet-plan/billing/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: "weekend-plan-e2e" }),
    });
    // 复现升级用户：旧 Start 连接保持可读，领取和浏览不能自动改写为付费套餐。
    await seedSettings({
      providerFamilyConnectionSelections: { [FIXTURE_FAMILY_A_ID]: { kind: "start-plan" } },
    });
    await browser.reloadSession();
    await waitForDefaultWorkspaceReady();
    const popup = $('[data-testid="cloud-content-dialog"]');
    await popup.waitForDisplayed({ timeout: 40_000 });
    await $('[data-testid="cloud-dialog-action"]').click();
    await popup.waitForExist({ reverse: true });
    await openModelProviderSettings();
    await selectFamilyAStartPlan();
    expect(
      (await readSettings()).providerFamilyConnectionSelections?.[FIXTURE_FAMILY_A_ID],
    ).toEqual({
      kind: "start-plan",
    });
    await waitForPlanRefreshAction("ANet Weekend Build", true);
    await waitForPlanRefreshAction("ANet V3 Start Plan", false);
    const balanceRequestCountBeforeRefresh = countMockRequestsEndingWith(
      await readMockRequests(),
      "/api/v1/anet-plan/billing/balance",
    );
    await markManualClaimBucketReady();
    await clickPlanRefreshAction("ANet Weekend Build");
    await waitForPlanRefreshAction("ANet Weekend Build", false, "model-a-flash");
    await browser.waitUntil(
      async () =>
        countMockRequestsEndingWith(await readMockRequests(), "/api/v1/anet-plan/billing/balance") >
        balanceRequestCountBeforeRefresh,
      {
        timeout: 30_000,
        timeoutMsg: "点击刷新权益后没有重新请求 billing/balance",
      },
    );
    await openSubagentSettings();
    await waitForFamilyAConnectionBadge("Start");
    await selectSubagentModel(START_PLAN_MODEL);
    await openModelProviderSettings();
    await selectFamilyAIndividualPlan();
    await waitForFamilyAPlanSelected(INDIVIDUAL_PLAN_KEY, "Individual");
    const paidConnection = (await readSettings()).providerFamilyConnectionSelections?.[
      FIXTURE_FAMILY_A_ID
    ];
    await openSubagentSettings();
    await waitForFamilyAConnectionBadge("Individual", INDIVIDUAL_PLAN_MODEL);
    // 可用性由更新后的 Environment Selection View 裁决，不由旧 family 分组判断。
    await waitForSubagentModelTriggerLabel("model-a-flash");
    expect(
      await $(`[data-testid="${GENERAL_PURPOSE_ROW_TEST_ID}"]`)
        .$(`[data-testid="${TID_CHAT_MODEL_SELECT_TRIGGER}"]`)
        .getAttribute("data-model-current-value"),
    ).toBe(START_PLAN_MODEL);
    await openModelProviderSettings();
    await waitForTestIdMissing(TID_MODEL_PROVIDER_START_PLAN_COUNT_SHORTCUT);
    await selectFamilyAStartPlan();
    expect(
      (await readSettings()).providerFamilyConnectionSelections?.[FIXTURE_FAMILY_A_ID],
    ).toEqual(paidConnection);
  });
});

const MANUAL_CLAIM_MOCK_BASE_URL_ENV = "ANET_CODING_PLAN_UPGRADE_MOCK_BASE_URL";
const FAMILY_A_GROUP_TEST_ID = testId(
  TID_CHAT_MODEL_SELECT_GROUP,
  `registry-provider:${FIXTURE_START_PLAN_PROVIDER_ID}`,
);
const GENERAL_PURPOSE_ROW_TEST_ID = testId(TID_SUBAGENT_ROW, "general-purpose");
const START_PLAN_KEY = `coding-plan:${FIXTURE_START_PLAN_PROVIDER_ID}`;
const INDIVIDUAL_PLAN_KEY = `coding-plan:${FIXTURE_INDIVIDUAL_PLAN_PROVIDER_ID}`;
const START_PLAN_MODEL = encodeCustomModelValue(FIXTURE_START_PLAN_PROVIDER_ID, "model-a-flash");
const INDIVIDUAL_PLAN_MODEL = encodeCustomModelValue(
  FIXTURE_INDIVIDUAL_PLAN_PROVIDER_ID,
  "model-a-flash",
);

async function openSubagentSettings() {
  await ensureSettingsOpen();
  await clickTestIdByDom(testId(TID_SETTINGS_SECTION_NAV, "subagents"), {
    timeout: 30_000,
    timeoutMsg: "设置页没有 Subagents 分区入口",
  });
}

async function ensureSettingsOpen() {
  const settingsOpen = (await browser.execute((settingsPageTestId) => {
    return Boolean(document.querySelector(`[data-testid="${settingsPageTestId}"]`));
  }, TID_SETTINGS_PAGE)) as boolean;
  if (!settingsOpen) {
    await clickTestIdByDom(TID_TASK_SETTINGS_BUTTON, {
      timeout: 30_000,
      timeoutMsg: "没有找到任务设置入口",
    });
  }
}

async function openModelProviderSettings() {
  await ensureSettingsOpen();
  await clickTestIdByDom(testId(TID_SETTINGS_SECTION_NAV, "modelProvider"), {
    timeout: 30_000,
    timeoutMsg: "设置页没有模型供应商分区入口",
  });
  await clickTestIdByDom(
    testId(TID_MODEL_PROVIDER_NAV_ITEM, `preset:${FIXTURE_START_PLAN_PROVIDER_ID}`),
    {
      timeout: 30_000,
      timeoutMsg: "模型供应商设置没有 family-a 导航项",
    },
  );
}

async function selectFamilyAIndividualPlan() {
  if (
    (await readSettings()).providerFamilyConnectionSelections?.[FIXTURE_FAMILY_A_ID]?.kind ===
    "individual-coding-plan"
  )
    return;
  await selectFamilyAPlan(INDIVIDUAL_PLAN_KEY, "领取 Start Plan 后没有 Individual 连接方式选项");
}

async function selectFamilyAStartPlan() {
  await clickTestIdByDom(testId(TID_MODEL_PROVIDER_NAV_ITEM, START_PLAN_KEY));
}

async function selectFamilyAPlan(connectionKey: string, timeoutMsg: string) {
  await clickTestIdByWebDriver(TID_MODEL_PROVIDER_CONNECTION_MODE_TRIGGER, {
    timeout: 30_000,
    timeoutMsg: "没有找到连接方式下拉框",
  });
  await clickTestIdByDom(testId(TID_MODEL_PROVIDER_CONNECTION_MODE_ITEM, connectionKey), {
    timeout: 30_000,
    timeoutMsg,
  });
}

async function waitForFamilyAPlanSelected(connectionKey: string, label: string) {
  await browser.waitUntil(
    async () => {
      const settings = await readSettings();
      return (
        settings.providerFamilyConnectionSelections?.[FIXTURE_FAMILY_A_ID]?.kind ===
        (connectionKey === START_PLAN_KEY ? "start-plan" : "individual-coding-plan")
      );
    },
    {
      timeout: 30_000,
      timeoutMsg: `${label} 连接方式没有写入设置: ${connectionKey}`,
    },
  );
}

async function waitForFamilyAConnectionBadge(
  expectedBadge: "Start" | "Individual",
  expectedModel?: string,
) {
  const groupTestId = testId(
    TID_CHAT_MODEL_SELECT_GROUP,
    `registry-provider:${expectedBadge === "Start" ? FIXTURE_START_PLAN_PROVIDER_ID : FIXTURE_INDIVIDUAL_PLAN_PROVIDER_ID}`,
  );
  const trigger = $(`[data-testid="${GENERAL_PURPOSE_ROW_TEST_ID}"]`).$(
    `[data-testid="${TID_CHAT_MODEL_SELECT_TRIGGER}"]`,
  );
  await trigger.waitForClickable({ timeout: 30_000 });
  await trigger.click();

  let latestText = "";
  let latestModelItemTestIds: string[] = [];
  try {
    await browser.waitUntil(
      async () => {
        const menuState = (await browser.execute(
          (groupTestId, itemTestIdPrefix) => ({
            groupText:
              document
                .querySelector(`[data-testid="${groupTestId}"]`)
                ?.textContent?.replace(/\s+/g, " ")
                .trim() ?? "",
            modelItemTestIds: Array.from(
              document.querySelectorAll<HTMLElement>(`[data-testid^="${itemTestIdPrefix}-"]`),
            ).flatMap((item) => (item.dataset.testid ? [item.dataset.testid] : [])),
          }),
          groupTestId,
          TID_CHAT_MODEL_SELECT_ITEM,
        )) as { groupText: string; modelItemTestIds: string[] };
        latestText = menuState.groupText;
        latestModelItemTestIds = menuState.modelItemTestIds;
        if (!latestText.includes(expectedBadge)) return false;
        if (!expectedModel) return true;
        return (await browser.execute(
          (itemTestId) => Boolean(document.querySelector(`[data-testid="${itemTestId}"]`)),
          testId(TID_CHAT_MODEL_SELECT_ITEM, expectedModel),
        )) as boolean;
      },
      {
        timeout: 30_000,
        timeoutMsg: `Subagents 模型分组没有显示 ${expectedBadge} 当前连接及其候选: group=${latestText}, items=${latestModelItemTestIds.join(",")}`,
      },
    );
  } finally {
    await browser.keys("Escape");
    await browser.waitUntil(
      async () =>
        (await browser.execute(
          (groupTestId) => !document.querySelector(`[data-testid="${groupTestId}"]`),
          groupTestId,
        )) as boolean,
      {
        timeout: 5_000,
        timeoutMsg: "Subagents 模型菜单关闭状态没有完成",
      },
    );
  }
}

async function selectSubagentModel(model: string): Promise<void> {
  const row = $(`[data-testid="${GENERAL_PURPOSE_ROW_TEST_ID}"]`);
  const trigger = row.$(`[data-testid="${TID_CHAT_MODEL_SELECT_TRIGGER}"]`);
  await trigger.waitForClickable({ timeout: 30_000 });
  await trigger.click();

  await browser.waitUntil(
    async () =>
      (await browser.execute(
        (groupTestId, itemTestId) =>
          Boolean(
            document.querySelector(`[data-testid="${groupTestId}"]`) ||
            document.querySelector(`[data-testid="${itemTestId}"]`),
          ),
        FAMILY_A_GROUP_TEST_ID,
        testId(TID_CHAT_MODEL_SELECT_ITEM, model),
      )) as boolean,
    {
      timeout: 30_000,
      timeoutMsg: `Start Plan 模型菜单没有出现 ${model}`,
    },
  );

  const itemTestId = testId(TID_CHAT_MODEL_SELECT_ITEM, model);
  const itemVisible = await browser.execute(
    (currentItemTestId) => Boolean(document.querySelector(`[data-testid="${currentItemTestId}"]`)),
    itemTestId,
  );
  if (!itemVisible) {
    // 旧实现只派发合成 MouseEvent，Radix 子菜单偶发不会进入真实 pointer hover 状态。
    // 先通过 WebDriver 移动真实指针，再点击兜底，避免后续模型候选检查随机失败。
    const familyGroup = $(`[data-testid="${FAMILY_A_GROUP_TEST_ID}"]`);
    await familyGroup.waitForDisplayed({ timeout: 10_000 });
    await familyGroup.moveTo();
    const openedByHover = await browser
      .waitUntil(
        async () =>
          (await browser.execute(
            (currentItemTestId) =>
              Boolean(document.querySelector(`[data-testid="${currentItemTestId}"]`)),
            itemTestId,
          )) as boolean,
        { timeout: 2_000 },
      )
      .then(
        () => true,
        () => false,
      );
    if (!openedByHover) {
      await familyGroup.click();
    }
  }

  await browser
    .waitUntil(
      async () =>
        (await browser.execute(
          (currentItemTestId) =>
            Boolean(document.querySelector(`[data-testid="${currentItemTestId}"]`)),
          itemTestId,
        )) as boolean,
      {
        timeout: 30_000,
        timeoutMsg: `Start Plan 模型菜单没有展开到 ${model}`,
      },
    )
    .catch(async (error: unknown) => {
      const diagnostic = await browser.execute(() => ({
        activeElement: document.activeElement?.outerHTML,
        menus: Array.from(document.querySelectorAll('[role="menu"]')).map(
          (menu) => menu.textContent,
        ),
        inputEvents: (window as typeof window & { __e2eClaimInputEvents?: unknown[] })
          .__e2eClaimInputEvents,
      }));
      throw new Error(`${String(error)}\nModel menu diagnostic: ${JSON.stringify(diagnostic)}`);
    });
  await browser.execute((currentItemTestId) => {
    document.querySelector<HTMLElement>(`[data-testid="${currentItemTestId}"]`)?.click();
  }, itemTestId);
  await browser.waitUntil(
    async () => (await trigger.getAttribute("data-model-current-value")) === model,
    {
      timeout: 30_000,
      timeoutMsg: `Subagent 模型没有切换到 ${model}`,
    },
  );
}

async function waitForSubagentModelTriggerLabel(expectedLabel: string): Promise<void> {
  const row = $(`[data-testid="${GENERAL_PURPOSE_ROW_TEST_ID}"]`);
  const trigger = row.$(`[data-testid="${TID_CHAT_MODEL_SELECT_TRIGGER}"]`);
  let latestLabel = "";
  await browser.waitUntil(
    async () => {
      latestLabel = (await trigger.getText()).replace(/\s+/gu, " ").trim();
      return latestLabel === expectedLabel;
    },
    {
      timeout: 30_000,
      timeoutMsg: `Subagent 模型触发器没有显示 ${expectedLabel}: ${latestLabel}`,
    },
  );
}

async function waitForPlanRefreshAction(
  planTitle: string,
  expectedVisible: boolean,
  expectedCardText?: string,
) {
  await browser.waitUntil(
    async () =>
      (await browser.execute(
        (title, visible, cardText) => {
          const heading = Array.from(document.querySelectorAll<HTMLHeadingElement>("h3")).find(
            (item) => item.textContent?.trim() === title,
          );
          const card = heading?.closest<HTMLElement>(".rounded-xl");
          if (!card) return false;
          if (cardText && !card.textContent?.includes(cardText)) return false;
          const button = Array.from(card.querySelectorAll<HTMLButtonElement>("button")).find(
            (item) => /^(刷新权益|Refresh access)$/u.test(item.textContent?.trim() ?? ""),
          );
          const actuallyVisible = Boolean(button && button.getClientRects().length > 0);
          if (actuallyVisible !== visible) return false;
          if (!visible) return true;
          return (
            button?.dataset.variant === "outline" &&
            button.classList.contains("rounded-full") &&
            button.classList.contains("border-success/30") &&
            Boolean(button.querySelector(".lucide-refresh-cw"))
          );
        },
        planTitle,
        expectedVisible,
        expectedCardText,
      )) as boolean,
    {
      timeout: 30_000,
      timeoutMsg: `${planTitle} 的刷新权益状态不符合预期：visible=${expectedVisible}, text=${expectedCardText ?? "-"}`,
    },
  );
}

async function clickPlanRefreshAction(planTitle: string) {
  await browser.waitUntil(
    async () =>
      (await browser.execute((title) => {
        const heading = Array.from(document.querySelectorAll<HTMLHeadingElement>("h3")).find(
          (item) => item.textContent?.trim() === title,
        );
        const card = heading?.closest<HTMLElement>(".rounded-xl");
        const button = Array.from(card?.querySelectorAll<HTMLButtonElement>("button") ?? []).find(
          (item) => /^(刷新权益|Refresh access)$/u.test(item.textContent?.trim() ?? ""),
        );
        if (!button || button.disabled || button.getClientRects().length === 0) return false;
        button.click();
        return true;
      }, planTitle)) as boolean,
    { timeout: 30_000, timeoutMsg: `${planTitle} 没有可点击的刷新权益按钮` },
  );
}

async function markManualClaimBucketReady() {
  const baseUrl = process.env[MANUAL_CLAIM_MOCK_BASE_URL_ENV]?.trim();
  if (!baseUrl) throw new Error("手动领取 E2E mock 地址未注入");
  const response = await fetch(`${baseUrl}/__e2e/coding-plan/manual-claim-bucket-ready`, {
    method: "POST",
  });
  if (!response.ok) throw new Error(`标记手动领取额度桶就绪失败：${response.status}`);
}

function countMockRequestsEndingWith(requests: Array<{ path: string }>, pathname: string): number {
  return requests.filter((request) => request.path.endsWith(pathname)).length;
}

async function waitForTestIdMissing(testId: string) {
  await browser.waitUntil(
    async () =>
      (await browser.execute(
        (value) => !document.querySelector(`[data-testid="${value}"]`),
        testId,
      )) as boolean,
    { timeout: 10_000, timeoutMsg: `页面仍然存在 test id：${testId}` },
  );
}

async function readTestIdText(testId: string): Promise<string> {
  return (await browser.execute(
    (value) => document.querySelector(`[data-testid="${value}"]`)?.textContent?.trim() ?? "",
    testId,
  )) as string;
}

async function readMockRequests(): Promise<
  Array<{ headers: Record<string, string>; method: string; path: string }>
> {
  const baseUrl = process.env[MANUAL_CLAIM_MOCK_BASE_URL_ENV]?.trim();
  if (!baseUrl) throw new Error("手动领取 E2E mock 地址未注入");
  const response = await fetch(`${baseUrl}/__e2e/coding-plan/requests`);
  if (!response.ok) throw new Error(`读取手动领取 request ledger 失败：${response.status}`);
  const payload = (await response.json()) as {
    requests: Array<{ headers: Record<string, string>; method: string; path: string }>;
  };
  return payload.requests;
}
