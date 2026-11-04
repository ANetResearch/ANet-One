// CLI 的依赖链里有 node:sqlite(packages/shared/src/sqlite-migrations),该内建模块在
// Node 24 之前不可用。不加这道检查时,在 Node 22 上运行发布的 bundle 得到的是
// ERR_UNKNOWN_BUILTIN_MODULE 的调用栈,看不出缺的是 Node 版本。
// 必须是 main.ts 的第一个 import:esbuild 的 CJS 产物按 import 顺序初始化模块,
// 排在 @anet/shared/sqlite-migrations 之后就已经来不及了。
export const MINIMUM_NODE_MAJOR = 24;

/** 不支持时返回要打印的说明,支持则返回 undefined。版本号无法解析时视为支持 —— 拒绝一个
 *  读不出版本的运行时,比放它过去的代价更大。 */
export const unsupportedNodeVersionMessage = (version: string): string | undefined => {
  const major = Number.parseInt(version.replace(/^v/, "").split(".")[0] ?? "", 10);
  if (!Number.isInteger(major) || major >= MINIMUM_NODE_MAJOR) return undefined;
  return [
    `anet 需要 Node.js ${MINIMUM_NODE_MAJOR} 或更高版本,当前是 ${version}。`,
    `依赖的 node:sqlite 内建模块在 Node ${MINIMUM_NODE_MAJOR} 之前不存在。`,
  ].join("\n");
};

interface NodeVersionGateTarget {
  exit: (code: number) => never;
  stderr: { write: (chunk: string) => unknown };
  version: string;
}

export const assertSupportedNodeVersion = (
  target: Pick<NodeVersionGateTarget, "exit" | "stderr" | "version"> = process as unknown as NodeVersionGateTarget,
): void => {
  const message = unsupportedNodeVersionMessage(target.version);
  if (!message) return;
  target.stderr.write(`${message}\n`);
  target.exit(1);
};

assertSupportedNodeVersion();
