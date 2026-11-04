import { describe, expect, it } from "vitest";
import { analyzeWorkflowScript, collectSites, createWorkflowProgram, interpret } from "../src/index.js";
import { corpusDiagnostics } from "./helpers/analysis-corpus.js";

/**
 * Fixpoint convergence pins (docs/analysis.md, "Convergence": the canonical-heap rule).
 *
 * The taint fixpoint is gen-only over a finite lattice, so the only way it fails to settle
 * is a transfer that reports a change every pass without the state growing: a persistent
 * merge INTO a value that is recreated each pass. Each case here is a shape that once did
 * exactly that. The assertion is the analysis completing at all — `analyzeWorkflowScript`
 * throws at ITERATION_CAP — plus, where the fix changed what the graph can see, the fact it
 * now sees.
 */

/**
 * 分析开销的界用**本进程 CPU 时间**量,不用墙钟。
 *
 * 这些界要区分的是"修好了(约 1 秒)"和"没修好(十几秒到几小时)",量的是分析做了多少活。
 * 墙钟量不出这件事:满载跑整个仓库的测试时同一份活会被拖长十几倍 —— 实测在 64 核机器上
 * 并行跑完 apps/anet-cli 全套时,这里曾测到 15748 ms 与 18821 ms,把界撞穿,而分析本身没变慢。
 * 分析是同步单线程的,process.cpuUsage() 的增量正好是它自己烧掉的 CPU,与机器有多忙无关。
 */
function cpuMillisOf<T>(work: () => T): { ms: number; value: T } {
  const before = process.cpuUsage();
  const value = work();
  const after = process.cpuUsage();
  return { ms: (after.user - before.user + after.system - before.system) / 1000, value };
}

function analyze(script: string) {
  const result = analyzeWorkflowScript(script);
  expect(corpusDiagnostics(result.diagnostics)).toEqual([]);
  const causality = result.causality;
  if (causality === undefined) throw new Error("expected a causality graph");
  return { causality, result };
}

const hasEdge = (edges: ReadonlyArray<{ from: string; to: string }>, from: string, to: string): boolean =>
  edges.some((edge) => edge.from === from && edge.to === to);

describe("convergence — container literals are allocation-site places", () => {
  it("converges when a callee writes a NEW field through a parameter bound to an inline object literal", () => {
    // The minimal shape: nothing here is exotic. Before literals had a persistent place this
    // failed on every analyzer generation since 2026-08-17.
    analyze(`
function tag(box: { name: string; note?: string }, t: string): void { box.note = t; }
const t = await agent("s").ask<string>("q");
tag({ name: "x" }, t);
return t;
`);
  });

  it("converges for an inline array literal mutated by the callee", () => {
    analyze(`
function fill(xs: string[], t: string): void { xs.push(t); }
const t = await agent("s").ask<string>("q");
fill([], t);
return t;
`);
  });

  it("converges when the write-back carries no taint at all", () => {
    // The re-reported change was the write-back's own doing, not the data it carried.
    analyze(`
function tag(box: { name: string; note?: string }, t: string): void { box.note = t; }
tag({ name: "x" }, "plain");
return await agent("s").ask<string>("q");
`);
  });

  it("converges for a nested literal argument written through two levels", () => {
    analyze(`
function deep(p: { inner: { items: string[] } }, t: string): void { p.inner.items.push(t); }
const t = await agent("s").ask<string>("q");
deep({ inner: { items: [] } }, t);
return t;
`);
  });

  it("makes the field written on the literal visible through the reference the callee returns", () => {
    // Persistence is not only about termination: the note now survives to the reader.
    const { causality } = analyze(`
function tag(box: { name: string; note?: string }, t: string): { name: string; note?: string } {
  box.note = t;
  return box;
}
const t = await agent("writer").ask<string>("draft");
const r = tag({ name: "x" }, t);
return agent("reader").ask<string>(\`use \${r.note}\`);
`);
    expect(hasEdge(causality.edges, "ask#1", "ask#2")).toBe(true);
  });

  it("keeps a literal's field that stores a live place aliased to that place", () => {
    // `{ box }` stores box's slot itself; the persistent literal place must not turn that alias
    // into a copy on later passes (heap-aliasing-param-literal-wrap pins the golden).
    const { causality } = analyze(`
const box: { f: string } = { f: "" };
async function poke(p: { box: { f: string } }): Promise<void> {
  p.box.f = await agent("writer").ask<string>("secret");
}
await poke({ box });
return agent("reader").ask<string>(\`use \${box.f}\`);
`);
    expect(hasEdge(causality.edges, "ask#1", "ask#2")).toBe(true);
  });

  it("re-evaluates the literal every pass (a site inside it is never short-circuited)", () => {
    // The place is reached only through evaluation, never through resolvePlace, so the ask
    // nested in the literal keeps its node and its edge.
    const { causality } = analyze(`
const seed = await agent("seed").ask<string>("s");
const bundle = { text: await agent("writer").ask<string>(seed), tag: "x" };
return agent("reader").ask<string>(bundle.text);
`);
    expect(hasEdge(causality.edges, "ask#1", "ask#2")).toBe(true);
    expect(hasEdge(causality.edges, "ask#2", "ask#3")).toBe(true);
  });
});

