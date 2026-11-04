import { describe, expect, it } from "vitest";
import { disposeInSequence } from "../src/dispose-sequence.js";

describe("disposeInSequence", () => {
  it("一步抛错时后面的步骤仍然执行", () => {
    const ran: string[] = [];
    expect(() =>
      disposeInSequence([
        () => ran.push("a"),
        () => {
          throw new Error("b 失败");
        },
        () => ran.push("c"),
        () => ran.push("d"),
      ]),
    ).toThrow("b 失败");
    // 这是本函数存在的全部理由:原先的裸语句序列会在 b 处中断,c 与 d 持有的句柄
    // (其中包括会撑住事件循环的文件监视器)永远不被释放。
    expect(ran).toEqual(["a", "c", "d"]);
  });

  it("按顺序执行,全部成功时不抛", () => {
    const ran: number[] = [];
    disposeInSequence([() => ran.push(1), () => ran.push(2), () => ran.push(3)]);
    expect(ran).toEqual([1, 2, 3]);
  });

  it("抛出第一个错误,其余挂在它的 cause 上", () => {
    const first = new Error("第一个");
    const second = new Error("第二个");
    const third = new Error("第三个");
    let caught: unknown;
    try {
      disposeInSequence([
        () => {
          throw first;
        },
        () => {
          throw second;
        },
        () => {
          throw third;
        },
      ]);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBe(first);
    expect((caught as Error).cause).toEqual([second, third]);
  });

  it("只有一个后续错误时 cause 就是那个错误本身,不包成数组", () => {
    const first = new Error("第一个");
    const second = new Error("第二个");
    let caught: unknown;
    try {
      disposeInSequence([
        () => {
          throw first;
        },
        () => {
          throw second;
        },
      ]);
    } catch (error) {
      caught = error;
    }
    expect((caught as Error).cause).toBe(second);
  });

  it("第一个错误已经带 cause 时不覆盖它", () => {
    const inner = new Error("内层");
    const first = new Error("第一个", { cause: inner });
    let caught: unknown;
    try {
      disposeInSequence([
        () => {
          throw first;
        },
        () => {
          throw new Error("第二个");
        },
      ]);
    } catch (error) {
      caught = error;
    }
    expect((caught as Error).cause).toBe(inner);
  });

  it("空列表不抛", () => {
    expect(() => disposeInSequence([])).not.toThrow();
  });
});
