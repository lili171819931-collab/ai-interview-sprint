import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT = path.join(process.cwd(), "public");
const TMP = "/tmp/lily-tutorial";
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const W = 1920, H = 1080;
const BG = "#0a0a0c", SURFACE = "#121216", BORDER = "#232329";
const FG = "#ededef", MUTED = "#8b8b96", ACCENT = "#7c6cf0", ACCENT2 = "#00c9a7";

const slides = [
  {
    title: "Lily-Skills",
    sub: "Personal AI Skill OS · 个人 AI 能力操作系统",
    points: ["让 AI Agent 自动找到、组合并执行你的能力", "你只负责提出目标，系统负责组织能力"],
    narration: "欢迎来到 Lily-Skills，你的个人 AI 能力操作系统。你只需提出目标，系统自动找到、组合并执行正确的能力。",
  },
  {
    title: "🤖 AI Agent 主入口",
    sub: "用自然语言完成任务",
    points: ["描述目标 → Agent 理解意图 → 推荐 Skill → 生成计划", "确认后自动多 Skill 编排执行", "高风险操作需要人工审批"],
    narration: "AI Agent 是大脑。在首页输入目标，Agent 会理解你的意图，推荐合适的 Skill，生成执行计划，确认后自动执行，高风险操作会请求审批。",
  },
  {
    title: "🧩 Skills 能力中心",
    sub: "浏览、搜索、运行",
    points: ["卡片 / 列表 / 分类三种视图", "关键词 + 语义混合搜索", "详情页一键运行，查看结果与日志", "新 Skill 自动进入 Registry / 搜索 / Agent"],
    narration: "Skills 页面可以浏览全部能力，支持分类、标签和语义搜索。进入详情页可以直接运行，查看输入、输出和执行日志。",
  },
  {
    title: "🔄 Workflows 工作流",
    sub: "把多个 Skill 组合成自动化流程",
    points: ["可视化 Builder 拖拽组合节点", "Skill / AI 决策 / 条件分支 / 人工审批", "运行、暂停、审批、恢复", "一次编排，长期复用"],
    narration: "Workflows 工作流可以把多个 Skill 组合成自动化流程，支持条件分支、AI 决策和人工审批节点，运行后可以暂停、审批和恢复。",
  },
  {
    title: "📦 Skill Hub · GitHub 导入",
    sub: "优先复用开源能力：Reuse > Wrap > Build",
    points: ["粘贴 GitHub 仓库地址", "自动分析 Repo → 生成 Manifest + Adapter", "自动注册、分类、打 Tag", "Skill 集合（SKILL.md）逐个导入"],
    narration: "Skill Hub 是能力聚合中枢。粘贴 GitHub 仓库地址，系统自动分析仓库，生成清单和适配器，并注册到平台。对于包含多个技能文档的仓库，会逐个导入。",
  },
  {
    title: "🚀 开始使用",
    sub: "三步上手",
    points: ["npm install && npm run dev", "打开 http://localhost:3210", "在首页输入一个目标，交给 Agent", "Developer Center 导入开源 Skill"],
    narration: "开始使用很简单：安装依赖，运行开发服务器，打开本地地址，在首页输入一个目标交给 Agent，然后到开发者中心导入开源能力。",
  },
];

function svg(slide, idx) {
  const title = escapeXml(slide.title);
  const sub = escapeXml(slide.sub);
  const points = slide.points.map((p) => `    <li>${escapeXml(p)}</li>`).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8b7bff"/><stop offset="0.55" stop-color="${ACCENT}"/><stop offset="1" stop-color="${ACCENT2}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect x="40" y="40" width="${W-80}" height="${H-80}" rx="28" fill="${SURFACE}" stroke="${BORDER}" stroke-width="2"/>
  <rect x="40" y="40" width="${W-80}" height="8" rx="4" fill="url(#g)"/>
  <text x="120" y="250" font-family="PingFang SC, sans-serif" font-size="88" font-weight="700" fill="${FG}">${title}</text>
  <text x="120" y="330" font-family="PingFang SC, sans-serif" font-size="40" fill="${MUTED}">${sub}</text>
  <line x1="120" y1="380" x2="${W-120}" y2="380" stroke="${BORDER}" stroke-width="2"/>
  <ul x="120" y="480" font-family="PingFang SC, sans-serif" font-size="42" fill="${FG}" line-height="1.7">
${points}
  </ul>
  <text x="${W-120}" y="${H-70}" text-anchor="end" font-family="ui-monospace, monospace" font-size="28" fill="${MUTED}">${idx + 1} / ${slides.length}</text>
</svg>`;
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const VOICE = "Flo (中文（中国大陆）)";

async function main() {
  const segs = [];
  for (let i = 0; i < slides.length; i++) {
    const png = path.join(TMP, `slide-${i + 1}.png`);
    await sharp(Buffer.from(svg(slides[i], i))).png().toFile(png);

    const aiff = path.join(TMP, `audio-${i + 1}.aiff`);
    execFileSync("say", ["-v", VOICE, "-o", aiff, slides[i].narration]);

    const seg = path.join(TMP, `seg-${i + 1}.mp4`);
    execFileSync("ffmpeg", [
      "-y", "-loop", "1", "-i", png, "-i", aiff,
      "-c:v", "libx264", "-tune", "stillimage", "-c:a", "aac", "-b:a", "128k",
      "-pix_fmt", "yuv420p", "-shortest", "-vf", "fps=30", seg,
    ], { stdio: "ignore" });
    segs.push(seg);
  }

  const list = path.join(TMP, "list.txt");
  fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join("\n"));
  const final = path.join(OUT, "tutorial.mp4");
  execFileSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", final], { stdio: "ignore" });

  const stat = fs.statSync(final);
  console.log(`tutorial.mp4 written: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