describe("convergence — the keystone-leak family (recorded real scripts, 2026-09-03)", () => {
  // Seven recorded workflows stopped converging when a library member call started dispatching
  // on tracked functions carried by its receiver: the keystone pot had leaked the callback
  // itself into the result of `sort(cmp)` / `JSON.parse(text, reviver)`, so a later
  // `top.push({ … })` applied the callback with the literal as its actual and hit the
  // write-back above. Two independent tightenings close the path (the pot strips callables,
  // library members never dispatch on receiver fns); the literal place removes the cliff.
  it("sort comparator, then push of a literal into the sorted result", () => {
    analyze(`
interface C { name: string; confidence: number }
const candidates = await agent("s").ask<C[]>("q");
const top = candidates.sort((a, b) => b.confidence - a.confidence);
top.push({ name: "x", confidence: 0.5 });
return top;
`);
  });

  it("JSON.parse reviver (no registry entry), then push of a literal", () => {
    analyze(`
interface C { name: string; confidence: number }
const text = await agent("s").ask<string>("q");
const top = JSON.parse(text, (k, v) => v) as C[];
top.push({ name: "x", confidence: 0.5 });
return top;
`);
  });

  it("String.replace callback, then a literal pushed into a sibling field", () => {
    analyze(`
interface C { name: string; confidence: number }
const text = await agent("s").ask<string>("q");
const holder = { items: [] as C[], text: text.replace(/x/g, (m) => m.toUpperCase()) };
holder.items.push({ name: holder.text, confidence: 0.5 });
return holder;
`);
  });
});

describe("convergence — placeholder resolution is linear in the placeholder graph", () => {
  // 一个被很多处共用的 callback 包装器（`limited(slots, async () => …)` 这类限流 helper）的
  // 摘要是所有 callback 返回值的并集，各调用方的参数占位符原样穿过它，于是每个调用方的实参
  // 都含有每个调用方的占位符——占位符图是完全图。发射期曾按「栈上去重、不记忆」逐条枚举
  // 简单路径，完全图上是 n! 量级（9 个调用方 19 秒，用户脚本 4GB 堆 OOM）。界限故意放得很松：
  // 未修复的实现在 12 个调用方上要跑几个小时，不会因为机器慢而误报。
  function sharedLimiter(callers: number): string {
    let script = `interface Slots { free: number }
const slots: Slots = { free: 4 };
async function limited<T>(slots: Slots, fn: () => Promise<T>): Promise<T> {
  while (slots.free <= 0) await Promise.resolve();
  slots.free -= 1;
  try { return await fn(); } finally { slots.free += 1; }
}
const results: string[] = [];
`;
    for (let i = 0; i < callers; i += 1) {
      script += `async function step${i}(x: string): Promise<string> {
  return limited(slots, async () => (await agent("a${i}").ask<string>(\`do ${i} \${x}\`)) + x);
}
results.push(await step${i}(results.join(",")));
`;
    }
    script += `async function nested(x: string): Promise<string> {
  return limited(slots, async () => {
    let acc = x;
    acc = await limited(slots, async () => agent("n0").ask<string>(\`inner \${acc}\`));
    acc = await limited(slots, async () => agent("n1").ask<string>(\`inner \${acc}\`));
    return acc;
  });
}
results.push(await nested(results.join(",")));
return results;
`;
    return script;
  }

  it("resolves a dozen callers of one shared callback helper without enumerating paths", () => {
    const callers = 12;
    const { ms, value } = cpuMillisOf(() => analyze(sharedLimiter(callers)));
    const { result } = value;
    // 实测 0.7 倍;回归(按路径枚举)在十几个调用者上就爆。
    expectWithinReference(ms, 4, "一打调用者共用一个回调 helper");
    // 提速不改答案：第一个调用方的回答经共用 helper 与 results 流到最后一个调用方的提示，
    // 也流到嵌套闭包里内层调用的提示。
    const dataEdges = (result.graph?.edges ?? []).filter((edge) => edge.kind === "data");
    expect(hasEdge(dataEdges, "ask#1", `ask#${callers}`)).toBe(true);
    expect(hasEdge(dataEdges, "ask#1", `ask#${callers + 1}`)).toBe(true);
  });
});

