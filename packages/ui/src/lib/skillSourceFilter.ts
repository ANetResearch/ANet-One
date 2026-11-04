import { ANET_AGENT_PROVIDER, type ANetProvider } from "@anet/shared";

type SkillSourceType = "anet" | "unknown";

export function resolveSkillSourceType(skillPath: string): SkillSourceType {
  const normalized = skillPath.replaceAll("\\", "/").toLowerCase();
  if (normalized.includes("/.anet-one/skills/")) {
    return "anet";
  }
  if (normalized.includes("/.anet-one/cli/plugins/cache/")) {
    return "anet";
  }
  return "unknown";
}

const SKILL_ID_PROVIDER_RE = new RegExp(`^${ANET_AGENT_PROVIDER}:`);

function isAnetSkill(skill: { id?: string; path: string; scope?: string }): boolean {
  return (
    // plugin skill 的真实路径在 CLI plugin cache 下，不在 `.anet-one/skills`。
    // 服务层已用 scope 标记来源，前端过滤时要放行，否则 `/` 和 `$` 面板会漏掉插件技能。
    skill.scope === "plugin" ||
    (typeof skill.id === "string" && SKILL_ID_PROVIDER_RE.test(skill.id)) ||
    resolveSkillSourceType(skill.path) === "anet"
  );
}

export function filterSkillsForProvider<T extends { path: string; id?: string; scope?: string }>(
  skills: T[],
  _legacyProvider: ANetProvider,
): T[] {
  return skills.filter(isAnetSkill);
}
