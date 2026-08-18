"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, ScrollText, PenLine, Megaphone, UserRound, Download, ExternalLink } from "lucide-react";
import {
  getPortfolioCases, getDecisions, getOpinions, getPublishedContent, getProfile, setProfile,
  subscribe, type UserProfile,
} from "@/lib/learningStore";
import { averageAbility, abilityLabel, abilityGapRecommendation } from "@/lib/learning";
import { computeAbilities } from "@/lib/learningStore";

export default function PortfolioPage() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);

  const cases = getPortfolioCases();
  const decisions = getDecisions();
  const opinions = getOpinions();
  const content = getPublishedContent();
  const abilities = computeAbilities();
  const avg = averageAbility(abilities);
  const gap = abilityGapRecommendation(abilities);
  const [profile, setProfileState] = useState<UserProfile>(getProfile());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile>(profile);

  const saveProfile = () => {
    setProfile(draft);
    setEditing(false);
  };

  const exportJson = () => {
    const data = { profile, abilities, cases, decisions, opinions, content, exportedAt: new Date().toISOString() };
    navigator.clipboard?.writeText(JSON.stringify(data, null, 2)).catch(() => {});
    alert("已复制 Portfolio JSON 到剪贴板（可粘贴到简历生成工具/网站生成器）");
  };

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <div className="flex items-center gap-2 mb-2"><Briefcase size={18} className="text-[#7dd3fc]" /><h1 className="text-xl font-bold text-white">My AI PM Portfolio · 我的 AI PM 作品集</h1></div>
        <p className="text-[13px] text-[#8b98b3]">GitHub → 项目分析 → 观点 → 内容 → Portfolio → AI PM 求职，把「看别人做产品」变成「自己会做产品」。</p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <div className="text-[11px] text-[#5b6885]">AI PM SCORE</div>
            <div className="text-3xl font-extrabold num glow-text">{avg}<span className="text-sm text-[#5b6885]">/100</span></div>
          </div>
          <div className="flex-1 min-w-[220px]">
            {editing ? (
              <div className="space-y-1.5">
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-full h-8 px-2.5 rounded-lg bg-[#0c1322] border border-[#1c2942] text-[12.5px]" placeholder="姓名" />
                <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="w-full h-8 px-2.5 rounded-lg bg-[#0c1322] border border-[#1c2942] text-[12.5px]" placeholder="定位" />
                <textarea value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} className="w-full min-h-[40px] px-2.5 py-1.5 rounded-lg bg-[#0c1322] border border-[#1c2942] text-[12.5px]" placeholder="简介" />
                <div className="flex gap-2">
                  <button onClick={saveProfile} className="h-8 px-3 rounded-lg bg-[#1a2a4a] border border-[#2c4370] text-[12px] text-white">保存</button>
                  <button onClick={() => setEditing(false)} className="h-8 px-3 rounded-lg bg-transparent border border-[#1c2942] text-[12px] text-[#aab6cd]">取消</button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setDraft(profile); setEditing(true); }} className="text-left">
                <div className="font-bold text-white text-[15px]">{profile.name} <span className="chip ml-1">编辑</span></div>
                <div className="text-[12.5px] text-[#7dd3fc]">{profile.title}</div>
                <div className="text-[12px] text-[#8b98b3] mt-0.5">{profile.bio}</div>
              </button>
            )}
          </div>
          <button onClick={exportJson} className="h-9 px-4 rounded-lg bg-[#1a2a4a] border border-[#2c4370] text-[12.5px] text-white flex items-center gap-1.5"><Download size={14} /> 导出 JSON</button>
        </div>
        <div className="mt-3 text-[12px] text-[#5b6885]">能力短板：{gap.weakness}（{gap.score}/100）· <Link href="/learn" className="text-[#7dd3fc]">去补齐 →</Link></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AssetPanel icon={Briefcase} color="#7dd3fc" title="AI Product Cases" count={cases.length} empty="还没有案例 — 去项目页「求职 Portfolio 模式」加入">
          {cases.map((c) => (
            <div key={c.id} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-white">{c.title}</span>
                <Link href={`/projects/${c.projectId}`} className="text-[#7dd3fc]"><ExternalLink size={13} /></Link>
              </div>
              <div className="text-[11.5px] text-[#5b6885] mt-0.5">{c.category} · {c.at.slice(0, 10)}</div>
            </div>
          ))}
        </AssetPanel>

        <AssetPanel icon={ScrollText} color="#34d399" title="Product Decision Journal" count={decisions.length} empty="还没有决策记录 — 在项目页「求职 Portfolio 模式」记录你的 PM 判断">
          {decisions.slice().reverse().map((d, i) => (
            <div key={i} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
              <div className="text-[12px] font-semibold text-[#7dd3fc]">{d.projectName} · {d.at.slice(0, 10)}</div>
              <div className="text-[12.5px] text-[#cfe0ff] mt-1">{d.myDecision}</div>
              <div className="text-[11.5px] text-[#5b6885] mt-1">理由：{d.reason || "—"}</div>
            </div>
          ))}
        </AssetPanel>

        <AssetPanel icon={PenLine} color="#fbbf24" title="Personal Product Opinions" count={opinions.length} empty="还没有观点 — 在项目页「自媒体模式」注入你的观点">
          {opinions.map((o) => (
            <div key={o.slug} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
              <div className="text-[12px] font-semibold text-[#fbbf24]">{o.projectName}</div>
              <div className="text-[12.5px] text-[#cfe0ff] mt-1">{o.opinion}</div>
            </div>
          ))}
        </AssetPanel>

        <AssetPanel icon={Megaphone} color="#f472b6" title="Content Portfolio" count={content.length} empty="还没有发布内容 — 在项目页「自媒体模式」生成并发布">
          {content.slice().reverse().map((c, i) => (
            <div key={i} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-white truncate">{c.title}</span>
                <span className="chip chip-accent shrink-0">Content {c.score}</span>
              </div>
              <div className="text-[11.5px] text-[#5b6885] mt-0.5">{c.platform} · {c.projectName} · {c.at.slice(0, 10)}</div>
            </div>
          ))}
        </AssetPanel>
      </div>

      {/* Ability summary */}
      <div className="panel p-6">
        <div className="text-[14px] font-bold text-white mb-3 flex items-center gap-2"><UserRound size={15} className="text-[#c084fc]" /> 能力总览</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          {(Object.entries(abilities) as [keyof typeof abilities, number][]).map(([k, v]) => (
            <div key={k} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 text-center">
              <div className="text-[11px] text-[#8b98b3]">{abilityLabel(k)}</div>
              <div className="text-lg font-bold num text-white">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[12px] text-[#5b6885]">面试表达素材：用「30 天拆解 {cases.length + opinions.length} 个 AI 产品」+「{decisions.length} 条产品决策」+「{content.length} 篇内容」证明你的 AI PM 能力。</div>
      </div>
    </div>
  );
}

function AssetPanel({ icon: Icon, color, title, count, empty, children }: { icon: any; color: string; title: string; count: number; empty: string; children: React.ReactNode }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} style={{ color }} />
        <span className="text-[14px] font-bold text-white">{title}</span>
        <span className="chip ml-auto num">{count}</span>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {count === 0 ? <div className="text-[12.5px] text-[#5b6885] py-3">{empty}</div> : children}
      </div>
    </div>
  );
}
