import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 本分发不得内置任何上游厂商的服务端地址。
 *
 * 判据是机械的:在版本控制下的源码里,除注释与测试夹具外,不允许出现这些主机名的
 * URL 字面量。没有这条检查,"漏改了一处"只能靠逐个文件读 —— 而上游有 20 多处,
 * 后续同步上游还会再带进来。
 *
 * 这里判的是源码,不是构建产物:构建产物还会包含 node_modules 里第三方 SDK 自带的
 * 地址,不是本仓库能决定的。本仓库能决定的是自己写的那部分。
 */
const FORBIDDEN_HOSTS = [
  "zcode.z.ai",
  "cdn-zcode.z.ai",
  "chat.z.ai",
  "api.z.ai",
  "z.ai",
  "open.bigmodel.cn",
  "bigmodel.cn",
  "cdn.codegeex.cn",
  "zai.site",
  "zai-ai.site",
  "zhipu-ai.feishu.cn",
] as const;

const REPO_ROOT = resolve(import.meta.dirname, "../../..");

/**
 * 检查会进入分发物的源码与配置,以及随仓库分发的文档。
 *
 * 原先排除 `docs/` 与 `*.md`,理由是上游设计文档记录的是上游行为。上游内部工程文档
 * 已整体移除,留下的 Markdown 都是本项目自己的说明,因此一并纳入检查 —— 否则 README
 * 或使用文档里写回一个厂商地址不会被发现。
 *
 * 其余排除项各有理由,不是为了让检查通过:
 * - 测试与夹具:断言里需要出现被禁止的地址才能验证"遇到它时的行为";
 * - `THIRD-PARTY-NOTICES.md`:由 `scripts/licenses.mjs` 生成的第三方声明,内容不由本仓库决定;
 * - `.env.example` 之外的 `.env*` 不在版本控制内。
 */
const EXCLUDED_PATH_PATTERNS = [
  /(^|\/)test\//,
  /(^|\/)tests\//,
  /\.test\.(ts|tsx|mjs|js)$/,
  /(^|\/)wdio\.conf\.ts$/,
  /(^|\/)vitest\.config\.ts$/,
  /^THIRD-PARTY-NOTICES\.md$/,
];

const SCANNED_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".kt",
  ".json",
  ".mjs",
  ".js",
  ".xml",
  ".kts",
  ".gradle",
  ".md",
];