/**
 * 开销的界用**参考负载的倍数**表示,不用绝对毫秒。
 *
 * 绝对界量的是机器,不是算法。本文件里最贵的两个形状在空闲的 64 核机器上实测 8.6 s 与
 * 9.2 s CPU 时间,原先的界是 10 s —— 余量 1.1 倍,在更慢的机器上(托管 CI runner 的单核
 * 比它慢数倍)必然撞穿,而算法什么都没变。
 *
 * 参考负载 `referenceScript` 是一条直链 helper + 顺序 ask,不含这组用例盯住的任何病态
 * 形状,所以它的开销只反映这台机器跑这个分析器有多快。取三次的中位数,摊掉 JIT 预热与
 * 调度抖动。每个形状的界写成「参考负载的 N 倍」,N 取在实测值与回归值之间,注释里给出
 * 两个数,后来者改动前可以核对。
 */
function referenceScript(n: number): string {
  let script = `const out: string[] = [];
async function step(x: string): Promise<string> { return agent("s").ask<string>(\`do \${x}\`); }
`;
  for (let i = 0; i < n; i += 1) script += `out.push(await step("x${i}"));\n`;
  return script + "return out;\n";
}

let referenceCpuMsCache: number | undefined;
function referenceCpuMs(): number {
  if (referenceCpuMsCache !== undefined) return referenceCpuMsCache;
  const script = referenceScript(200);
  // 第一遍只为预热:冷 JIT 那一遍能比稳态贵 50%,留着会把所有倍数一起拉低。
  cpuMillisOf(() => analyzeWorkflowScript(script));
  const runs = [0, 1, 2, 3, 4].map(() => cpuMillisOf(() => analyzeWorkflowScript(script)).ms).sort((a, b) => a - b);
  referenceCpuMsCache = Math.max(runs[2], 1);
  return referenceCpuMsCache;
}

/** 断言这次测得的 CPU 时间不超过参考负载的 `multiple` 倍。失败信息里带上两个绝对值。 */
function expectWithinReference(ms: number, multiple: number, what: string): void {
  const reference = referenceCpuMs();
  const ratio = ms / reference;
  if (process.env.COST_RATIO) console.log(`[cost] ${what}: ${ms.toFixed(0)}ms = ${ratio.toFixed(1)}× 参考(${reference.toFixed(0)}ms)`);
  expect(
    ratio,
    `${what}: ${ms.toFixed(0)}ms 是参考负载 ${reference.toFixed(0)}ms 的 ${ratio.toFixed(1)} 倍,界是 ${multiple} 倍`,
  ).toBeLessThan(multiple);
}

