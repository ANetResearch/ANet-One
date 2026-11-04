import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { chromium } from "playwright-core";
import { registerProviderPresentationCases } from "./provider-settings-presentation-cases.mjs";
import { registerProviderModelEditorCases } from "./provider-model-editor-cases.mjs";
import { registerProgressiveModelEditorCases } from "./provider-model-editor-progressive-cases.mjs";

const root = fileURLToPath(new URL("../../../../../../", import.meta.url));
const entry = "/packages/ui/test/browser/manual-review/pending/provider-settings-batch.fixture.tsx";
let server;
let browser;
let origin;

before(async () => {
  server = await createServer({
    root,
    configFile: false,
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "provider-settings-batch-fixture",
        configureServer(vite) {
          vite.middlewares.use(async (req, res, next) => {
            if (!req.url?.startsWith("/fixture?")) return next();
            res.setHeader("Content-Type", "text/html");
            res.end(
              await vite.transformIndexHtml(
                req.url,
                `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body><div id="root"></div><script type="module" src="${entry}"></script></body></html>`,
              ),
            );
          });
        },
      },
    ],
    resolve: { alias: { "@": `${root}packages/ui/src` } },
    optimizeDeps: { entries: [entry.slice(1)] },
    server: { host: "127.0.0.1", port: 0 },
  });
  await server.listen();
  origin = server.resolvedUrls.local[0];
  browser = await chromium.launch(
    process.env.CHROME_EXECUTABLE_PATH
      ? { executablePath: process.env.CHROME_EXECUTABLE_PATH }
      : {},
  );
});

after(async () => {
  await browser?.close();
  await server?.close();
});

