import { TID_CHAT_MODEL_SELECT_TRIGGER, TID_SETTINGS_BACK_BUTTON } from "@anet/shared/test-ids";
import {
  DEFAULT_WORKSPACE,
  clearAppData,
  clickTestIdByDom,
  waitForWorkspaceApp,
  type E2EModelProviderSnapshot,
} from "../helpers/desktop-app.js";
import {
  assertUpstreamRequestCapture,
  waitForUpstreamNetworkCapture,
} from "../helpers/upstream-capture.js";
import {
  getUpstreamProviderModelValues,
  getSelectedUpstreamModelLabel,
  getSelectedUpstreamThoughtLevelLabel,
  selectUpstreamProviderModelById,
  selectUpstreamThoughtLevelValue,
} from "../helpers/upstream-provider.js";
import {
  E2E_REPLY_TOKEN,
  prepareV4ConversationE2E,
  sendV4Prompt,
  waitForV4AssistantMessageContaining,
  waitForV4ConversationState,
  waitForV4ComposerText,
  waitForV4UserMessageContaining,
} from "#e2e/helpers/v4-conversation";
import { createCustomOpenAIChatCompletionsProvider } from "../helpers/custom-openai-provider.js";
import { startConversationModelProviderReplayServer } from "../helpers/model-provider-replay.js";
import { sel } from "../helpers/selectors.js";

const MODEL_C_NAME = "model-c";
const MODEL_C_PROVIDER_NAME_PREFIX = "Model C E2E";
const MODEL_C_MAX_LEVEL = "max";
const MODEL_C_DISABLED_LEVEL = "disabled";
let modelProviderReplayServer: Awaited<
  ReturnType<typeof startConversationModelProviderReplayServer>
> | null = null;

describe("会话区 model-c 思考档位请求字段 E2E", () => {
  before(async () => {
    modelProviderReplayServer = await startConversationModelProviderReplayServer(
      "conversation-session-model-c-reasoning-request-shape",
    );
  });

  after(async () => {
    await browser.electron.restoreAllMocks();
    await clearAppData();
    await modelProviderReplayServer?.stop();
    modelProviderReplayServer = null;
  });

  it("I14: model-c max/disabled 应生成对应 OpenAI-compatible 请求字段", async function () {
    this.timeout(240000);

    await prepareV4ConversationE2E({ skipProvider: true });
    await waitForWorkspaceApp(DEFAULT_WORKSPACE, 30000);

    const runId = Date.now();
    const providerName = `${MODEL_C_PROVIDER_NAME_PREFIX} ${runId}`;
    const provider = await createCustomOpenAIChatCompletionsProvider({
      modelId: MODEL_C_NAME,
      providerName,
    });

    await clickTestIdByDom(TID_SETTINGS_BACK_BUTTON, {
      timeout: 15000,
      timeoutMsg: "设置页返回按钮没有出现",
    });
    await waitForWorkspaceApp(DEFAULT_WORKSPACE, 30000);

    await selectUpstreamProviderModelById(MODEL_C_NAME, {
      includePlainModelFallback: false,
      providerId: provider.id,
      providerName,
    });
    await assertSelectedModelCModel(provider);

    await selectUpstreamThoughtLevelValue(MODEL_C_MAX_LEVEL);
    await assertSelectedThoughtLevel(MODEL_C_MAX_LEVEL);

    const maxMarker = `E2E_MODEL_C_REASONING_MAX_${runId}`;
    const maxPrompt = `${maxMarker}: Reply with exactly "${E2E_REPLY_TOKEN}" and no other text.`;
    await sendV4Prompt(maxPrompt);
    await waitForV4ComposerText("", "model-c max 首发后输入框没有清空");
    await waitForV4UserMessageContaining(maxMarker);

    const maxRecord = await waitForUpstreamNetworkCapture(maxMarker);
    assertUpstreamRequestCapture(maxRecord, {
      expectedText: maxPrompt,
      model: MODEL_C_NAME,
    });
    assertModelCMaxRequest(maxRecord.requestJson);

    await waitForV4AssistantMessageContaining(E2E_REPLY_TOKEN);
    await waitForV4ConversationState(
      (snapshot) => snapshot.state === "idle" && snapshot.queueCount === 0,
      "model-c max 首轮完成后没有回到 idle",
      90000,
    );

    await selectUpstreamThoughtLevelValue(MODEL_C_DISABLED_LEVEL);
    await assertSelectedThoughtLevel(MODEL_C_DISABLED_LEVEL);

    const noThinkMarker = `E2E_MODEL_C_REASONING_NOTHINK_${runId}`;
    const noThinkPrompt = `${noThinkMarker}: Reply with exactly "${E2E_REPLY_TOKEN}" and no other text.`;
    await sendV4Prompt(noThinkPrompt);
    await waitForV4ComposerText("", "model-c nothink 发送后输入框没有清空");
    await waitForV4UserMessageContaining(noThinkMarker);

    const noThinkRecord = await waitForUpstreamNetworkCapture(noThinkMarker);
    assertUpstreamRequestCapture(noThinkRecord, {
      expectedText: noThinkPrompt,
      model: MODEL_C_NAME,
    });
    assertModelCNoThinkRequest(noThinkRecord.requestJson);

    await waitForV4AssistantMessageContaining(E2E_REPLY_TOKEN);
    await waitForV4ConversationState(
      (snapshot) => snapshot.state === "idle" && snapshot.queueCount === 0,
      "model-c nothink 第二轮完成后没有回到 idle",
      90000,
    );
  });
});

