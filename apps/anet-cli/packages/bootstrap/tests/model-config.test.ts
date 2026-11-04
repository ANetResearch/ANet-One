import { describe, expect, it } from "vitest";
import {
  buildCliANetSourceHeaders,
  createRuntimeAiSdkModelExecutionConfig,
} from "../src/model-config.js";
import { createModelAdapter, type CreateModelAdapterOptions } from "../src/model-factory.js";

describe("createModelAdapter", () => {
  it("缺少执行基础设施配置时拒绝创建 Adapter", () => {
    expect(() => createModelAdapter({ env: {} } as CreateModelAdapterOptions)).toThrow(
      "requires executionConfig",
    );
  });
});

describe("createRuntimeAiSdkModelExecutionConfig", () => {
  it("装配来源 Header、网络和路由基础设施", () => {
    const endpointRoutingPort = {
      async resolve(url: string) {
        return { routed: false, url };
      },
    };
    const config = createRuntimeAiSdkModelExecutionConfig(
      { ANET_APP_VERSION: "3.9.0", ANET_ENV: "test" },
      {
        endpointRoutingPort,
        network: {
          caCertFile: "/tmp/test-ca.pem",
          httpProxy: "http://proxy.example.com",
          noProxy: "localhost",
        },
        sourceTitle: "electron",
      },
    );
    expect(config).toMatchObject({
      defaultHeaders: {
        "User-Agent": "ANet/3.9.0",
        "X-ANet-App-Version": "3.9.0",
        "X-Title": "ANet One@electron",
      },
      endpointRoutingPort,
      network: {
        caCertFile: "/tmp/test-ca.pem",
        httpProxy: "http://proxy.example.com",
        noProxy: "localhost",
      },
    });
  });

  it("过滤空网络配置", () => {
    expect(createRuntimeAiSdkModelExecutionConfig({}, { network: {} })).not.toHaveProperty(
      "network",
    );
  });
});

describe("buildCliANetSourceHeaders", () => {
  it("生成运行时来源 Header，不根据模型或 Provider 推断", () => {
    expect(
      buildCliANetSourceHeaders(
        { ANET_APP_VERSION: "3.9.0", ANET_ENV: "production" },
        { sourceTitle: "cli" },
      ),
    ).toMatchObject({
      "User-Agent": "ANet/3.9.0",
      "X-Title": "ANet One@cli",
      "X-ANet-App-Version": "3.9.0",
    });
  });
});
