import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// 技能包是随仓库交付的纯文本:frontmatter 的 name 与目录名不一致时技能不会加载,
// 而且不会报错 —— 只是静默不出现。这里把这类结构性约束钉住。
const BUNDLE = fileURLToPath(
  new URL("../../../delivery/workdesk/.anet-one/skills", import.meta.url),
);

function skillDirs(): string[] {
  return readdirSync(BUNDLE).filter((d) => statSync(join(BUNDLE, d)).isDirectory());
}

function frontmatter(dir: string): { name?: string; description?: string; body: string } {
  const text = readFileSync(join(BUNDLE, dir, "SKILL.md"), "utf8");
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/u.exec(text);
  if (!m) {
    return { body: text };
  }
  const out: Record<string, string> = {};
  for (const line of m[1]!.split("\n")) {
    const kv = /^([a-z-]+):\s*(.*)$/u.exec(line);
    if (kv) {
      out[kv[1]!] = kv[2]!;
    }
  }
  return { name: out.name, description: out.description, body: m[2]! };
}

// project-ledger 定义的状态与待决类别,其余技能只能引用这里的值。
const STATUSES = [
  "未开始",
  "进行中",
  "等外部反馈",
  "等内部决定",
  "等领导批示",
  "已交材料",
  "已完成",
  "已搁置",
];
const CATEGORIES = ["只需知情", "需要批准", "专业判断"];
// 待决事项表的状态,与主表的状态枚举刻意不同:一个记事情做到哪一步,一个记
// 问出去的话有没有回音。
const PENDING_STATES = ["待答复", "已答复", "已撤回"];

// research-notes 定义的资料库字段与核实状态,其余技能只能引用这里的值。
// 与台账的字段分成两套:台账记"事情办到哪一步",资料库记"这个结论的依据能不能核对"。
const RESEARCH_COLUMNS = [
  "标题",
  "类型",
  "主题",
  "来源",
  "链接",
  "访问日期",
  "核实状态",
  "支持结论的原文",
  "归属",
  "保留期",
  "记录人",
  "记录时间",
];
const VERIFY_STATES = ["已核实", "未核实", "打不开", "需付费"];
const OWNERSHIPS = ["个人资料", "公司资料", "项目资料"];

// 字段必须以表格首列的形式定义,不能只在正文里被提到。
// `toContain` 挡不住"把列定义改名而正文仍用旧名":改掉 `| \`支持结论的原文\` |`
// 之后,该词在核实状态表的说明里还在,断言照样通过(2026-11-02 用 mutation 发现)。
const LEDGER_MAIN_COLUMNS = [
  "事项",
  "项目",
  "阶段",
  "负责人",
  "交办人",
  "截止",
  "状态",
  "阻塞对象",
  "完成依据",
  "来源",
  "确认状态",
  "更新人",
  "更新时间",
];

function firstCells(body: string): Set<string> {
  const out = new Set<string>();
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      continue;
    }
    const cell = trimmed.split("|")[1]?.trim().replace(/^`|`$/gu, "");
    if (cell) {
      out.add(cell);
    }
  }
  return out;
}

