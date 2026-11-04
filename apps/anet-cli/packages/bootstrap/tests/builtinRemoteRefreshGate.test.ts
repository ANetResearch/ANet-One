import { describe, expect, it } from "vitest";
import { ANET_BUILTIN_REMOTE_REFRESH_ENV } from "@anet/provider-node";
import { isBuiltinRemoteRefreshEnabled } from "../src/app/process-provider-registry-runtime.js";

// 内置 provider 目录与随包配置取 revision 较高者生效。上游一旦发布更高的
// revision,本仓库在随包配置里加的 provider 模板(token.anet.chat)就会被静默
// 换掉,用户只会看到模板消失。所以默认不从上游刷新。
describe("内置 provider 目录的远端刷新", () => {
  it("默认关闭", () => {
    expect(isBuiltinRemoteRefreshEnabled({})).toBe(false);
    expect(isBuiltinRemoteRefreshEnabled({ [ANET_BUILTIN_REMOTE_REFRESH_ENV]: undefined })).toBe(
      false,
    );
  });

  it("只有显式置 1 才开启", () => {
    expect(isBuiltinRemoteRefreshEnabled({ [ANET_BUILTIN_REMOTE_REFRESH_ENV]: "1" })).toBe(true);
    expect(isBuiltinRemoteRefreshEnabled({ [ANET_BUILTIN_REMOTE_REFRESH_ENV]: " 1 " })).toBe(true);
  });

  it("其他取值都不开启", () => {
    // "true"/"on"/"0"/"" 一律当作关闭:开启这件事要显式,不能被一个随手设的值打开。
    for (const value of ["0", "", "true", "on", "yes", "enabled", "2"]) {
      expect(
        isBuiltinRemoteRefreshEnabled({ [ANET_BUILTIN_REMOTE_REFRESH_ENV]: value }),
        `${JSON.stringify(value)} 不应开启远端刷新`,
      ).toBe(false);
    }
  });
});
