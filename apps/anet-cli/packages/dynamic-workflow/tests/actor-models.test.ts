import { describe, expect, it } from "vitest";
import { analyzeWorkflowScript } from "../src/index.js";
import { MODEL_REFERENCE_CODE } from "../src/analysis/actor-models.js";
import { lowerWorkflowScript } from "../src/lowering/index.js";

// 子代理模型名集合的封闭性（9010，docs/dynamic-workflow/authoring.md「Choosing a model per
// subagent」）。规则判的是 persona `model` 属性的**类型**：ModelRef、字符串字面量类型或它们的
// 联合才收；收下的每个字面量都进 `modelReferences`，launch 工具据此在确认窗之前解析全部名字。

function analyze(scriptText: string) {
  const result = analyzeWorkflowScript(scriptText);
  const hits = result.diagnostics.filter((d) => d.code === MODEL_REFERENCE_CODE);
  return { hits, result };
}

/** 干净脚本：没有任何诊断，返回收集到的名字（按出现顺序，含重复）。 */
function namesOf(scriptText: string): string[] {
  const { result } = analyze(scriptText);
  expect(result.diagnostics).toEqual([]);
  expect(result.ok).toBe(true);
  return result.modelReferences.map((ref) => ref.name);
}

describe("persona model: accepted forms", () => {
  it("an inline string literal", () => {
    expect(
      namesOf(`const a = agent("评审员", { system: "s", model: "Model-A-Fast" });\nreturn 1;`),
    ).toEqual(["Model-A-Fast"]);
  });

  it("keeps the name verbatim, reasoning level and provider included", () => {
    expect(
      namesOf(
        `agent("a", { model: "vendor-a/Model-A$high" });\nagent("b", { model: " Model-A " });\nreturn 1;`,
      ),
    ).toEqual(["vendor-a/Model-A$high", " Model-A "]);
  });

  it("a const bound to a literal, and a ternary between two literals", () => {
    const names = namesOf(
      `const FLASH = "Model-A-Fast";\n` +
        `const hard = args.hard === true;\n` +
        `agent("a", { model: FLASH });\n` +
        `agent("b", { model: hard ? "Model-A$high" : FLASH });\n` +
        `return 1;`,
    );
    // 联合成员的顺序是 checker 的（类型 id 序），不是源码序：只断言集合与次数。
    expect([...names].sort()).toEqual(["Model-A$high", "Model-A-Fast", "Model-A-Fast"]);
  });

  it("a shorthand property bound to a literal const", () => {
    expect(namesOf(`const model = "Model-A-Fast";\nagent("a", { model });\nreturn 1;`)).toEqual([
      "Model-A-Fast",
    ]);
  });

  it("a persona object declared as const", () => {
    expect(
      namesOf(
        `const persona = { system: "s", model: "Model-A-Fast" } as const;\nagent("a", persona);\nreturn 1;`,
      ),
    ).toEqual(["Model-A-Fast"]);
  });

  it("routing through a model() table: every declared name is collected once per call", () => {
    const script =
      `const MODELS = { light: model("Model-A-Fast"), strong: model("Model-A$high") };\n` +
      `interface Route { tier: "light" | "strong" }\n` +
      `const route = await agent("分诊", { model: MODELS.light }).ask<Route>("pick");\n` +
      `const answer = await agent("答复者", { model: MODELS[route.tier] }).ask("go");\n` +
      `return answer;`;
    const { result } = analyze(script);
    expect(result.diagnostics).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.modelReferences).toEqual([
      { name: "Model-A-Fast", line: 1, column: 31 },
      { name: "Model-A$high", line: 1, column: 62 },
    ]);
    // 分析照常产出图：模型不是图的一部分。
    expect(result.graph).toBeDefined();
  });

  it("a ModelRef passed through a helper function parameter", () => {
    const names = namesOf(
      `const LIGHT = model("Model-A-Fast");\n` +
        `function judge(name: string, m: ModelRef) { return agent(name, { model: m }); }\n` +
        `await judge("a", LIGHT).ask("x");\n` +
        `return 1;`,
    );
    expect(names).toEqual(["Model-A-Fast"]);
  });

  it("a literal union answered by a router (the schema pins the enum)", () => {
    const names = namesOf(
      `interface Route { model: "Model-A" | "Model-A-Fast" }\n` +
        `const r = await agent("分诊").ask<Route>("pick");\n` +
        `await agent("答复者", { model: r.model }).ask("go");\n` +
        `return 1;`,
    );
    expect([...names].sort()).toEqual(["Model-A", "Model-A-Fast"]);
  });

  it("no model anywhere: nothing collected, string personas skipped", () => {
    expect(
      namesOf(`agent("a");\nagent("b", "You review.");\nagent("c", { system: "s" });\nreturn 1;`),
    ).toEqual([]);
  });

  it("a spread persona whose model is a literal type", () => {
    expect(
      namesOf(
        `const base = { model: "Model-A-Fast" } as const;\nagent("a", { ...base, system: "s" });\nreturn 1;`,
      ),
    ).toEqual(["Model-A-Fast"]);
  });
});

