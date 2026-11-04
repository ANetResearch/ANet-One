import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  MINIMUM_NODE_MAJOR,
  assertSupportedNodeVersion,
  unsupportedNodeVersionMessage,
} from "../src/node-version-gate.js";

test("低于最低主版本的 Node 返回说明", () => {
  for (const version of ["v22.12.0", "v20.11.1", "v23.9.0", "18.0.0"]) {
    const message = unsupportedNodeVersionMessage(version);
    assert.ok(message, `${version} 应被判为不支持`);
    assert.match(message, new RegExp(String(MINIMUM_NODE_MAJOR)));
    assert.match(message, /node:sqlite/);
    assert.ok(message.includes(version), "说明里要带上当前版本号");
  }
});

test("达到或高于最低主版本的 Node 不返回说明", () => {
  for (const version of ["v24.0.0", "v24.14.0", "v25.1.0", "v30.0.0"]) {
    assert.equal(unsupportedNodeVersionMessage(version), undefined, `${version} 应被判为支持`);
  }
});

test("版本号读不出时放行", () => {
  for (const version of ["", "unknown", "v"]) {
    assert.equal(unsupportedNodeVersionMessage(version), undefined);
  }
});

test("不支持时写 stderr 并以 1 退出", () => {
  const written: string[] = [];
  const exits: number[] = [];
  assertSupportedNodeVersion({
    exit: ((code: number) => {
      exits.push(code);
    }) as unknown as (code: number) => never,
    stderr: { write: (chunk: string) => written.push(chunk) },
    version: "v22.12.0",
  });
  assert.deepEqual(exits, [1]);
  assert.equal(written.length, 1);
  assert.match(written[0] ?? "", /Node\.js 24/);
});

test("支持时不写 stderr 也不退出", () => {
  const written: string[] = [];
  const exits: number[] = [];
  assertSupportedNodeVersion({
    exit: ((code: number) => {
      exits.push(code);
    }) as unknown as (code: number) => never,
    stderr: { write: (chunk: string) => written.push(chunk) },
    version: "v24.14.0",
  });
  assert.deepEqual(exits, []);
  assert.deepEqual(written, []);
});

// 这道检查必须先于 @anet/shared/sqlite-migrations 执行,否则 node:sqlite 已经 require
// 失败了,说明永远打不出来。esbuild 的 CJS 产物按 import 顺序初始化模块,所以顺序本身
// 就是实现的一部分 —— 仅测函数无法发现有人把它挪到后面。
test("入口的第一个 import 是这道检查", () => {
  const main = readFileSync(fileURLToPath(new URL("../src/main.ts", import.meta.url)), "utf8");
  const firstImport = main
    .split("\n")
    .find((line) => line.startsWith("import "));
  assert.equal(firstImport, 'import "./node-version-gate.js";');
});
