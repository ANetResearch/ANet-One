import type { ProjectRepositoryContract } from "../../../../services/src/project-storage/contract.js";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  MutableAccountProviderConfigSource,
  ProviderConfig,
  ProviderConfigMap,
  ProviderAccountAccessConfig,
  createAccountProviderConfigSnapshot,
  createFailClosedAccountProviderConfigSnapshot,
  type ModelSelectionViewInput,
} from "@anet/provider";
import { NodeProviderRegistryRuntime, createNodeModelSelectionFacade } from "@anet/provider-node";
import {
  createANetAgentService,
  createANetTaskServiceAdapter,
  getDataBaseDir,
  setDataBaseDir,
} from "@anet/services/node";
import {
  FIXTURE_INDIVIDUAL_PLAN_PROVIDER_ID,
  FIXTURE_TEAM_PLAN_PROVIDER_ID,
} from "./fixture-provider-ids.js";
import { TaskIndexRepo } from "../../../../services/src/session/taskIndexRepo.js";
import { createANetTaskIndexSyncer } from "../../../../services/src/anet-agent/anetTaskIndexSyncer.js";
import { getE2EAppDataPaths } from "./desktop-app.js";

/** 独立测试 Host + 真实 stdio Worker；仅账号上游和模型 HTTP 使用隔离 fixture。 */
export async function createWorkerSelectionIntegration(
  directory = "worker-selection-host",
  options: { workspacePath?: string; cliNodeArgs?: string[] } = {},
) {
  const paths = getE2EAppDataPaths();
  const home = join(paths.homeDir, directory);
  const workspacePath = options.workspacePath ?? join(home, "workspace");
  await mkdir(workspacePath, { recursive: true });
  const previousDataDir = getDataBaseDir();
  setDataBaseDir(home);
  const source = new MutableAccountProviderConfigSource();
  const deliverySource = new MutableAccountProviderConfigSource();
  let deliveryPaused = false;
  const runtimePaths = {
    anetBuiltinFilePath: resolve("../../config/provider/anet-builtin.json"),
    personalFilePath: join(home, ".anet-one/v2/provider_config.json"),
  };
  // 独立 Host 不继承 Electron 设置。保持内建 HTTPS endpoint，
  // 将显式网络出口接到本轮数据面代理，避免假凭据直连或 HTTP 被官方请求安全校验拒绝。
  const httpProxy = process.env.ANET_HTTP_PROXY?.trim();
  const caCertFile = process.env.ANET_AGENT_CA_CERT?.trim();
  if (!httpProxy || !caCertFile) throw new Error("Worker 选择回归缺少隔离 HTTPS 数据面代理");
  await mkdir(join(home, ".anet-one/cli"), { recursive: true });
  await writeFile(
    join(home, ".anet-one/cli/config.json"),
    JSON.stringify({
      network: { httpProxy, caCertFile, noProxy: process.env.ANET_NO_PROXY },
    }),
  );
  const runtime = new NodeProviderRegistryRuntime({
    ...runtimePaths,
    accountSource: source,
    watch: false,
    personalPollingIntervalMs: false,
  });
  await runtime.start();
  const config = await runtime.configService.read();
  const individual = FIXTURE_INDIVIDUAL_PLAN_PROVIDER_ID;
  const team = FIXTURE_TEAM_PLAN_PROVIDER_ID;
  const modelId = "model-a-flash";
  async function selectAccount(providerId: string) {
    const base = createFailClosedAccountProviderConfigSnapshot(config);
    const providers = new Map(base.providers.entries());
    for (const id of [individual, team]) {
      providers.set(
        id,
        new ProviderConfig({
          access: new ProviderAccountAccessConfig({ entitled: true }),
          builtinModelIds: [modelId],
        }),
      );
    }
    source.replace(
      createAccountProviderConfigSnapshot(
        config.anetBuiltinRevision,
        new ProviderConfigMap([...providers]),
        Object.fromEntries(
          [individual, team].map((id) => [
            id,
            {
              availability: "available" as const,
              entitled: true,
              current: id === providerId,
            },
          ]),
        ),
      ),
    );
    await runtime.registryService.refresh("test-account-change");
    if (!deliveryPaused) deliverySource.replace(await source.read());
  }
  await selectAccount(individual);
  const facade = createNodeModelSelectionFacade(runtime.registryService);
  const modelSelectionService = {
    getView: async (input?: ModelSelectionViewInput) => facade.getView(undefined, undefined, input),
    onDidChange: (listener: Parameters<typeof facade.onDidChange>[0]) => ({
      dispose: facade.onDidChange(listener),
    }),
  };
  const repo = new TaskIndexRepo();
  const projects: ProjectRepositoryContract = await repo.getProjectRepository();
  const agent = createANetAgentService({
    // 真实 Host 创建端口必须预留任务归属；旧夹具漏装配，Worker 启动前即报 creation-unavailable。
    prepareSessionCreation: async (target) => {
      const prepared = projects.reserveCreatedTask({
        task: { ...target, taskId: target.sessionId },
        projectId: target.projectId,
        creationCommand: target.creationCommand,
        additionalDirectories: target.additionalDirectories,
      });
      return { sessionId: prepared.taskId, additionalDirectories: prepared.additionalDirectories };
    },
    commandResolver: () => ({
      command: process.execPath,
      args: [
        ...(options.cliNodeArgs ?? []),
        resolve("../../apps/anet-cli/packages/cli/dist/anet.cjs"),
        "app-server",
        "--stdio",
      ],
      env: {
        HOME: home,
        USERPROFILE: home,
        ANET_DATA_BASE_DIR: home,
        ANET_RUNTIME_ENV: "development",
        ANET_BUILTIN_PROVIDER_CONFIG_FILE: runtimePaths.anetBuiltinFilePath,
        ANET_PERSONAL_PROVIDER_CONFIG_FILE: runtimePaths.personalFilePath,
      },
    }),
    modelSelectionReadinessSource: modelSelectionService,
    accountProviderConfigSource: deliverySource,
    // 测试只核对选择合同；不使用真实账号、真实 secret 或外部 IM 网络。
    accountRequestAuthService: {
      resolveAccessCurrent: async () => ({
        type: "provider-account",
        family: "family-a",
        planKind: "team-coding-plan",
        productId: "product-team-a",
        organizationId: "org-team-a",
        projectId: "proj-team-a",
      }),
      // 合成凭据仍须符合账号接口的 key.secret 形状；裸标签会在本地校验阶段被拒绝。
      resolveCurrent: async () => ({ apiKey: "e2e-fixture-key.synthetic-secret" }),
      assertCurrent: async () => {},
    },
    // 夹具只用 Team Plan，不会读取验证配置；返回 null 保持 Start Plan 失败关闭的正式语义。
    readRequestVerificationConfig: async () => null,
  });
  const syncer = createANetTaskIndexSyncer({ agentService: agent, taskIndexRepo: repo });
  const task = createANetTaskServiceAdapter({
    anetAgentService: agent,
    taskIndexRepo: repo,
    taskIndexSyncer: syncer,
  });
  return {
    home,
    repo,
    projects,
    workspacePath,
    agent,
    task,
    modelSelectionService,
    selectAccount,
    async setDeliveryPaused(paused: boolean) {
      deliveryPaused = paused;
      if (!paused) deliverySource.replace(await source.read());
    },
    async dispose() {
      syncer.disposeAll();
      await agent.disposeWorkspace({ workspacePath });
      await agent.disposeAllAndWait();
      repo.close();
      runtime.dispose();
      setDataBaseDir(previousDataDir);
    },
  };
}
