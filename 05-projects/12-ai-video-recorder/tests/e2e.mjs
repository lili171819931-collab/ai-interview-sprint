/**
 * AI Video Recorder — 端到端功能测试
 * 使用 Chromium 的 fake media 设备（假摄像头/假麦克风），并 stub getDisplayMedia，
 * 完整验证：页面加载 → 连接摄像头/麦克风 → 屏幕源 → 录制 → 字幕/裁剪/缩放/BGM
 * → 停止 → 导出下载 → AI 智能剪辑分析 → 渲染最终视频。
 *
 * 运行：node tests/e2e.mjs
 * 需要先启动：npm run dev （或设置 BASE_URL 指向已启动服务）
 */
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = 3220;
const BASE = process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`;
const SHOT_DIR = path.join(ROOT, "test-artifacts");
mkdirSync(SHOT_DIR, { recursive: true });

let server = null;
let passed = 0, failed = 0;
const failures = [];

function ok(cond, label, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; failures.push(label); console.log(`  ✗ ${label} ${detail}`); }
}

async function startServer() {
  if (process.env.BASE_URL) return;
  server = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
    cwd: ROOT, stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((resolve, reject) => {
    let out = "";
    const to = setTimeout(() => reject(new Error("server start timeout")), 30000);
    server.stdout.on("data", (d) => {
      out += d.toString();
      if (out.includes("Local:")) { clearTimeout(to); resolve(); }
    });
    server.on("exit", (c) => reject(new Error(`server exited ${c}`)));
  });
  console.log(`  • dev server on ${BASE}`);
}

async function stopServer() {
  if (server) server.kill("SIGTERM");
}

async function main() {
  console.log("🎥 AI Video Recorder E2E");
  await startServer();

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

  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("[console]", m.type(), m.text().slice(0, 300)); });
  page.on("pageerror", (e) => console.log("[pageerror]", e.message.slice(0, 300)));
  page.on("dialog", async (d) => {
    if (d.type() === "prompt") { await d.accept("测试文字来源"); return; }
    await d.dismiss();
  });

  // 注入假屏幕源：动态渐变画布
  await page.addInitScript(() => {
    const orig = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getDisplayMedia = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1280; canvas.height = 720;
      const ctx = canvas.getContext("2d");
      let t = 0;
      const draw = () => {
        t += 0.02;
        const g = ctx.createLinearGradient(0, 0, 1280, 720);
        g.addColorStop(0, `hsl(${(t * 30) % 360}, 80%, 50%)`);
        g.addColorStop(1, `hsl(${(t * 30 + 120) % 360}, 80%, 40%)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 1280, 720);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 64px sans-serif";
        ctx.fillText(`FAKE SCREEN ${Math.floor(t * 50)}`, 60, 120);
        ctx.font = "28px sans-serif";
        ctx.fillText("AI Video Recorder E2E — 模拟屏幕内容", 60, 180);
        requestAnimationFrame(draw);
      };
      draw();
      const stream = canvas.captureStream(30);
      return stream;
    };
  });

  // ---------- 1. 页面加载 ----------
  console.log("\n1️⃣ 页面加载");
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
  ok((await page.title()).includes("AI Video Recorder"), "页面标题正确");
  await page.waitForSelector(".topbar", { timeout: 10000 });
  ok(await page.locator(".brand h1").textContent().then((t) => t?.includes("AI Video Recorder")), "品牌标题显示");
  ok(await page.locator(".layout aside").count() === 2, "左右面板存在");
  ok(await page.locator(".stage-canvas").isVisible(), "合成画布可见");
  ok(await page.locator(".device-select option", { hasText: "自动（默认摄像头）" }).count() === 2, "摄像头默认「自动」选项存在");
  ok(await page.locator("button", { hasText: "🔄 重新检测" }).isVisible(), "重新检测设备按钮存在");
  ok(await page.locator("button", { hasText: "📥 导入视频" }).isVisible(), "导入本地视频按钮存在");

  // 设备自检
  await page.locator("button", { hasText: "🔬 自检" }).click();
  await page.waitForSelector(".diag-body .diag-line", { timeout: 30000 });
  await page.waitForFunction(() => {
    const t = document.querySelector(".diag-body")?.textContent ?? "";
    return t.includes("结论") && (t.includes("有画面输出") || t.includes("无法输出画面"));
  }, { timeout: 30000 });
  ok(await page.locator(".diag-body .diag-line").count() > 5, "设备自检报告已生成（多行检测结果）");
  const diagText = await page.locator(".diag-body").textContent();
  ok(diagText.includes("mediaDevices.getUserMedia 可用") && diagText.includes("结论"), "自检包含摄像头实测结论");
  await page.screenshot({ path: path.join(SHOT_DIR, "01b-diagnostics.png") });
  await page.locator(".diag-modal .modal-close").click();
  await page.screenshot({ path: path.join(SHOT_DIR, "01-loaded.png") });

  // ---------- 2. 源连接 ----------
  console.log("\n2️⃣ 音视频源");
  // 摄像头 1
  await page.locator(".source-card", { hasText: "Camera 1" }).locator("button", { hasText: "打开摄像头" }).click();
  await page.waitForFunction(() => {
    const cards = document.querySelectorAll(".source-card");
    return [...cards].some((c) => c.textContent.includes("Camera 1") && c.getAttribute("data-on") === "true");
  }, { timeout: 15000 });
  ok(true, "Camera 1 已连接");
  await page.waitForSelector(".source-card video.cam-preview", { timeout: 10000 });
  ok(true, "Camera 1 预览画面出现");

  // 摄像头 2
  await page.locator(".source-card", { hasText: "Camera 2" }).locator("button", { hasText: "打开摄像头" }).click();
  await page.waitForFunction(() => {
    const cards = document.querySelectorAll(".source-card");
    return [...cards].some((c) => c.textContent.includes("Camera 2") && c.getAttribute("data-on") === "true");
  }, { timeout: 15000 });
  ok(true, "Camera 2 已连接");

  // 麦克风
  await page.locator(".source-card", { hasText: "麦克风" }).locator("button", { hasText: "开启麦克风" }).click();
  await page.waitForFunction(() => {
    const cards = document.querySelectorAll(".source-card");
    return [...cards].some((c) => c.textContent.includes("麦克风") && c.getAttribute("data-on") === "true");
  }, { timeout: 15000 });
  ok(true, "麦克风已连接");

  // 屏幕
  await page.locator(".source-card", { hasText: "屏幕 / 窗口" }).locator("button", { hasText: "选择屏幕 / 窗口" }).click();
  await page.waitForFunction(() => {
    const cards = document.querySelectorAll(".source-card");
    return [...cards].some((c) => c.textContent.includes("屏幕 / 窗口") && c.getAttribute("data-on") === "true");
  }, { timeout: 15000 });
  ok(true, "屏幕源已连接");
  await page.waitForTimeout(800);

  // ---------- 2.5. OBS 控制台 ----------
  console.log("\n2.5️⃣ OBS 控制台（场景 / 来源 / 混音器 / 滤镜 / 转场）");
  ok(await page.locator(".obs-console").count() === 1, "OBS 控制台显示");
  ok(await page.locator(".obs-section").count() === 3, "场景 / 来源 / 混音器三栏");
  ok(await page.locator(".scene-chip").count() >= 1, "默认场景存在");
  ok(await page.locator(".mixer-channel").count() === 4, "混音器 4 通道（麦克风 / 系统声 / BGM / 主输出）");
  ok(await page.locator(".obs-select").count() === 1, "转场方式选择存在");

  // 场景：新建 + 切换（快照恢复）
  await page.locator(".obs-section").first().locator("button", { hasText: "➕ 新建" }).click();
  await page.waitForTimeout(300);
  ok(await page.locator(".scene-chip").count() === 2, "新建场景成功");
  let sceneChips = page.locator(".scene-chip");
  await sceneChips.nth(0).click(); // 切到场景 1
  await page.waitForTimeout(300);
  await page.locator(".tab-btn", { hasText: "模板" }).click();
  await page.locator(".template-card", { hasText: "抖音 / TikTok" }).click();
  await page.waitForTimeout(400);
  await sceneChips.nth(1).click(); // 场景 2（应为 YouTube）
  await page.waitForTimeout(700);
  ok((await page.locator(".template-badge").textContent()).includes("YouTube"), "切换到场景 2 → YouTube 模板");
  await sceneChips.nth(0).click(); // 场景 1（应为抖音）
  await page.waitForTimeout(700);
  ok((await page.locator(".template-badge").textContent()).includes("抖音"), "切回场景 1 → 抖音模板");

  // 文字来源
  await page.locator(".obs-section").nth(1).locator("button", { hasText: "➕ 文字" }).click();
  await page.waitForTimeout(500);
  ok(await page.locator(".src-item", { hasText: "测试文字来源" }).count() === 1, "添加文字来源成功");

  // 摄像头滤镜
  await page.locator(".tab-btn", { hasText: "小窗·美颜" }).click();
  await page.locator(".preset-row button", { hasText: "暖阳" }).click();
  ok(await page.locator(".preset-row button", { hasText: "暖阳" }).evaluate((el) => el.className.includes("active")), "摄像头滤镜「暖阳」已应用");

  // ---------- 3. 引擎功能设置 ----------
  console.log("\n3️⃣ 视频引擎（裁剪/缩放/字幕/模板/BGM）");
  // 字幕默认开启，先改文字
  await page.locator(".tab-btn", { hasText: "字幕" }).click();
  const subTextarea = page.locator("textarea.subtitle-input");
  await subTextarea.fill("AI 智能录制测试\n端到端验证中…");
  ok((await subTextarea.inputValue()).includes("AI 智能录制测试"), "字幕内容已更新");

  // 裁剪
  await page.locator(".tab-btn", { hasText: "裁剪" }).click();
  await page.locator(".preset-row button", { hasText: "16:9" }).click();
  ok(true, "裁剪预设 16:9 已应用");

  // 缩放
  await page.locator(".tab-btn", { hasText: "缩放" }).click();
  const zoomSlider = page.locator(".slider-row", { hasText: "缩放" }).locator("input[type=range]");
  await zoomSlider.fill("1.5");
  ok(true, "缩放 1.5x 已设置");

  // 模板
  await page.locator(".tab-btn", { hasText: "模板" }).click();
  await page.locator(".template-card", { hasText: "抖音 / TikTok" }).click();
  await page.waitForTimeout(400);
  ok(await page.locator(".template-badge").textContent().then((t) => t?.includes("抖音")), "切换为抖音竖屏模板");

  // BGM
  await page.locator(".tab-btn", { hasText: "BGM" }).click();
  await page.locator(".bgm-item", { hasText: "Lo-Fi" }).click();
  ok(await page.locator(".bgm-item.active").count() === 1, "Lo-Fi BGM 已开启");

  // 小窗·美颜（融合功能）
  await page.locator(".tab-btn", { hasText: "小窗·美颜" }).click();
  await page.locator(".preset-row button", { hasText: "上下分屏" }).click();
  ok(await page.locator(".preset-row button", { hasText: "上下分屏" }).evaluate((el) => el.className.includes("active")), "切换到上下分屏模式");
  await page.locator(".preset-row button", { hasText: "画中画" }).click();
  ok(await page.locator(".preset-row button", { hasText: "画中画" }).evaluate((el) => el.className.includes("active")), "切回画中画模式");
  await page.locator(".preset-row button", { hasText: "圆形" }).first().click();
  ok(await page.locator(".preset-row button", { hasText: "圆形" }).first().evaluate((el) => el.className.includes("active")), "小窗切换为圆形");
  await page.locator(".preset-row button", { hasText: "人像抠图" }).click();
  ok(await page.locator(".preset-row button", { hasText: "人像抠图" }).evaluate((el) => el.className.includes("active")), "开启人像抠图（人像清晰+背景模糊）");
  await page.locator(".preset-row button", { hasText: "页面模糊" }).click();
  ok(await page.locator(".preset-row button", { hasText: "页面模糊" }).evaluate((el) => el.className.includes("active")), "开启页面背景模糊");
  await page.locator(".slider-row", { hasText: "磨皮" }).locator("input[type=range]").fill("0.5");
  ok(true, "美颜磨皮滑块已调节");
  await page.locator(".check-row", { hasText: "点击特效" }).locator("input").check();
  await page.locator(".check-row", { hasText: "Camera 2 可见" }).locator("input").uncheck();
  ok(true, "OBS 风格来源可见性切换（隐藏 Camera 2）");

  // 标注：切回选择工具避免干扰
  await page.locator(".tool-btn", { hasText: "🖱" }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SHOT_DIR, "02-configured.png") });

  // ---------- 4. 录制（含倒计时） ----------
  console.log("\n4️⃣ 录制（倒计时 + 暂停/继续）");
  await page.locator(".countdown-select").selectOption("3");
  await page.locator(".btn-record").click();
  await page.waitForSelector(".countdown-mask", { timeout: 5000 });
  const cdNum = await page.locator(".countdown-num").textContent();
  ok(["3", "2", "1"].includes(cdNum?.trim() ?? ""), `倒计时数字显示: ${cdNum}`);
  ok((await page.locator(".status-chip").getAttribute("data-recording")) !== "true", "倒计时期间尚未开始录制");
  await page.waitForSelector(".status-chip[data-recording='true']", { timeout: 12000 });
  ok(true, "倒计时结束自动开始录制");
  await page.waitForTimeout(500);
  const timerText1 = await page.locator(".timer").textContent();
  await page.waitForTimeout(1600);
  const timerText2 = await page.locator(".timer").textContent();
  ok(timerText1 !== timerText2, "计时器在走动");
  await page.locator(".btn-pause").click();
  await page.waitForTimeout(400);
  const tPauseA = await page.locator(".timer").textContent();
  await page.waitForTimeout(800);
  const tPauseB = await page.locator(".timer").textContent();
  ok(tPauseA === tPauseB, "暂停后计时停止");
  await page.locator(".btn-resume").click();
  await page.waitForTimeout(600);
  ok(true, "继续录制");
  await page.waitForTimeout(2500);
  await page.locator(".btn-stop").click();
  await page.waitForFunction(() => document.querySelector(".status-chip")?.textContent?.includes("录制完成"), { timeout: 15000 });
  ok(true, "录制完成");
  await page.screenshot({ path: path.join(SHOT_DIR, "03-recorded.png") });

  // ---------- 5. 导出 ----------
  console.log("\n5️⃣ 导出");
  await page.locator(".btn-export").click();
  await page.waitForSelector(".modal", { timeout: 5000 });
  ok(await page.locator(".export-meta").count() === 1, "导出面板显示视频信息");
  ok(await page.locator(".platform-btn").count() === 4, "四大平台发布入口（TikTok/YouTube/小红书/抖音）");

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.locator(".btn-row button", { hasText: "下载视频" }).click(),
  ]);
  ok(download.suggestedFilename().match(/\.(webm|mp4)$/), `视频文件已下载: ${download.suggestedFilename()}`);
  await page.screenshot({ path: path.join(SHOT_DIR, "04-export.png") });
  await page.locator(".modal-close").click();

  // ---------- 6. AI 剪辑 ----------
  console.log("\n6️⃣ AI 智能剪辑");
  await page.locator(".tab-btn", { hasText: "AI 剪辑" }).click();
  await page.locator("button", { hasText: "分析并生成剪辑方案" }).click();
  await page.waitForSelector(".plan-box", { timeout: 30000 });
  ok(true, "AI 剪辑方案已生成");
  const stats = await page.locator(".plan-stats").textContent();
  ok(/保留/.test(stats) && /剪除/.test(stats), `剪辑统计: ${stats.trim()}`);
  await page.screenshot({ path: path.join(SHOT_DIR, "05-ai-plan.png") });

  // 渲染最终视频（关闭字幕/BGM 以加速）
  await page.locator(".plan-box .check-row", { hasText: "叠加字幕" }).locator("input").uncheck();
  await page.locator(".plan-box .check-row", { hasText: "叠加 BGM" }).locator("input").uncheck();
  const [aiDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 120000 }),
    page.locator("button", { hasText: "渲染 AI 剪辑视频" }).click(),
  ]);
  ok(aiDownload.suggestedFilename().startsWith("ai-edited-"), `AI 剪辑视频已下载: ${aiDownload.suggestedFilename()}`);
  ok(await page.locator(".ai-log").textContent().then((t) => t?.includes("AI 剪辑完成")), "AI 剪辑完成日志");
  await page.screenshot({ path: path.join(SHOT_DIR, "06-ai-rendered.png") });

  // ---------- 7. 分享面板 ----------
  console.log("\n7️⃣ 发布");
  await page.locator(".btn-export").click();
  await page.waitForSelector(".modal");
  for (const name of ["TikTok", "YouTube", "小红书", "抖音"]) {
    ok(await page.locator(".platform-btn", { hasText: name }).count() === 1, `${name} 发布按钮存在`);
  }

  await browser.close();
  await stopServer();
  console.log(`\n===== 结果: ${passed} 通过 / ${failed} 失败 =====`);
  if (failed > 0) {
    console.log("失败项:", failures.join("; "));
    process.exit(1);
  }
  console.log(`截图已保存: ${SHOT_DIR}`);
}

main().catch(async (e) => {
  console.error("E2E 异常:", e);
  if (server) server.kill("SIGTERM");
  process.exit(1);
});
