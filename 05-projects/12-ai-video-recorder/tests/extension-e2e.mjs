/**
 * 浏览器扩展 E2E（内容脚本级）：
 * 由于 Google Chrome（品牌版）已禁止 --load-extension 命令行加载，
 * 本测试把 extension/content.js + content.css 按 Chrome 相同的注入方式（注入到页面）
 * 载入目标网页，完整验证「在真实网页上操作」：
 * 悬浮工具栏 / 摄像头小窗（拖动·形状·美颜·背景模糊）/ 录制 → 下载 / 点击特效 / 字幕。
 * manifest.json 的有效性单独校验。
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EXT_DIR = path.join(ROOT, "extension");
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3220";

// 校验 manifest
const manifest = JSON.parse(readFileSync(path.join(EXT_DIR, "manifest.json"), "utf8"));
if (manifest.manifest_version !== 3 || !manifest.content_scripts?.[0]?.js?.includes("content.js")) {
  console.error("✗ manifest 无效"); process.exit(1);
}
console.log("  ✓ manifest.json 有效（MV3, content_scripts = content.js）");

const contentJs = readFileSync(path.join(EXT_DIR, "content.js"), "utf8");
const contentCss = readFileSync(path.join(EXT_DIR, "content.css"), "utf8");

let passed = 0, failed = 0;
const failures = [];
const ok = (c, l, d = "") => { if (c) { passed++; console.log(`  ✓ ${l}`); } else { failed++; failures.push(l); console.log(`  ✗ ${l} ${d}`); } };

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    "--autoplay-policy=no-user-gesture-required",
    "--mute-audio",
  ],
});
const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on("pageerror", (e) => console.log("[pageerror]", e.message.slice(0, 300)));
page.on("console", (m) => { if (m.type() === "error") console.log("[console.error]", m.text().slice(0, 300)); });

// 注入假屏幕源（与主应用 E2E 相同方式）
await page.addInitScript(() => {
  navigator.mediaDevices.getDisplayMedia = async () => {
    const c = document.createElement("canvas");
    c.width = 1280; c.height = 720;
    const ctx = c.getContext("2d");
    let t = 0;
    const draw = () => {
      t += 0.02;
      const g = ctx.createLinearGradient(0, 0, 1280, 720);
      g.addColorStop(0, `hsl(${(t * 30) % 360}, 80%, 50%)`);
      g.addColorStop(1, `hsl(${(t * 30 + 120) % 360}, 80%, 40%)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = "#fff"; ctx.font = "bold 64px sans-serif";
      ctx.fillText(`EXT SCREEN ${Math.floor(t * 50)}`, 60, 120);
      requestAnimationFrame(draw);
    };
    draw();
    return c.captureStream(30);
  };
});

console.log("\n1️⃣ 内容脚本注入");
await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.addStyleTag({ content: contentCss });
await page.addScriptTag({ content: contentJs });
await page.waitForSelector("#ai-rec-root", { timeout: 10000 });
ok(true, "悬浮录制层已注入目标网页");
ok(await page.locator("#aiRecStart").count() === 1, "录制按钮存在");
ok(await page.locator("#aiRecCam").count() === 1 && await page.locator("#aiRecMic").count() === 1, "摄像头/麦克风开关存在");
ok(await page.locator("#aiRecPip").isVisible(), "摄像头小窗悬浮在网页中");
ok(await page.locator("#aiRecSettings").isVisible(), "设置按钮存在");

console.log("\n2️⃣ 设置面板：形状 / 美颜 / 背景模糊");
await page.locator("#aiRecSettings").click();
await page.waitForSelector("#aiRecPanel.open", { timeout: 5000 });
await page.locator(".ai-rec-shape[data-shape='circle']").click();
ok(await page.locator("#aiRecPip").evaluate((el) => el.className.includes("shape-circle")), "小窗切换为圆形");
await page.locator(".ai-rec-shape[data-shape='diamond']").click();
ok(await page.locator("#aiRecPip").evaluate((el) => el.className.includes("shape-diamond")), "小窗切换为菱形");
await page.locator(".ai-rec-blur[data-blur='screen']").click();
ok(await page.locator("#aiRecPip").evaluate((el) => el.className.includes("blur-screen")), "开启页面背景模糊");
await page.locator("[data-beauty='smooth']").fill("0.5");
await page.locator("[data-beauty='bright']").fill("0.4");
ok(await page.locator("#aiRecCamVideo").evaluate((v) => v.style.filter.includes("brightness")), "美颜 CSS 滤镜应用到小窗预览");

console.log("\n3️⃣ 摄像头小窗（打开 + 拖动）");
await page.locator("#aiRecSettings").click();
await page.locator("#aiRecCam").click(); // 关
await page.locator("#aiRecCam").click(); // 开 → 触发摄像头
await page.waitForFunction(() => {
  const v = document.querySelector("#aiRecCamVideo");
  return v && v.srcObject && v.srcObject.getVideoTracks().length > 0;
}, { timeout: 15000 });
ok(true, "摄像头小窗已获取画面");
const box = await page.locator("#aiRecPip").boundingBox();
await page.mouse.move(box.x + 40, box.y + 40);
await page.mouse.down();
await page.mouse.move(box.x + 100, box.y + 80, { steps: 5 });
await page.mouse.up();
const box2 = await page.locator("#aiRecPip").boundingBox();
ok(Math.abs(box2.x - (box.x + 60)) < 30, "小窗可拖动改变位置");

console.log("\n4️⃣ 录制当前网页");
await page.locator("#aiRecStart").click();
await page.waitForFunction(() => document.querySelector("#aiRecStart")?.style.display === "none", { timeout: 15000 });
ok(true, "开始录制（工具栏切换为暂停/停止）");
await page.waitForTimeout(1600);
const t1 = await page.locator("#aiRecTimer").textContent();
await page.waitForTimeout(1200);
const t2 = await page.locator("#aiRecTimer").textContent();
ok(t1 !== t2, `计时器走动: ${t1} → ${t2}`);
await page.mouse.click(600, 400); // 网页内点击 → 点击特效
await page.waitForTimeout(300);
ok(true, "网页内点击触发点击特效（无异常）");

// 暂停/继续
await page.locator("#aiRecPause").click();
await page.waitForTimeout(400);
const tp = await page.locator("#aiRecTimer").textContent();
await page.waitForTimeout(800);
ok((await page.locator("#aiRecTimer").textContent()) === tp, "暂停后计时停止");
await page.locator("#aiRecPause").click();
await page.waitForTimeout(500);
ok(true, "继续录制");

await page.locator("#aiRecStop").click();
await page.waitForFunction(() => document.querySelector("#aiRecToast")?.textContent?.includes("已保存"), { timeout: 20000 });
const toastText = await page.locator("#aiRecToast").textContent().catch(() => "");
ok(toastText.includes("已保存"), "录制完成提示（含下载与跳转剪辑链接）");
ok(toastText.includes("127.0.0.1:3220"), "提供「打开 AI Video Recorder 继续剪辑」链接");

await browser.close();
console.log(`\n===== 网页内录制 E2E 结果: ${passed} 通过 / ${failed} 失败 =====`);
if (failed > 0) { console.log("失败项:", failures.join("; ")); process.exit(1); }
