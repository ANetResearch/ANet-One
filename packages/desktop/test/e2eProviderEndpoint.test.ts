import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveRuntimeANetEndpointOrigin } from "@anet/shared";
import {
  getE2EProviderEndpointEnv,
  shouldUseProductionE2EProviderEndpoint,
} from "#e2e/helpers/e2e-provider-endpoint";

// 普通用例是否切控制面属于请求安全实现（开源版为空）；这里只验证公共 helper 原样委托。
const requestSecurityEnv = vi.hoisted(() => ({ current: {} as Record<string, string> }));
vi.mock("#e2e/helpers/request-security-edition/index", () => ({
  requestSecurityEndpointEnv: () => requestSecurityEnv.current,
}));

const liveTeam = "conversation-session-r3-live-family-team.test.ts";
const ordinary = "conversation-session-v4-sendnow.test.ts";
const liveShare = "conversation-session-share-ssh-artifact.test.ts";

afterEach(() => {
  requestSecurityEnv.current = {};
});

describe("E2E provider endpoint ownership", () => {
  it.each([liveTeam, liveShare])("生产账号统一使用可沿 SSH 传递的生产环境：%s", (spec) => {
    const env = {
      ANET_ENV: "test",
      ...getE2EProviderEndpointEnv([spec], "deepseek", "replay"),
    };
    // 本分发不内置控制面地址:未配置 ANET_E2E_LIVE_BASE_URL 时解析结果为空,
    // 这两个 live 用例因此跑不起来 —— 正是预期结果。改回任何默认域名都会让这里失败。
    expect(resolveRuntimeANetEndpointOrigin(env)).toBe("");
    // SSH 只透传环境档位;没有内置默认域可回落。
    expect(env.ANET_ENV).toBe("production");
  });

  it("普通用例的控制面覆盖原样来自请求安全实现，不获得真实 Team 的 Family 接口覆盖", () => {
    expect(getE2EProviderEndpointEnv([ordinary], "deepseek", "replay")).toEqual({});
    expect(shouldUseProductionE2EProviderEndpoint([ordinary], "deepseek", "replay")).toBe(false);

    requestSecurityEnv.current = { ANET_BASE_URL: "https://config.example.com" };
    expect(getE2EProviderEndpointEnv([ordinary], "example-preset", "capture")).toEqual({
      ANET_BASE_URL: "https://config.example.com",
    });
    expect(shouldUseProductionE2EProviderEndpoint([ordinary], "example-preset", "capture")).toBe(
      true,
    );
  });
  it("SSH share 的真实账号与分享 API 使用同一生产环境", () => {
    expect(shouldUseProductionE2EProviderEndpoint([liveShare], "deepseek", "replay")).toBe(true);
  });

  it.each([
    [liveShare, ordinary],
    [liveShare, liveTeam],
  ])("真实 share 必须独立运行：%j", (...specs) => {
    expect(() => shouldUseProductionE2EProviderEndpoint(specs, "deepseek", "replay")).toThrow(
      "独立运行",
    );
  });
  it.each([
    liveTeam,
    `/repo/packages/desktop/test/e2e/conversation-session/manual-review/pending/${liveTeam}`,
    `file:///repo/packages/desktop/test/e2e/conversation-session/manual-review/pending/${liveTeam}`,
    `C:\\repo\\packages\\desktop\\test\\e2e\\${liveTeam}`,
  ])("生产账号材料的独立 live-team 使用生产控制面：%s", (spec) => {
    expect(shouldUseProductionE2EProviderEndpoint([spec], "deepseek", "replay")).toBe(true);
  });

  it.each([{ specs: [] }, { specs: ["conversation-session-r3-live-upstream-api.test.ts"] }])(
    "普通或 ZAPI 用例不获得生产账号控制面例外：$specs",
    ({ specs }) => {
      expect(shouldUseProductionE2EProviderEndpoint(specs, "deepseek", "replay")).toBe(false);
    },
  );

  it.each([
    [liveTeam, ordinary],
    [ordinary, liveTeam],
  ])("拒绝 live-team 与其他 spec 混跑：%j", (...specs) => {
    expect(() => shouldUseProductionE2EProviderEndpoint(specs, "deepseek", "replay")).toThrow(
      "live-team 必须独立运行",
    );
  });
});