async function assertSelectedModelCModel(provider: E2EModelProviderSnapshot) {
  const label = await getSelectedUpstreamModelLabel();
  const acceptedValues = getUpstreamProviderModelValues(MODEL_C_NAME, {
    includePlainModelFallback: false,
    providerId: provider.id,
  });
  if (!acceptedValues.includes(label.currentValue)) {
    throw new Error(
      `聊天工具栏当前模型没有保留 model-c provider 身份: ${JSON.stringify({
        acceptedValues,
        label,
        providerId: provider.id,
      })}`,
    );
  }
  await $(sel(TID_CHAT_MODEL_SELECT_TRIGGER)).waitForDisplayed({ timeout: 15000 });
}

async function assertSelectedThoughtLevel(expectedLevel: string) {
  const thoughtLabel = await getSelectedUpstreamThoughtLevelLabel();
  const candidates = [
    thoughtLabel.currentValue,
    thoughtLabel.ariaLabel,
    thoughtLabel.text,
    thoughtLabel.title,
  ].map((value) => value.replace(/\s+/g, " ").trim().toLowerCase());
  if (!candidates.some((candidate) => candidate === expectedLevel)) {
    throw new Error(
      `model-c 当前思考档位不是 ${expectedLevel}: ${JSON.stringify({
        candidates,
        thoughtLabel,
      })}`,
    );
  }
}

// 当前通用 Chat Completions 映射显式展开开关和 effort，禁止套 extra_body。
function assertModelCMaxRequest(requestJson: unknown) {
  expect(readNestedString(requestJson, ["reasoning_effort"])).toBe(MODEL_C_MAX_LEVEL);
  expect(readNestedValue(requestJson, ["chat_template_kwargs"])).toBeUndefined();
  expect(readNestedValue(requestJson, ["thinking"])).toEqual({ type: "enabled" });
  expect(readNestedValue(requestJson, ["enable_thinking"])).toBe(true);
  expect(readNestedValue(requestJson, ["reasoning"])).toEqual({ effort: "max" });
  expect(readNestedValue(requestJson, ["extra_body"])).toBeUndefined();
}

function assertModelCNoThinkRequest(requestJson: unknown) {
  expect(readNestedString(requestJson, ["reasoning_effort"])).toBe("none");
  expect(readNestedValue(requestJson, ["chat_template_kwargs"])).toBeUndefined();
  expect(readNestedValue(requestJson, ["thinking"])).toEqual({ type: "disabled" });
  expect(readNestedValue(requestJson, ["enable_thinking"])).toBe(false);
  expect(readNestedValue(requestJson, ["reasoning"])).toEqual({ effort: "none" });
  expect(readNestedValue(requestJson, ["extra_body"])).toBeUndefined();
}

function readNestedString(value: unknown, path: string[]) {
  const result = readNestedValue(value, path);
  return typeof result === "string" ? result : null;
}

function readNestedValue(value: unknown, path: string[]) {
  let current: unknown = value;
  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}
