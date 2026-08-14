import { chromium } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXT_DIR = path.resolve(__dirname, "..", "extension");
const userData = mkdtempSync(path.join(tmpdir(), "ai-rec-ext-"));

const ctx = await chromium.launchPersistentContext(userData, {
  channel: "chrome",
  headless: true,
  args: [
    `--disable-extensions-except=${EXT_DIR}`,
    `--load-extension=${EXT_DIR}`,
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
  ],
});
const page = ctx.pages()[0] || await ctx.newPage();
// 读取扩展管理页（开发者模式需 flag，但页面仍会显示已加载扩展与错误）
await page.goto("chrome://extensions", { waitUntil: "domcontentloaded" }).catch((e) => console.log("ext page err:", e.message));
await page.waitForTimeout(2500);
const text = await page.evaluate(() => document.body.innerText).catch(() => "");
console.log(text.slice(0, 1200));
await ctx.close();
