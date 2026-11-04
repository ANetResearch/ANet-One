import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 默认 5000ms 在 64 核共享构建机上会被打穿:实测 6 个用例(dynamic-workflow-skill、
    // provider-runtime-headers-cancel、provider-registry-app-runtime ×2、v4-gateway、
    // workspace-mcp-trust)报 "Test timed out in 5000ms",它们等的是真实子进程、
    // SQLite 写入与模块导入,不是逻辑死等。仓库根 vitest.config.ts 已按同一理由取
    // testTimeout: 30_000 / hookTimeout: 30_000;这里取 20_000 与之对齐。
    // 时限是墙钟上限,不是断言 —— 调它不改变任何被测行为。
    testTimeout: 20_000,
    hookTimeout: 30_000,
    // vitest 缺省按 (CPU 数 - 1) 开 worker。配合 `turbo run test` 原来的并行度,64 核机器上
    // 就是十几个包 × 63 个进程抢 64 个核;超订的代价不只是慢,同一份活还要多烧明显更多的
    // CPU(GC 与内存带宽争用),于是一批"按时间或按时序"的断言只在全量跑中随机失败,
    // 单独跑全绿。包间并行已经由 package.json 的 `turbo run test --concurrency=1` 收掉,
    // 这里再把包内并行封顶:与仓库根 vitest.config.ts 同取 4,也让 CI 上 2～4 核的 runner
    // 不至于把自己压垮。
    maxWorkers: 4,
    // Bugfix: 外部 anet-cli 历史里同时存在 test/ 和 tests/ 目录；合入 apps 后需要同时保留两种约定，避免新增包测试被根 include 规则过滤掉。
    include: [
      "test/**/*.test.ts",
      "tests/**/*.test.ts",
      "packages/*/test/**/*.test.ts",
      "packages/*/tests/**/*.test.ts",
    ],
  },
});
