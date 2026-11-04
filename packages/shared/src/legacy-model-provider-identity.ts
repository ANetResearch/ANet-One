// 不凭用户自定义 Provider 的名字猜所属站点；闲时 Ticket 的绑定身份也不能改。

/**
 * 旧数据里官方模型名的大小写归一入口。
 *
 * 上游在这里按厂商内置 provider 的 id 判断,再把模型名收敛到官方名单的规范大小写。
 * 本分发不内置厂商 provider,也不再随包维护官方模型名单,因此没有可归一的目标:
 * 原样返回。保留这个接缝而不是删掉,是因为调用方(subagent 选择、bots 存储迁移)
 * 的迁移链路仍然成立 —— 接入自家官方模型名单后在这里补归一即可。
 */
export function migrateLegacyOfficialModelId(_providerId: string, modelId: string): string {
  return modelId;
}

/**
 * 仅供已发布旧数据的单向升级使用，不是运行时 Provider 别名或选择兜底。
 * 依赖当前账号解释旧 Coding Plan 会使离线/SSH 迁移丢失原意图。
 * 迁移不查模型/档位是否可用；普通未知 ID 不构成旧格式证据。
 *
 * 上游在这里把厂商的 6 个旧 `builtin:` id 映射到新的内置 provider id。那些 provider
 * 已随厂商一并移除,旧 id 没有对应落点,因此统一按"未知 builtin"返回 undefined,
 * 与此前对其它未知 `builtin:` id 的处理一致;非 builtin 的自定义 id 原样返回。
 */
export function migrateLegacyModelProviderId(providerId: string): string | undefined {
  return providerId.startsWith("builtin:") ? undefined : providerId;
}