describe("analysis cost — shapes that once grew exponentially or as a high power", { timeout: 120_000 }, () => {
  // vitest 的超时按墙钟放宽到 120 秒:满载跑全套时单个用例的墙钟会被拖慢十几倍,
  // 超时只防真正卡死,判别交给上面的参考负载倍数。
  const dataEdges = (result: ReturnType<typeof analyzeWorkflowScript>) =>
    (result.graph?.edges ?? []).filter((edge) => edge.kind === "data");

  function timed(script: string, multiple = 4, what = "方法链/构建器") {
    const { ms, value } = cpuMillisOf(() => analyze(script));
    expectWithinReference(ms, multiple, what);
    return value.result;
  }

  // 方法链：每一环曾把接收者求值两到三遍，k 环就是 2^k / 3^k（`.trim()` × 20 用了 13 秒）。
  it("evaluates each receiver of a long method chain once", () => {
    const trim = timed(`const draft = await agent("w").ask<string>("write");
const clean = draft${".trim()".repeat(30)};
return await agent("r").ask<string>(\`review \${clean}\`);
`);
    expect(hasEdge(dataEdges(trim), "ask#1", "ask#2")).toBe(true);

    const then = timed(`const p = agent("w").ask<string>("write")${'.then((x) => x + "!")'.repeat(20)};
return await agent("r").ask<string>(\`review \${await p}\`);
`);
    expect(hasEdge(dataEdges(then), "ask#1", "ask#2")).toBe(true);

    const sets = Array.from({ length: 24 }, (_, i) => `.set("k${i}", draft)`).join("");
    const mapSet = timed(`const draft = await agent("w").ask<string>("write");
const m = new Map<string, string>();
m${sets};
return await agent("r").ask<string>(\`review \${m.get("k0")}\`);
`);
    expect(hasEdge(dataEdges(mapSet), "ask#1", "ask#2")).toBe(true);

    // 名为 add 的方法同时走堆变更与普通调用两条路，曾是 3^k。
    const builder = timed(`class Pipe {
  items: string[] = [];
  add(x: string): Pipe { this.items.push(x); return this; }
}
const draft = await agent("w").ask<string>("write");
const pipe = new Pipe()${".add(draft)".repeat(20)};
return await agent("r").ask<string>(\`review \${pipe.items.join(",")}\`);
`);
    expect(hasEdge(dataEdges(builder), "ask#1", "ask#2")).toBe(true);
  });

  // 一个攒着 n 个标签的值被读 n 次：每加一个标签曾扫一遍整个标签集，约 n^3（n=600 用了 5.7 秒，n=800 约 13 秒）。
  it("reads a value that carries hundreds of labels hundreds of times", () => {
    const n = 800;
    let script = `const ps = [${Array.from({ length: n }, (_, i) => `agent("a${i}").ask<string>("q${i}")`).join(", ")}];\n`;
    for (let j = 0; j < n; j += 1) script += `const v${j}: string = "s" + ps.length;\n`;
    script += "return await Promise.all(ps);\n";
    // 实测 5.9 倍;回归约 n^3,n=800 要 13 秒,约 19 倍。
    const result = timed(script, 12, "n 个标签被读 n 次");
    expect(hasEdge(dataEdges(result), "ask#1", "sink")).toBe(true);
    expect(hasEdge(dataEdges(result), `ask#${n}`, "sink")).toBe(true);
  });

  // 被许多阶段共用的 helper：每个 step 按认领它的阶段拷成 k 份，边按拷贝对逐对判时间可行性。
  // 每对都调一次 sharesIteration，它曾每次重新过滤站点出现过的全部 region（共用 helper 有
  // 上千个），代价是拷贝对数 × region 数（25/25/250 用了 33 秒）。
  it("projects phase copies of a helper shared by hundreds of phases", () => {
    const fanouts = 25;
    const helpers = 25;
    const calls = 250;
    let script = `const items: string[] = ["a", "b", "c"];
async function helper0(x: string): Promise<string> { return agent(\`h0-\${x}\`).ask<string>(\`do \${x}\`); }
`;
    for (let i = 1; i < helpers; i += 1) {
      script += `async function helper${i}(x: string): Promise<string> {
  const r = await helper${i - 1}(x);
  return agent(\`h${i}-\${x}\`).ask<string>(\`step ${i} \${r}\`);
}
`;
    }
    script += "const out: string[] = [];\n";
    for (let f = 0; f < fanouts; f += 1) {
      script += `phase("f${f}");\nout.push(...(await Promise.all(items.map(async (x) => helper${helpers - 1}(x + "${f}")))));\n`;
    }
    for (let m = 0; m < calls; m += 1) script += `phase("m${m}");\nout.push(await helper${m % helpers}("m${m}"));\n`;
    script += "return out;\n";
    // 实测 13.1 倍;回归(拷贝对数 × region 数)是 33 秒,约 47 倍。
    const result = timed(script, 28, "阶段拷贝 × 共用 helper");
    expect(result.causality?.phases?.length).toBe(fanouts + calls);
    // helper0 的 ask 在每个阶段都被发出，所以它有一份拷贝对应每个阶段。
    const copies = (result.causality?.steps ?? []).filter((step) => step.source === "ask#1");
    expect(copies).toHaveLength(fanouts + calls);
  });

  // 一串互相 await 的 async helper 被很多处调用：每个 await 曾扫一遍目前开过的所有 strand，
  // 走查时间是 trace 长度的平方（80/80/800 时走查 16 秒）。只计时不动点加走查（interpret）：
  // 这个形状的控制流投影另有平方级的边数（顺序 await 的每一步连到之后每一步），那是投影规则的事。
  //
  // 这一条用**增长阶**判,不用参考负载的倍数:它修好之后本身就要 9 秒上下,而回归时是
  // 16 秒,两者只差 1.7 倍 —— 比单次测量的抖动还小,任何绝对界或单点倍数都分不开它们。
  // 改成在两个规模上各测一次:走查若是 trace 长度的线性,规模翻倍约 2 倍;若是平方,
  // 约 4 倍。界取 3 倍。两次测量在同一进程里前后脚跑,共享 JIT 与机器状态,机器快慢
  // 在相除时抵消掉。
  it("walks a long chain of awaiting helpers called from many places", () => {
    const helpers = 80;
    const walkScript = (fanouts: number, calls: number): string => {
      let script = `const items: string[] = ["a", "b", "c"];
async function helper0(x: string): Promise<string> { return agent(\`h0-\${x}\`).ask<string>(\`do \${x}\`); }
`;
      for (let i = 1; i < helpers; i += 1) {
        script += `async function helper${i}(x: string): Promise<string> {
  const r = await helper${i - 1}(x);
  return agent(\`h${i}-\${x}\`).ask<string>(\`step ${i} \${r}\`);
}
`;
      }
      script += "const out: string[] = [];\n";
      for (let f = 0; f < fanouts; f += 1) {
        script += `out.push(...(await Promise.all(items.map(async (x) => helper${helpers - 1}(x + "${f}")))));\n`;
      }
      for (let m = 0; m < calls; m += 1) script += `out.push(await helper${m % helpers}("m${m}"));\n`;
      return script + "return out;\n";
    };
    const walkCost = (fanouts: number, calls: number) => {
      const workflow = createWorkflowProgram(walkScript(fanouts, calls));
      return cpuMillisOf(() => interpret(workflow, collectSites(workflow)));
    };

    const small = walkCost(40, 400);
    const large = walkCost(80, 800);
    const growth = large.ms / Math.max(small.ms, 1);
    if (process.env.COST_RATIO) console.log(`[cost] helper 链增长阶: ${small.ms.toFixed(0)}ms → ${large.ms.toFixed(0)}ms = ${growth.toFixed(2)}×`);
    expect(
      growth,
      `走查开销随规模翻倍增长了 ${growth.toFixed(2)} 倍(${small.ms.toFixed(0)}ms → ${large.ms.toFixed(0)}ms);线性约 2 倍,平方约 4 倍`,
    ).toBeLessThan(3);
    expect(large.value.trace.events.length).toBeGreaterThan(800);
  });

  // 一个 helper 被 k 处调用、各传一个回调：`fn()` 曾把每个调用者的回调都内联一遍（k² 份函数体，
  // 40 处 4.4 秒、80 处跑不完）。现在按调用点的绑定只内联自己的那一个：call 区域正好 2k 个。
  it("inlines one callback per call of a helper shared by hundreds of callers", () => {
    const callers = 200;
    let script = "async function limited(fn: () => Promise<string>): Promise<string> { return await fn(); }\nconst out: string[] = [];\n";
    for (let i = 0; i < callers; i += 1) {
      script += `out.push(await limited(async () => agent("c${i}").ask<string>("do ${i}")));\n`;
    }
    script += "return out;\n";
    const workflow = createWorkflowProgram(script);
    const { ms, value: core } = cpuMillisOf(() => interpret(workflow, collectSites(workflow)));
    // 实测 0.6 倍;回归(每个调用者内联 k 份函数体)在 80 处就跑不完。
    expectWithinReference(ms, 4, "共用 helper 的每调用点一份回调");
    expect(core.trace.regions.filter((region) => region.kind === "call")).toHaveLength(2 * callers);
    expect(core.trace.regions.filter((region) => region.kind === "choice")).toEqual([]);
  });

  // L 层包装（每层把自己的参数包成新箭头交给下一层）、n 个调用者：曾是 n^(L+1) 份函数体
  // （8 × 3 层 50 秒、2.2 GB）。现在每个调用者的链是 2L 个 call 区域。
  it("inlines one chain per caller through nested wrapper layers", () => {
    const callers = 8;
    const layers = 3;
    let script = "async function w1(fn: () => Promise<string>): Promise<string> { return await fn(); }\n";
    for (let l = 2; l <= layers; l += 1) {
      script += `async function w${l}(fn: () => Promise<string>): Promise<string> { return await w${l - 1}(() => fn()); }\n`;
    }
    script += "const out: string[] = [];\n";
    for (let i = 0; i < callers; i += 1) {
      script += `out.push(await w${layers}(async () => agent("c${i}").ask<string>("do ${i}")));\n`;
    }
    script += "return out;\n";
    const workflow = createWorkflowProgram(script);
    const { ms, value: core } = cpuMillisOf(() => interpret(workflow, collectSites(workflow)));
    // 实测 0.1 倍;回归是 n^(L+1) 份函数体,8 × 3 层要 50 秒、2.2 GB。
    expectWithinReference(ms, 4, "嵌套包装层的每调用者一条链");
    expect(core.trace.regions.filter((region) => region.kind === "call")).toHaveLength(2 * layers * callers);
  });
});