function listTrackedFiles(): string[] {
  // 默认 maxBuffer 是 1MB,本仓库的 ls-files 输出超过它,会以 ENOBUFS 失败 ——
  // 那是执行失败,不是"没有违例",必须给够缓冲区。
  return execFileSync("git", ["-C", REPO_ROOT, "ls-files"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
    .split("\n")
    .filter(Boolean);
}

/** 找行注释起点,跳过 `https://` 这种出现在 scheme 里的 `//`。 */
function findLineCommentStart(text: string): number {
  let from = 0;
  for (;;) {
    const index = text.indexOf("//", from);
    if (index < 0) return -1;
    if (index === 0 || text[index - 1] !== ":") return index;
    from = index + 2;
  }
}

/**
 * 去掉注释后再匹配。注释里说明"上游原先指向哪里、为什么去掉"是有价值的记录,
 * 不是残留的硬编码 —— 注释不会发出任何请求。
 *
 * 必须识别块注释(`/* *\/` 与 `<!-- -->`),不能只看行首:块注释的续行不带任何注释
 * 标记,只按行首判断会把续行里的说明文字当成代码,报一条并不存在的违例。
 * 行尾注释不做处理 —— 在行尾写一个厂商地址同样判为违例,这是刻意从严。
 */
function stripComments(source: string): string {
  const lines = source.split("\n");
  const out: string[] = [];
  let inBlock: "c" | "xml" | null = null;

  for (const line of lines) {
    let rest = line;
    let kept = "";
    while (rest.length > 0) {
      if (inBlock === "c") {
        const end = rest.indexOf("*/");
        if (end < 0) {
          rest = "";
          break;
        }
        rest = rest.slice(end + 2);
        inBlock = null;
        continue;
      }
      if (inBlock === "xml") {
        const end = rest.indexOf("-->");
        if (end < 0) {
          rest = "";
          break;
        }
        rest = rest.slice(end + 3);
        inBlock = null;
        continue;
      }
      const cStart = rest.indexOf("/*");
      const xmlStart = rest.indexOf("<!--");
      // `//` 也出现在 `https://` 里面。按裸 indexOf 取,会把每一行代码都在 URL 处截断,
      // 整条扫描随之失效 —— 这不是理论风险:第一版就是这样,是 mutation 验证发现的
      // (往源码里塞一条厂商 URL,扫描没报)。所以这里跳过紧跟在 `:` 后面的那种。
      const lineStart = findLineCommentStart(rest);
      const hashStart = rest.trimStart().startsWith("#") ? rest.indexOf("#") : -1;
      const candidates = [
        [cStart, "c"],
        [xmlStart, "xml"],
        [lineStart, "line"],
        [hashStart, "line"],
      ].filter(([index]) => (index as number) >= 0) as [number, string][];
      if (candidates.length === 0) {
        kept += rest;
        break;
      }
      const [index, kind] = candidates.reduce((a, b) => (a[0] <= b[0] ? a : b));
      kept += rest.slice(0, index);
      if (kind === "line") break;
      inBlock = kind as "c" | "xml";
      rest = rest.slice(index + (kind === "c" ? 2 : 4));
    }
    out.push(kept);
  }
  return out.join("\n");
}

function findViolations(): string[] {
  const violations: string[] = [];
  for (const relativePath of listTrackedFiles()) {
    if (!SCANNED_EXTENSIONS.some((extension) => relativePath.endsWith(extension))) continue;
    if (EXCLUDED_PATH_PATTERNS.some((pattern) => pattern.test(relativePath))) continue;

    let source: string;
    try {
      source = readFileSync(resolve(REPO_ROOT, relativePath), "utf8");
    } catch {
      continue;
    }
    if (!source.includes("z.ai") && !source.includes("bigmodel") && !source.includes("codegeex")) {
      continue;
    }

    const code = stripComments(source);
    code.split("\n").forEach((line, index) => {
      for (const host of FORBIDDEN_HOSTS) {
        const escaped = host.replace(/\./g, "\\.");
        // 两种写法都要判,只判带 scheme 的会漏掉裸主机名 —— gen-ui 的 resourceDomains
        // 允许列表就是只写 `"zcode.z.ai"`,由调用方拼上 `https://`,因此曾漏过检查。
        const patterns = [
          new RegExp(`(wss?|https?)://[a-zA-Z0-9._-]*${escaped}`),
          new RegExp(`["'\`][a-zA-Z0-9._-]*${escaped}["'\`]`),
        ];
        if (patterns.some((pattern) => pattern.test(line))) {
          violations.push(`${relativePath}:${index + 1}: ${line.trim()}`);
          return;
        }
      }
    });
  }
  return violations;
}

describe("分发物不内置上游厂商服务端地址", () => {
  it("源码里没有厂商主机名的 URL 字面量", () => {
    expect(findViolations()).toEqual([]);
  });

  it("检查本身能发现违例 —— 禁止名单非空且覆盖已知的几个主机", () => {
    // 这条不是走过场:如果 FORBIDDEN_HOSTS 被清空,上一条断言会无条件通过。
    expect(FORBIDDEN_HOSTS.length).toBeGreaterThanOrEqual(10);
    for (const host of [
      "zcode.z.ai",
      "cdn-zcode.z.ai",
      "chat.z.ai",
      "api.z.ai",
      "open.bigmodel.cn",
    ]) {
      expect(FORBIDDEN_HOSTS).toContain(host);
    }
  });

  it("端点常量默认未配置,而不是指向厂商域名", async () => {
    const endpointModule = await import("../src/anetEndpoint.js");
    expect(endpointModule.DEFAULT_ANET_ENDPOINT_ORIGIN).toBe("");
    expect(endpointModule.TEST_ANET_ENDPOINT_ORIGIN).toBe("");
    expect(endpointModule.DEFAULT_WEB_REMOTE_CONTROL_RELAY_WS_URL).toBe("");
  });

  it("厂商端点常量已整体移除,而不是改成空串", async () => {
    // 置空与移除是两件事:只断言"为空"的话,日后有人把常量改回厂商域名仍然能过前一条。
    // 这里断言这些导出名在模块里不存在,改回去会立刻红。
    const endpointModule = await import("../src/anetEndpoint.js");
    for (const removed of [
      "DEFAULT_ZAI_OAUTH_ORIGIN",
      "DEFAULT_ZAI_BUSINESS_BASE_URL",
      "DEFAULT_BIGMODEL_API_ORIGIN",
      "DEFAULT_ZAI_OAUTH_CLIENT_ID",
      "TEST_ZAI_OAUTH_ORIGIN",
      "TEST_BIGMODEL_API_ORIGIN",
    ]) {
      expect(Object.keys(endpointModule)).not.toContain(removed);
    }
  });

  it("未配置时远程控制中转地址为空,不回落到任何域名", async () => {
    const { resolveWebRemoteControlRelayWsUrl } = await import("../src/anetEndpoint.js");
    expect(resolveWebRemoteControlRelayWsUrl()).toBe("");
    expect(resolveWebRemoteControlRelayWsUrl({ endpointOrigin: "" })).toBe("");
    // 配置了就按配置走,功能本身没被删掉。
    expect(resolveWebRemoteControlRelayWsUrl({ endpointOrigin: "https://relay.example" })).toBe(
      "wss://relay.example/api/v1/remote/ws2",
    );
  });

  it("未配置时端点 URL 结构体全为空,且不抛错", async () => {
    const { buildANetEndpointUrls } = await import("../src/anetEndpoint.js");
    const urls = buildANetEndpointUrls("");
    expect(Object.values(urls).every((value) => value === "")).toBe(true);
  });

  it("插件图标基址未配置时不拼出任何地址", async () => {
    const { buildPluginAssetUrl } = await import("../src/anetProduct.js");
    expect(buildPluginAssetUrl("github/icon.png")).toBeUndefined();
    expect(
      buildPluginAssetUrl("github/icon.png", { ANET_PLUGIN_ASSETS_BASE_URL: "" }),
    ).toBeUndefined();
    expect(
      buildPluginAssetUrl("github/icon.png", {
        ANET_PLUGIN_ASSETS_BASE_URL: "https://cdn.example/a/",
      }),
    ).toBe("https://cdn.example/a/github/icon.png");
  });

  it("奖励中心未配置时不可用", async () => {
    const { isRewardsFeatureConfigured, resolveRewardsOrigin, buildRewardsUrl } =
      await import("../src/rewardsEmbedded.js");
    expect(isRewardsFeatureConfigured({ env: "production" })).toBe(false);
    expect(resolveRewardsOrigin({ env: "production" })).toBe("");
    expect(buildRewardsUrl("", "zh-CN", "anet-dark")).toBe("");
  });
});
