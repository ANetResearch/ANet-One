import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";

export function registerProviderPresentationCases(getEnvironment) {
  for (const [width, locale, theme] of [
    [390, "zh-CN", "light"],
    [1200, "en-US", "dark"],
  ]) {
    test(`mimo templates ${width}/${locale}`, async () => {
      const { browser, origin, artifacts } = getEnvironment();
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const mutations = [],
        errors = [];
      page.on("pageerror", (error) => errors.push(String(error)));
      await page.route("**/mutation", async (route) => {
        mutations.push(route.request().postDataJSON());
        await route.fulfill({ status: 200, body: "{}" });
      });
      try {
        for (const [id, label, url] of [
          ["xiaomi-mimo", "Xiaomi MiMo API", "https://api.xiaomimimo.com/anthropic"],
          [
            "xiaomi-mimo-token-plan",
            "Xiaomi MiMo Token Plan",
            "https://token-plan-cn.xiaomimimo.com/anthropic",
          ],
        ]) {
          await page.goto(`${origin}fixture?${new URLSearchParams({ locale, theme })}`);
          const card = page.getByTestId(`model-provider-template-item-${id}`);
          await card.waitFor();
          assert.equal((await card.innerText()).trim(), label);
          await card.locator("img").evaluate((image) => image.decode());
          assert.match(await card.locator("img").getAttribute("src"), /mimo/i);
          await card.hover();
          await page
            .getByRole("tooltip")
            .filter({ hasText: new RegExp(`^${label}$`) })
            .waitFor();
          await page.keyboard.press("Escape");
          await mkdir(artifacts, { recursive: true });
          await page.screenshot({ path: join(artifacts, `mimo-templates-${width}.png`) });
          const count = mutations.length;
          await card.click();
          await page.locator(`input[value="${url}"]`).waitFor();
          assert.equal(mutations.length, count + 1);
          assert.deepEqual(mutations.at(-1), { action: "create", payload: id });
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            true,
          );
          await mkdir(artifacts, { recursive: true });
          await page.screenshot({ path: join(artifacts, `mimo-${id}-${width}.png`) });
        }
        assert.deepEqual(mutations, [
          { action: "create", payload: "xiaomi-mimo" },
          { action: "create", payload: "xiaomi-mimo-token-plan" },
        ]);
        assert.deepEqual(errors, []);
      } finally {
        await page.close();
      }
    });
    test(`openrouter template label ${width}/${locale}`, async () => {
      const { browser, origin, artifacts } = getEnvironment();
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      try {
        await page.goto(`${origin}fixture?${new URLSearchParams({ locale, theme })}`);
        const card = page.getByTestId("model-provider-template-item-openrouter");
        await card.waitFor();
        assert.equal((await card.innerText()).trim(), "OpenRouter");
        await card.hover();
        await page
          .getByRole("tooltip")
          .filter({ hasText: /^OpenRouter$/ })
          .waitFor();
        await mkdir(artifacts, { recursive: true });
        await page.screenshot({ path: join(artifacts, `openrouter-label-${width}.png`) });
      } finally {
        await page.close();
      }
    });
    test(`subagent selection error copy ${width}/${locale}`, async () => {
      const { browser, origin, artifacts } = getEnvironment();
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        permissions: ["clipboard-read", "clipboard-write"],
      });
      const page = await context.newPage();
      try {
        await page.goto(
          `${origin}fixture?${new URLSearchParams({ locale, theme, access: "account", selectionError: "1" })}`,
        );
        await page
          .getByTestId("subagent-error")
          .getByText(locale === "zh-CN" ? "执行失败" : "Failed", { exact: true })
          .hover();
        const detail = page
          .locator('[data-slot="tooltip-content"]')
          .filter({ hasText: "reasoning-level-missing" });
        await detail.waitFor();
        assert.match(await detail.innerText(), /未选择思考档位/);
        // Radix 还生成一份 aria 隐藏描述，点击实际展示的复制按钮。
        await detail.locator('button:not([role="tooltip"] button)').click();
        const copied = await page.evaluate(() => navigator.clipboard.readText());
        assert.match(copied, /reason=reasoning-level-missing/);
        assert.match(copied, /selection=account:team-coding-plan\/model-1/);
        assert.match(copied, /No reasoning level selected/);
        await mkdir(artifacts, { recursive: true });
        await page.screenshot({ path: join(artifacts, `subagent-error-${width}.png`) });
      } finally {
        await context.close();
      }
    });
  }
}