describe("办公台账技能包", () => {
  it("技能清单与预期一致", () => {
    expect(skillDirs().sort()).toEqual(
      [
        "concept-image",
        "deck",
        "handover",
        "one-pager",
        "project-ledger",
        "research-notes",
        "weekly-report",
      ].sort(),
    );
  });

  it("每个技能的 frontmatter name 与目录名一致", () => {
    for (const dir of skillDirs()) {
      const fm = frontmatter(dir);
      expect(fm.name, `${dir}/SKILL.md 缺少 frontmatter name`).toBe(dir);
      expect((fm.description ?? "").length, `${dir} 的 description 太短`).toBeGreaterThan(20);
    }
  });

  it("project-ledger 定义了全部状态与待决类别", () => {
    const body = frontmatter("project-ledger").body;
    for (const s of STATUSES) {
      expect(body, `状态枚举缺 ${s}`).toContain(s);
    }
    for (const c of CATEGORIES) {
      expect(body, `待决类别缺 ${c}`).toContain(c);
    }
    for (const p of PENDING_STATES) {
      expect(body, `待决事项状态缺 ${p}`).toContain(p);
    }
    // 两套枚举不得混用。
    for (const p of PENDING_STATES) {
      expect(STATUSES, `${p} 不应出现在主表状态枚举里`).not.toContain(p);
    }
  });

  it("其余技能引用的台账字段与枚举都在 project-ledger 里有定义", () => {
    // 防口径漂移:改了一处枚举而忘了另一处,会让汇报里出现台账填不出来的值。
    // 只校验反引号括起来的词 —— 用正则扫中文散文会把"已催过""等了多久"这类
    // 普通词也当成枚举值。约定:引用台账的字段名和枚举值时一律加反引号。
    const columns = [
      "事项",
      "项目",
      "阶段",
      "负责人",
      "交办人",
      "截止",
      "状态",
      "阻塞对象",
      "完成依据",
      "来源",
      "确认状态",
      "更新人",
      "更新时间",
      "类别",
      "需要谁决定",
      "可选方案",
      "期望答复时间",
      "答复",
      "提出时间",
      "字段",
      "原值",
      "新值",
      "依据/来源",
      "时间",
    ];
    const ledgerDefined = [
      ...STATUSES,
      ...CATEGORIES,
      ...PENDING_STATES,
      ...columns,
      "待确认",
      "已确认",
    ];
    const researchDefined = [...RESEARCH_COLUMNS, ...VERIFY_STATES, ...OWNERSHIPS];
    const ledger = frontmatter("project-ledger").body;
    for (const value of ledgerDefined) {
      expect(ledger, `project-ledger 里没有定义 \`${value}\``).toContain(value);
    }
    const research = frontmatter("research-notes").body;
    for (const value of researchDefined) {
      expect(research, `research-notes 里没有定义 \`${value}\``).toContain(value);
    }
    const defined = new Set([...ledgerDefined, ...researchDefined]);
    const cjk = /^[\u4e00-\u9fa5/]+$/u;
    for (const dir of ["one-pager", "handover", "weekly-report", "concept-image", "deck"]) {
      const body = frontmatter(dir).body;
      for (const raw of body.match(/`[^`\n]+`/gu) ?? []) {
        // 形如 `确认状态 = 待确认` 的,取等号两侧分别校验。
        for (const token of raw
          .slice(1, -1)
          .split("=")
          .map((t) => t.trim())) {
          if (!token || !cjk.test(token)) {
            continue;
          }
          expect(defined.has(token), `${dir} 里的 \`${token}\` 不是台账定义的字段或枚举`).toBe(
            true,
          );
        }
      }
    }
  });

  it("三类待决事项的处理差异写明了", () => {
    // 文档的要求是把"只需同步"和"必须等待批准"分清;一页纸汇报必须据此分流,
    // 否则专业判断类会被上报等批示而卡住。
    const body = frontmatter("one-pager").body;
    expect(body).toContain("需要批准");
    expect(body).toContain("专业判断");
    expect(body).toContain("只需知情");
  });

  it("出图技能说明了档次差价与印刷限制", () => {
    const body = frontmatter("concept-image").body;
    // 直接用最贵档试方向会把钱花在会被丢掉的图上。
    expect(body).toContain("image-fast");
    expect(body).toContain("image-max");
    // size 是像素不是物理尺寸:放大位图送印会模糊,必须讲清。
    expect(body).toContain("300dpi");
    // token 不进命令行:ps 对同机其他用户可见。
    expect(body).toContain("ANET_TOKEN");
    expect(body).toContain("ps");
  });

  it("台账技能说明了输出预算", () => {
    // 输出上限不足时模型会在表格中途截断,而截断的表格看起来像完整台账,
    // 少掉的行没有任何提示。实测整表重出约 6700 个输出 token。
    const body = frontmatter("project-ledger").body;
    expect(body).toContain("8000");
    expect(body).toContain("截断");
  });

  it("润色周报不得新增事实", () => {
    const body = frontmatter("weekly-report").body;
    expect(body).toContain("不新增事实");
  });

  it("资料库把已核实与未核实分开,并要求留原文", () => {
    // 客户反馈的原话是"AI 给出的部分海外链接难以打开,也难以知道原文哪一处支持了
    // 结论"。把未核实的写成已核实,正是这个问题本身。
    const body = frontmatter("research-notes").body;
    expect(body).toContain("不得合并");
    expect(body).toContain("支持结论的原文");
    // 打不开要记成打不开,不能换二手转述再标成已核实。
    expect(body).toContain("二手转述");
  });

  it("资料库写明定时执行尚未实现", () => {
    // 客户明确要求"交付的工作能够定时执行"。TokenBank 侧没有用户可配置的定时任务,
    // 也没有到达用户的推送通道。写成已支持会让交付说明与事实不符。
    const body = frontmatter("research-notes").body;
    expect(body).toContain("定时执行目前没有实现");
  });

  it("字段是以表格首列定义的,不是只在正文里提过", () => {
    const cases: Array<[string, readonly string[]]> = [
      ["project-ledger", LEDGER_MAIN_COLUMNS],
      ["research-notes", [...RESEARCH_COLUMNS, ...VERIFY_STATES]],
    ];
    for (const [dir, tokens] of cases) {
      const cells = firstCells(frontmatter(dir).body);
      for (const token of tokens) {
        expect(cells.has(token), `${dir} 没有把 ${token} 定义成表格的一行`).toBe(true);
      }
    }
  });

  it("PPT 技能把结论放在前面,并交付可编辑文件", () => {
    const body = frontmatter("deck").body;
    expect(body).toContain("结论页在前");
    // 客户明确提出成果要可继续编辑,所以交付 pptx 而不是图片或 PDF。
    expect(body).toContain("可继续编辑");
    expect(body).toContain("pptx");
  });
});
