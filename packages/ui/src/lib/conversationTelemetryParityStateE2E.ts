import { PROVIDER_FAMILY_SPECS } from "@/lib/modelProviderFamilies.js";
import {
  buildSessionQuotaBannerDismissKey,
  buildSessionQuotaBannerState,
} from "@/v4/sessionQuotaBannerState.js";

export function runQuotaParityStateAssertions(): string[] {
  const assertions: string[] = [];
  // 额度横幅只对已注册 provider family 的 Start Plan 生效；没有注册任何 family 时没有可断言的对象。
  const providerId = PROVIDER_FAMILY_SPECS[0]?.startPlanProviderId;
  if (!providerId) return assertions;
  const exhausted = buildSessionQuotaBannerState({
    activeProviderId: providerId,
    snapshot: null,
    modelId: "agent-model",
    serverQuotaExhausted: true,
  });
  assertState(
    exhausted.visible && exhausted.kind === "daily-exhausted" && !exhausted.dismissible,
    "quota:daily-exhausted",
    assertions,
  );

  const concurrent = buildSessionQuotaBannerState({
    activeProviderId: providerId,
    snapshot: null,
    modelId: "agent-model",
    serverConcurrentLimited: true,
    serverConcurrentLimitBusinessCode: "3010",
    serverConcurrentLimitReason: "retry-exhausted-busy",
  });
  assertState(
    concurrent.kind === "concurrent-limit" &&
      concurrent.dismissible &&
      !concurrent.blocksSubmit &&
      concurrent.priority === 60,
    "quota:concurrent-dismissible-nonblocking",
    assertions,
  );

  const providerLimited = buildSessionQuotaBannerState({
    activeProviderId: providerId,
    snapshot: null,
    modelId: "agent-model",
    serverProviderLimitedBusinessCode: "1308",
    serverProviderLimitedMessage: "[1308][余额不足][request-id]",
  });
  assertState(
    providerLimited.kind === "provider-limited" &&
      providerLimited.providerLimitedMessage === "余额不足",
    "quota:provider-limited-message",
    assertions,
  );
  assertState(
    buildSessionQuotaBannerDismissKey(concurrent, "error-a") !==
      buildSessionQuotaBannerDismissKey(concurrent, "error-b"),
    "quota:dismiss-key-instance",
    assertions,
  );
  return assertions;
}

function assertState(condition: boolean, label: string, assertions: string[]): void {
  if (!condition) {
    throw new Error(`conversation telemetry parity state assertion failed: ${label}`);
  }
  assertions.push(label);
}

export { runRequestVerificationParityAssertions } from "@/request-security-edition/parity.js";