const artifacts = join(tmpdir(), "anet-provider-settings-batch");
registerProviderPresentationCases(() => ({ browser, origin, artifacts }));
registerProviderModelEditorCases(() => ({ browser, origin, artifacts }));
registerProgressiveModelEditorCases(() => ({ browser, origin, artifacts }));
for (const [width, locale, theme] of [
  [390, "zh-CN", "light"],
  [1200, "en-US", "dark"],
]) {
  test(`provider rename keeps focus after pointer movement ${width}/${theme}`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 1100 } });
    const mutations = [];
    await page.route("**/mutation", async (route) => {
      mutations.push(route.request().postDataJSON());
      await route.fulfill({ status: 200, body: "{}" });
    });
    try {
      await page.goto(
        `${origin}fixture?${new URLSearchParams({ locale, theme, access: "manual" })}`,
      );
      const trigger = page.getByTestId("model-provider-actions-button");
      await trigger.click();
      const menu = page.getByRole("menu");
      // 暂停真实退场动画，保证鼠标移动命中尚未卸载的菜单，不靠固定延时碰竞态。
      await menu.evaluate((node) => {
        window.renamePointerMoves = 0;
        node.addEventListener("pointermove", () => {
          if (node.dataset.state === "closed") window.renamePointerMoves += 1;
        });
        node.addEventListener("animationstart", () => {
          if (node.dataset.state === "closed") {
            window.renameExitAnimations = node.getAnimations();
            window.renameExitAnimations.forEach((animation) => animation.pause());
          }
        });
      });
      await page.getByTestId("model-provider-name-edit-button").click();
      await page.waitForFunction(() =>
        window.renameExitAnimations?.some((animation) => animation.playState === "paused"),
      );
      const itemBox = await page.getByTestId("model-provider-name-edit-button").boundingBox();
      await page.mouse.move(itemBox.x + itemBox.width / 2 + 2, itemBox.y + itemBox.height / 2);
      assert.ok(await page.evaluate(() => window.renamePointerMoves > 0));
      await page.mouse.move(itemBox.x - 8, itemBox.y - 8);
      await page.evaluate(() =>
        window.renameExitAnimations.forEach((animation) => animation.finish()),
      );
      await menu.waitFor({ state: "detached" });
      await page.waitForFunction(
        () => document.activeElement?.dataset.testid === "model-provider-name-input",
        undefined,
        { timeout: 3000 },
      );
      // 直接向当前焦点输入，不能用 locator.fill/press 自动聚焦掩盖输入框闪退。
      await page.keyboard.press("ControlOrMeta+A");
      await page.keyboard.type("Renamed after pointer movement");
      await page.keyboard.press("Enter");
      await page
        .getByTestId("model-provider-header")
        .getByText("Renamed after pointer movement")
        .waitFor();
      assert.equal(mutations.length, 1);
      assert.equal(mutations[0].payload.providerNameUpdate, "Renamed after pointer movement");
      assert.equal(mutations[0].payload.enabledUpdate, undefined);

      await trigger.focus();
      await page.keyboard.press("ArrowDown");
      await page.waitForFunction(
        () => document.activeElement?.dataset.testid === "model-provider-name-edit-button",
      );
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () => document.activeElement?.dataset.testid === "model-provider-name-input",
      );
      await page.keyboard.type(" cancelled");
      await page.keyboard.press("Escape");
      assert.equal(await page.getByTestId("model-provider-name-input").count(), 0);
      assert.equal(mutations.length, 1);
      assert.equal(
        await page.getByTestId("model-provider-enabled-switch").getAttribute("aria-checked"),
        "true",
      );
    } finally {
      await page.close();
    }
  });

  test(`header name and option feedback ${width}/${theme}`, async () => {
    await mkdir(artifacts, { recursive: true });
    const page = await browser.newPage({ viewport: { width, height: 1100 } });
    const mutations = [],
      errors = [],
      visualEvidence = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    await page.route("**/mutation", async (route) => {
      mutations.push(route.request().postDataJSON());
      await route.fulfill({ status: 200, body: "{}" });
    });
    try {
      await page.goto(
        `${origin}fixture?${new URLSearchParams({ locale, theme, access: "manual", tiles: "1" })}`,
      );
      const menu = page.getByTestId("model-provider-actions-button");
      const toggle = page.getByTestId("model-provider-enabled-switch");
      await menu.waitFor();
      const toggleBox = await toggle.boundingBox(),
        menuBox = await menu.boundingBox();
      assert.ok(toggleBox.x + toggleBox.width <= menuBox.x);
      assert.equal(
        await toggle.getAttribute("data-state"),
        "checked",
        "tooltip must not replace switch state",
      );
      assert.notEqual(
        await toggle.evaluate((node) => getComputedStyle(node).backgroundColor),
        "rgba(0, 0, 0, 0)",
      );
      const expansion = await toggle.evaluate((node) =>
        Number.parseFloat(getComputedStyle(node, "::after").right),
      );
      assert.ok(
        toggleBox.x + toggleBox.width - expansion < menuBox.x,
        "switch expanded hit area must not reach menu",
      );
      assert.equal(
        await toggle.getAttribute("aria-label"),
        locale === "zh-CN" ? "禁用供应商" : "Disable provider",
      );
      const rename = async () => {
        await menu.click();
        await page.getByTestId("model-provider-name-edit-button").click();
        const input = page.getByTestId("model-provider-name-input");
        await page.waitForFunction(
          () => document.activeElement?.dataset.testid === "model-provider-name-input",
        );
        return input;
      };
      let input = await rename();
      await input.fill("Cancelled name");
      await page.waitForTimeout(1600);
      assert.equal(mutations.length, 0, "name idle must not save");
      await input.press("Escape");
      await page.waitForTimeout(1300);
      assert.equal(mutations.length, 0, "cancel must not save later");
      input = await rename();
      await input.fill("Confirmed Provider with a deliberately long name");
      await input.press("Enter");
      await page
        .getByTestId("model-provider-header")
        .getByText("Confirmed Provider with a deliberately long name", { exact: true })
        .waitFor();
      assert.equal(mutations.length, 1);
      assert.equal(
        mutations[0].payload.providerNameUpdate,
        "Confirmed Provider with a deliberately long name",
      );
      assert.equal(mutations[0].payload.enabledUpdate, undefined);
      assert.equal(await toggle.getAttribute("aria-checked"), "true");
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      );
      const style = (node) => {
        const css = getComputedStyle(node),
          icon = node.querySelector("svg");
        return {
          background: css.backgroundColor,
          color: css.color,
          border: css.borderColor,
          width: node.getBoundingClientRect().width,
          height: node.getBoundingClientRect().height,
          icon: icon ? getComputedStyle(icon).color : null,
        };
      };
      const checkIndicator = async (tile, selected) => {
        const box = tile.locator("[data-model-option-checkbox]");
        const actual = await box.evaluate(style);
        const reference = await page
          .getByTestId(selected ? "system-checkbox-on" : "system-checkbox-off")
          .evaluate(style);
        assert.equal(actual.border, reference.border, "indicator border matches system checkbox");
        assert.equal(
          actual.background,
          reference.background,
          "indicator fill matches system checkbox",
        );
        assert.equal(actual.width, 16);
        assert.equal(actual.height, 16);
        assert.equal(await box.getAttribute("aria-hidden"), "true");
        assert.equal(await box.locator("button, input, [tabindex]").count(), 0);
        if (selected) {
          assert.equal(actual.color, reference.color);
          assert.equal(
            actual.border,
            actual.background,
            "selected border must not follow tick color",
          );
          assert.notEqual(actual.icon, actual.background);
          assert.equal(
            await box.locator("svg").evaluate((node) => node.getBoundingClientRect().width),
            12,
          );
        } else {
          assert.equal(actual.icon, null);
        }
      };
      for (const tile of [
        page.locator('[data-model-input-modality="image"]'),
        page.getByRole("checkbox", { name: "Capability" }),
        page.getByRole("checkbox", { name: "System messages" }),
      ]) {
        await tile.hover();
        await page.waitForTimeout(180);
        const off = await tile.evaluate(style);
        await checkIndicator(tile, false);
        await tile.click();
        await page.waitForTimeout(180);
        const on = await tile.evaluate(style);
        await checkIndicator(tile, true);
        assert.notEqual(on.background, off.background, "same-pointer click must change background");
        // Todo134：选中时出现勾选图标是新预期，外层控件的文字/边框/尺寸仍不得跳变。
        for (const key of ["color", "border", "width", "height"])
          assert.equal(on[key], off[key], key);
        await page.screenshot({
          path: join(artifacts, `selected-${width}-${visualEvidence.length}.png`),
        });
        await tile.click();
        await page.waitForTimeout(180);
        assert.equal((await tile.evaluate(style)).background, off.background);
        await tile.press("Space");
        await checkIndicator(tile, true);
        await tile.press("Space");
        await checkIndicator(tile, false);
        visualEvidence.push({ off, on });
      }
      assert.equal(await page.locator('[data-model-input-modality="text"]').isDisabled(), true);
      await page.screenshot({ path: join(artifacts, `header-options-${width}.png`) });
      assert.deepEqual(errors, []);
      await writeFile(
        join(artifacts, `header-options-${width}.json`),
        JSON.stringify({ mutations, visualEvidence }, null, 2),
      );
    } finally {
      await page.close();
    }
  });
}