describe("persona model: rejected forms (9010)", () => {
  const expectRejected = (script: string, line: number) => {
    const { hits, result } = analyze(script);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.line).toBe(line);
    expect(result.ok).toBe(false);
    // 与 world.run / phase 同席：图不产出。
    expect(result.graph).toBeUndefined();
    return hits[0]!;
  };

  it("a let binding widens to string", () => {
    const hit = expectRejected(`let m = "Model-A-Fast";\nagent("a", { model: m });\nreturn 1;`, 2);
    expect(hit.message).toContain("'string'");
    expect(hit.message).toContain("model(");
  });

  it("a persona object built into a variable (its model widens)", () => {
    const hit = expectRejected(
      `const persona = { system: "s", model: "Model-A-Fast" };\nagent("a", persona);\nreturn 1;`,
      2,
    );
    expect(hit.message).toContain("as const");
  });

  it("a template with a hole", () => {
    expectRejected(
      `const v = args.v as string;\nagent("a", { model: \`Model-\${v}\` });\nreturn 1;`,
      2,
    );
  });

  it("a parameter typed AgentPersona (its model could be any string)", () => {
    expectRejected(
      `function make(p: AgentPersona) { return agent("a", p); }\nawait make({ system: "s" }).ask("x");\nreturn 1;`,
      1,
    );
  });

  it("a model name computed from a subagent's answer", () => {
    expectRejected(
      `const name = await agent("分诊").ask("which model?");\nagent("b", { model: name });\nreturn 1;`,
      2,
    );
  });

  it("one bad branch of a conditional persona is enough", () => {
    expectRejected(
      `const s = args.s as string;\nagent("a", args.x ? { model: "Model-A" } : { model: s });\nreturn 1;`,
      2,
    );
  });

  it("model() with a non-literal, an empty literal, or no argument", () => {
    const { hits, result } = analyze(
      `const v = args.v as string;\nconst a = model(v);\nconst b = model("  ");\nreturn 1;`,
    );
    expect(hits.map((h) => h.line)).toEqual([2, 3]);
    expect(hits[0]?.message).toContain("string literal");
    expect(result.modelReferences).toEqual([]);
  });

  it("an empty string literal as the model", () => {
    expectRejected(`agent("a", { model: "" });\nreturn 1;`, 1);
  });

  it("ModelRef used as a value (it does not exist at run time)", () => {
    const { hits } = analyze(
      `const m = model("Model-A");\nconst isRef = (m as unknown) instanceof ModelRef;\nreturn isRef;`,
    );
    expect(hits).toHaveLength(1);
    expect(hits[0]?.line).toBe(2);
    expect(hits[0]?.message).toContain("only as a type");
  });

  it("a ModelRef cannot be forged by an object literal or new (TypeScript errors, not 9010)", () => {
    const literal = analyzeWorkflowScript(
      `agent("a", { model: { modelRef: undefined as never } });\nreturn 1;`,
    );
    expect(literal.ok).toBe(false);
    expect(literal.diagnostics.some((d) => d.code !== MODEL_REFERENCE_CODE)).toBe(true);
    const constructed = analyzeWorkflowScript(`const m = new ModelRef();\nreturn 1;`);
    expect(constructed.ok).toBe(false);
  });

  it("aliasing model() is facade misuse (9001), not a way around 9010", () => {
    const result = analyzeWorkflowScript(
      `const m = model;\nagent("a", { model: m("x") });\nreturn 1;`,
    );
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.code).toBe(9001);
  });

  it("names are still collected next to other authoring diagnostics", () => {
    const { result } = analyze(
      `let m = "x" as string;\nagent("a", { model: m });\nagent("b", { model: "Model-A" });\nreturn 1;`,
    );
    expect(result.ok).toBe(false);
    expect(result.modelReferences.map((r) => r.name)).toEqual(["Model-A"]);
  });
});

describe("lowering model()", () => {
  it('erases model("x") to the string itself and leaves the persona object alone', () => {
    const result = lowerWorkflowScript(
      `const MODELS = { light: model("Model-A-Fast") };\n` +
        `const a = agent("评审员", { system: "s", model: MODELS.light });\n` +
        `const b = agent("写手", { model: "Model-A$high" });\n` +
        `return 1;`,
    );
    expect(result.ok).toBe(true);
    const code = result.lowered!.code;
    expect(code).toContain(`light: "Model-A-Fast"`);
    expect(code).not.toMatch(/\bmodel\(/);
    expect(code).toContain(`model: MODELS.light`);
    expect(code).toContain(`model: "Model-A$high"`);
    expect(code).not.toContain("ModelRef");
  });

  it("the lowered code runs: a ModelRef is its name at run time", async () => {
    const result = lowerWorkflowScript(
      `const MODELS = { light: model("Model-A-Fast"), strong: model("Model-A") };\n` +
        `const pick: "light" | "strong" = args.hard === true ? "strong" : "light";\n` +
        `agent("答复者", { model: MODELS[pick] });\n` +
        `return 1;`,
    );
    expect(result.ok).toBe(true);
    const personas: unknown[] = [];
    const host = {
      args: { hard: true },
      createActor: (_site: string, _name: string, persona: unknown) => {
        personas.push(persona);
        return "local#1";
      },
    };
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
      ...params: string[]
    ) => (host: unknown) => Promise<unknown>;
    await new AsyncFunction("__host", result.lowered!.code)(host);
    expect(personas).toEqual([{ model: "Model-A" }]);
  });
});
