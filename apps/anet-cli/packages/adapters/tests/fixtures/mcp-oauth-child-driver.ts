/**
 * 跨进程 E2E 的子进程驱动。
 *
 * 由 tests/mcp-oauth-cross-process.e2e.test.ts 用 tsx 以真实 OS 进程拉起:真实文件锁、
 * 真实凭据文件、真实网络请求都在子进程里发生,主进程只负责托管假服务器与断言。
 * 这正是线上事故形态——竞态发生在多个 CLI 进程之间,同进程测试盖不住。
 *
 * 协议:argv[2] 是 JSON 配置;结束向 stdout 打印一行 JSON 结果;失败 exit 1。
 */
import { createSharedANetCredentialStore } from "../../src/auth/shared-credentials.js";
import { createMcpAdapter } from "../../src/mcp/index.js";
import { createMcpOAuthTokenProvider } from "../../src/mcp/oauth-provider.js";

interface DriverConfig {
  autoDrive?: boolean;
  /** 起跑栅栏:父进程托管,所有参赛子进程都到齐才一起放行。见下面 `waitAtBarrier`。 */
  barrierUrl?: string;
  credentialsPath: string;
  keyPrefix?: string;
  mcpUrl: string;
  mode: "refresh-race" | "authorize";
  secret: string;
  serverName?: string;
}

/**
 * 在起跑栅栏前等齐。
 *
 * 这组用例要测的是「多个进程同时抢同一把锁」。没有栅栏时,两个子进程能不能真的重叠,
 * 取决于它们各自启动要多久 —— 而启动包含 tsx 的即时编译与冷盘读取,在托管 CI runner 上
 * 实测要 190 秒以上,在开发机上只要 10 秒。慢到一定程度,先起的那个已经跑完退出,后起的
 * 才刚进来,两个进程根本没有重叠:竞争没有发生,用例测的就不是锁协议,而是启动快慢。
 * 栅栏把启动开销挡在计时之外,让竞争在任何机器上都必然发生。
 */
async function waitAtBarrier(barrierUrl: string | undefined): Promise<void> {
  if (barrierUrl === undefined) return;
  await fetch(barrierUrl);
}

/** 把 `status.error` 摊平成可读字符串,否则它过 JSON 边界后是空对象。 */
function flattenError(status: Record<string, unknown>): Record<string, unknown> {
  const error = status["error"];
  if (error === undefined) return status;
  const text = error instanceof Error ? (error.stack ?? error.message) : String(error);
  return { ...status, error: text };
}

async function main(): Promise<void> {
  const config = JSON.parse(process.argv[2] ?? "{}") as DriverConfig;
  const credentialStore = createSharedANetCredentialStore({
    env: { ANET_CREDENTIAL_SECRET: config.secret },
    filePath: config.credentialsPath,
  });

  if (config.mode === "refresh-race") {
    // 直接驱动 Phase 1 provider:并发临期刷新的单飞语义不依赖 transport。
    const provider = createMcpOAuthTokenProvider({
      config: { type: "authorization_code", scope: "mcp:tools" },
      credentialStore,
      keyPrefix: config.keyPrefix ?? "",
      serverName: "cross-process",
      serverUrl: config.mcpUrl,
    });
    await waitAtBarrier(config.barrierUrl);
    const token = await provider.token();
    process.stdout.write(JSON.stringify({ token }));
    return;
  }

  // authorize 模式:完整建连。leader 会走到 openAuthorizationUrl(autoDrive 时自动完成
  // 浏览器动作);follower 只会收到 onAuthorizationRequired,绝不能重复驱动授权 URL。
  const authorizationUrls: string[] = [];
  const adapter = createMcpAdapter({
    mcpOAuth: {
      credentialStore,
      ...(config.autoDrive
        ? {
            openAuthorizationUrl: async ({ authorizationUrl }) => {
              authorizationUrls.push(authorizationUrl);
              const response = await fetch(authorizationUrl, { redirect: "manual" });
              const location = response.headers.get("location");
              if (location) await fetch(location);
            },
          }
        : {}),
      onAuthorizationRequired: () => undefined,
    },
  });
  try {
    await waitAtBarrier(config.barrierUrl);
    const status = await adapter.connectServer(config.serverName ?? "cross-process", {
      type: "http",
      url: config.mcpUrl,
      oauth: { type: "authorization_code", scope: "mcp:tools" },
    });
    // `status.error` 是 Error 实例,JSON.stringify 把它序列化成 `{}` —— 失败原因在跨进程
    // 边界上丢光,父进程只剩 status: "failed" 三个字,用例红了也无从判断是哪一步失败的。
    // 这里先摊平成字符串再过边界。
    process.stdout.write(JSON.stringify({ authorizationUrls, status: flattenError(status) }));
  } finally {
    await adapter.close();
  }
}

void main().then(
  () => undefined,
  (error: unknown) => {
    process.stderr.write(error instanceof Error ? (error.stack ?? error.message) : String(error));
    process.exit(1);
  },
);
