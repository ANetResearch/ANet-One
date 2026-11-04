export interface DefaultPluginMarketplace {
  id: string;
  source: string;
  name: string;
  description: string;
  pluginCount: number;
  lastUpdated?: string;
}

export const ANET_OFFICIAL_PLUGIN_MARKETPLACE_ID = "anet-plugins-official";

/**
 * Claude Code 官方市场（GitHub git 源）。它不是 ANet 的强依赖：GitHub 不可达时刷新必然失败，
 * 该失败不应作为错误提示打扰用户，UI 侧按此 id 静默处理其刷新失败（任何原因）。
 */
export const CLAUDE_OFFICIAL_PLUGIN_MARKETPLACE_ID = "claude-plugins-official";

/**
 * 依赖上游厂商服务端、已从默认启用名单剔除的插件。与 CLI 侧
 * `VENDOR_HOSTED_OFFICIAL_PLUGIN_NAMES`(official-plugin-definitions.ts)同一份名单:
 * 两边都要剔,否则 Settings 显示"默认启用"而 CLI 实际关闭,两处状态不一致。
 * 剔除原因见 CLI 侧那份注释。
 */
export const VENDOR_HOSTED_OFFICIAL_PLUGIN_IDS: readonly string[] = [
  "image-search@anet-plugins-official",
  "anet-guide@anet-plugins-official",
  "anet-site@anet-plugins-official",
];

/** Settings 三类资源发现共用；Bootstrap 单测与官方 definition 的 defaultEnabled 机械对照。 */
export const DEFAULT_ENABLED_OFFICIAL_PLUGIN_IDS: ReadonlySet<string> = new Set([
  "browser-use@anet-plugins-official",
  "documents@anet-plugins-official",
  "pdf@anet-plugins-official",
  "presentations@anet-plugins-official",
  "spreadsheets@anet-plugins-official",
  // node_repl 宿主：不进市场、不对用户露出，也不贡献任何 skill/command/subagent，但必须
  // 始终可用 —— node_repl 的注册门禁是「Browser Use 或 Computer Use 任一启用」，宿主自己
  // 不参与那个判断。Browser Use 默认开着，宿主若默认关就等于它上来就没有宿主。
  "node-repl-host@anet-plugins-official",
  "skill-creator@anet-plugins-official",
  "plugin-creator@anet-plugins-official",
  // visualize（交互视图）随 UI 插件合入时 CLI 定义已标 defaultEnabled，但这里漏加，
  // Settings 会把它当成默认关闭，与 CLI 实际启用状态不一致。
  "visualize@anet-plugins-official",
  // image-search / anet-guide / anet-site 已从本名单剔除,见
  // VENDOR_HOSTED_OFFICIAL_PLUGIN_IDS。
  // 电脑控制回退为默认关闭，故 computer-use 不在此名单内。
  // 该集合必须与 official-plugin-definitions.ts 里标了 defaultEnabled 的插件逐一对应，
  // bootstrap 的「Settings 默认启用集合与 CLI 的官方插件声明一致」单测机械对照两者。
]);

function resolveOfficialPluginMarketplaceSource(): string {
  const configured =
    typeof process === "undefined"
      ? undefined
      : process.env?.ANET_OFFICIAL_PLUGIN_MARKETPLACE_SOURCE?.trim();
  return configured ?? "";
}

export const DEFAULT_PLUGIN_MARKETPLACES: DefaultPluginMarketplace[] = [
  {
    // 随包 seed 分片与远端 manifest 分片在 Agent storage 内合并。上游的 source 指向
    // 其自有 CDN:刷新一次就把用户 IP 和版本告诉该 CDN,并允许它改写插件清单。
    // 本分发留空 source —— 只用随包 seed,不向任何远端拉取官方插件清单。
    // 设置 ANET_OFFICIAL_PLUGIN_MARKETPLACE_SOURCE 可指向自建 manifest。
    id: ANET_OFFICIAL_PLUGIN_MARKETPLACE_ID,
    source: resolveOfficialPluginMarketplaceSource(),
    name: ANET_OFFICIAL_PLUGIN_MARKETPLACE_ID,
    description: "Built-in plugins bundled with this build.",
    pluginCount: 0,
  },
  {
    id: CLAUDE_OFFICIAL_PLUGIN_MARKETPLACE_ID,
    source: "anthropics/claude-plugins-official",
    name: CLAUDE_OFFICIAL_PLUGIN_MARKETPLACE_ID,
    description:
      "Directory of popular Claude Code extensions including development tools, productivity plugins, and MCP integrations",
    // 只内置官方 catalog 来源，不把远端 manifest 快照打包进仓库；首次刷新前数量未知。
    pluginCount: 0,
  },
];

// 商店「公开」分段只有一个 ANet 官方市场 id，内置与 CDN 不再拆分身份。
export const PUBLIC_STORE_MARKETPLACE_IDS = [ANET_OFFICIAL_PLUGIN_MARKETPLACE_ID] as const;

export function isPublicStoreMarketplaceId(id: string): boolean {
  return (PUBLIC_STORE_MARKETPLACE_IDS as readonly string[]).includes(id);
}
