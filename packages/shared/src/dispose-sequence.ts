/**
 * 按顺序释放一组资源:每一步独立捕获,全部执行完之后再把第一个错误抛出去。
 *
 * 为什么需要它:注销链原先写成裸语句序列(`a.dispose(); b.dispose(); c.dispose();`)。
 * 任何一步抛错,后面的资源就全部留着不释放 —— 其中包括文件监视器这类会把 Node 事件
 * 循环撑住的句柄,表现是进程跑完所有工作却不退出。错误本身不能吞掉,否则一处注销失败
 * 永远不会被发现,所以这里只推迟抛出,不改变"会抛"这个事实。
 *
 * 第一个错误被抛出,其余错误挂在它的 `cause` 上(多于一个时是一个数组),不另写日志:
 * 这个模块在任何平台与运行形态下都要能用,不该在这里绑定某一套 logger。
 */
export function disposeInSequence(steps: readonly (() => void)[]): void {
  const errors: unknown[] = [];
  for (const step of steps) {
    try {
      step();
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length === 0) return;
  const [first, ...rest] = errors;
  if (rest.length > 0 && first instanceof Error && first.cause === undefined) {
    throw Object.assign(first, { cause: rest.length === 1 ? rest[0] : rest });
  }
  throw first;
}
