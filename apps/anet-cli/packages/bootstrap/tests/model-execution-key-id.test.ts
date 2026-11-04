import { describe, expect, it } from "vitest";
import { anetSessionSendParamsSchema } from "@anet/shared";
import { createModelExecutionContext } from "../src/anet-protocol/model-execution.js";

describe("请求期 Key ID 执行上下文", () => {
  it("协议与冻结投影保留真实 ID，不将其加入模型 Header", async () => {
    const requestAuth = { apiKey: "pat", apiKeyId: "real-key-id", accountScope: "a".repeat(64) };
    const execution = createModelExecutionContext(
      anetSessionSendParamsSchema.shape.modelExecution
        .unwrap()
        .parse({ selectionScope: "execution", requestAuth }),
    );
    const value = await execution.requestDependencies?.requestAuth?.source?.resolve({
      attempt: 1,
      providerId: "account:family-a-off-peak",
      modelId: "model-a",
    });
    expect(value).toEqual(requestAuth);
    expect(Object.isFrozen(value)).toBe(true);
  });

  it("原样透传 selectionFallback 声明，包括发起方声明的退回目标", () => {
    // 退回目标必须完整到达 core：冷恢复竞态下 runtime 可能没有常驻选择，这是唯一的退回依据。
    const selectionFallback = {
      providerId: "account:family-a-highspeed-card",
      rules: [
        { reason: "highspeed_card_expired" as const, providerErrorCode: "3402" },
        { reason: "highspeed_request_failed" as const },
      ],
      target: {
        providerId: "account:family-a-team-coding-plan",
        modelId: "Model-A",
        options: { reasoningLevel: "low" },
      },
    };
    const execution = createModelExecutionContext(
      anetSessionSendParamsSchema.shape.modelExecution
        .unwrap()
        .parse({ selectionScope: "execution", selectionFallback }),
    );
    expect(execution.selectionFallback).toEqual(selectionFallback);
  });
});
