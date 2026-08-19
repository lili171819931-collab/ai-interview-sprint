"use client";
import { useState } from "react";
import { Copy, Check, Clapperboard, PenLine, Rocket, TrendingUp } from "lucide-react";
import type { Project } from "@/lib/types";
import { buildContentPack, buildVideoScript, buildOpinionFrame } from "@/lib/learning";
import { getOpinion, saveOpinion, publishContent } from "@/lib/learningStore";

export function ContentMode({ project }: { project: Project }) {
  const pack = buildContentPack(project);
  const [opinion, setOpinion] = useState(getOpinion(project.slug));
  const [active, setActive] = useState(pack.platforms[0].platform);
  const [copied, setCopied] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const withOpinion = buildContentPack(project, opinion.trim());
  const activeContent = withOpinion.platforms.find((p) => p.platform === active) ?? withOpinion.platforms[0];
  const video = buildVideoScript(project, opinion.trim());
  const frame = buildOpinionFrame(project);

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const doSaveOpinion = () => {
    saveOpinion({ slug: project.slug, projectName: project.name, opinion, at: new Date().toISOString() });
  };

  const doPublish = () => {
    publishContent({ slug: project.slug, projectName: project.name, platform: active, title: activeContent.title, score: withOpinion.score.total, at: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 观点注入 */}
      <div className="panel p-5">
        <div className="flex items-center gap-2 mb-2"><PenLine size={16} className="text-[#fbbf24]" /><span className="text-[14px] font-bold text-white">观点注入 · 你的判断才是内容的核心</span></div>
        <p className="text-[12px] text-[#5b6885] mb-3">输入你的产品判断，AI 会把「项目事实 + AI 分析 + 我的观点」融合进每篇内容 —— 避免成为 AI 洗稿平台。</p>
        <textarea
          value={opinion}
          onChange={(e) => setOpinion(e.target.value)}
          placeholder="例如：我认为这个产品最大的机会是把工作流做成模板市场，而不是继续加模型。"
          className="w-full min-h-[84px] px-3.5 py-3 rounded-xl bg-[#0c1322] border border-[#1c2942] text-[13px] text-[#cfe0ff] placeholder:text-[#4d5a75] focus:outline-none focus:border-[#2c4370]"
        />
        <div className="flex gap-2 mt-2">
          <button onClick={doSaveOpinion} className="h-9 px-4 rounded-lg bg-[#1a2a4a] border border-[#2c4370] text-[12.5px] text-white hover:bg-[#1f3158]">保存我的观点</button>
          <span className="text-[11.5px] text-[#5b6885] self-center">{opinion.trim() ? "✓ 观点已注入内容" : "未输入观点（内容将只基于 AI 分析）"}</span>
        </div>
      </div>

      {/* 内容评分 */}
      <div className="panel p-5">
        <div className="flex items-center gap-2 mb-3"><TrendingUp size={16} className="text-[#f472b6]" /><span className="text-[14px] font-bold text-white">内容评分 · Content Score</span></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {[
            { k: "Hook", v: withOpinion.score.hook },
            { k: "Information", v: withOpinion.score.information },
            { k: "Originality", v: withOpinion.score.originality },
            { k: "Product Insight", v: withOpinion.score.productInsight },
            { k: "Practical Value", v: withOpinion.score.practicalValue },
            { k: "Shareability", v: withOpinion.score.shareability },
          ].map((x) => (
            <div key={x.k} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
              <div className="flex justify-between text-[11.5px]"><span className="text-[#8b98b3]">{x.k}</span><span className="num text-[#f472b6]">{Math.round(x.v)}</span></div>
              <div className="h-1.5 rounded-full bg-[#141e33] mt-1.5 overflow-hidden"><div className="h-full bg-[#f472b6]" style={{ width: `${x.v}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-center text-[15px] font-bold text-white">Content Score：<span className="num text-[#f472b6]">{withOpinion.score.total}</span>/100</div>
      </div>

      {/* 平台内容 */}
      <div className="panel p-5">
        <div className="flex items-center gap-2 mb-3"><Rocket size={16} className="text-[#7dd3fc]" /><span className="text-[14px] font-bold text-white">Generate Content · 一键生成 8 平台内容</span></div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {withOpinion.platforms.map((pl) => (
            <button key={pl.platform} onClick={() => setActive(pl.platform)} className={`chip cursor-pointer ${active === pl.platform ? "chip-accent" : ""}`}>{pl.platform}</button>
          ))}
        </div>
        <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="font-semibold text-white text-[14px]">{activeContent.title}</div>
            <button onClick={() => copy(activeContent.body + "\n\n" + activeContent.hashtags.join(" "), "body")} className="chip cursor-pointer hover:!text-[#7dd3fc]">
              {copied === "body" ? <Check size={12} /> : <Copy size={12} />} {copied === "body" ? "已复制" : "复制"}
            </button>
          </div>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-[13px] text-[#aab6cd] leading-relaxed">{activeContent.body}</pre>
          <div className="mt-3 flex flex-wrap gap-1.5">{activeContent.hashtags.map((h) => <span key={h} className="chip">{h}</span>)}</div>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={doPublish} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#2f6bff] to-[#7c5cff] text-[12.5px] text-white font-semibold">
            {saved ? "✓ 已沉淀到 Portfolio" : "发布并沉淀到 Portfolio"}
          </button>
        </div>
      </div>

      {/* 视频脚本 */}
      <div className="panel p-5">
        <div className="flex items-center gap-2 mb-3"><Clapperboard size={16} className="text-[#34d399]" /><span className="text-[14px] font-bold text-white">Create Video · 一键生成视频脚本</span></div>
        <div className="text-[13px] font-semibold text-[#7dd3fc] mb-3">{video.title}</div>
        <div className="space-y-2">
          {video.segments.map((seg, i) => (
            <div key={i} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5 flex gap-3">
              <span className="chip chip-accent shrink-0 !text-[10.5px]">{seg.label}</span>
              <span className="text-[12.5px] text-[#aab6cd]">{seg.text}</span>
            </div>
          ))}
          <div className="rounded-xl bg-[#101a2e] border border-[#f472b6]/30 p-3.5">
            <span className="chip !text-[10.5px] shrink-0">CTA</span>
            <span className="text-[12.5px] text-[#f472b6] ml-2">{video.cta}</span>
          </div>
        </div>
        <button onClick={() => copy(video.segments.map((s) => `【${s.label}】${s.text}`).join("\n\n") + "\n\n【CTA】" + video.cta, "video")} className="chip cursor-pointer mt-3">
          {copied === "video" ? <Check size={12} /> : <Copy size={12} />} {copied === "video" ? "已复制脚本" : "复制脚本"}
        </button>
      </div>

      {/* 观点生成器 */}
      <div className="panel p-5">
        <div className="flex items-center gap-2 mb-3"><PenLine size={16} className="text-[#c084fc]" /><span className="text-[14px] font-bold text-white">Personal Product Opinion · 观点生成器</span></div>
        <div className="space-y-2 text-[13px] text-[#aab6cd]">
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5"><b className="text-[#7dd3fc]">这个产品最大的创新：</b>{frame.biggestInnovation}</div>
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5"><b className="text-[#f87171]">最大的缺陷：</b>{frame.biggestFlaw}</div>
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5">
            <b className="text-[#34d399]">如果我是 PM：</b>
            <div className="mt-1 space-y-1">{frame.ifPmSteps.map((s, i) => <div key={i}>{s}</div>)}</div>
          </div>
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5"><b className="text-[#fbbf24]">我认为未来机会：</b>{frame.futureOpportunity}</div>
        </div>
      </div>
    </div>
  );
}
