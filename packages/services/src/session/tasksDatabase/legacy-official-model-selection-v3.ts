// 这一条迁移原本把厂商官方模型名的大小写归一到官方写法,匹配条件是厂商套餐 provider id
// (account:<厂商>-start-plan 等)加厂商模型名。厂商 provider 已随账号体系一并移除,
// 这些 providerId 不可能再出现在数据里,因此条件恒不成立 —— 保留整段 SQL 只会把厂商的
// 模型名单留在分发物里。
//
// 这里替换成空操作,而不是删掉这一条:迁移 id 记在数据库的已应用账本里,删掉会让编号出现
// 空档。空操作改变了该 id 的 checksum,对已应用过旧 SQL 的库会判为不一致;本产品的数据根是
// ~/.anet-one(与上游的数据根不同路径),新路径下不存在应用过旧 SQL 的库,因此没有兼容影响。
export const LEGACY_OFFICIAL_MODEL_SELECTION_MIGRATION_SQL = "";
