"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, RefreshCw, Radio, Database } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { useDb } from "@/lib/db";

const SUGGESTIONS = [
  "最近30天增长最快的Agent项目",
  "适合做副业的AI项目",
  "哪些项目适合做Skill",
  "适合AI PM做Portfolio的项目",
  "可以改造成SaaS的GitHub项目",
];

export function Topbar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/ask?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[#141e33] bg-[#060a13]/85 backdrop-blur px-4 md:px-8 flex items-center gap-4">
      <div className="hidden md:block text-[13px] text-[#5b6885]">
        <span className="text-[#8b98b3]">AI Open Source Intelligence</span> · Discover. Analyze. Build. Monetize.
      </div>
      <form onSubmit={submit} className="relative flex-1 max-w-[520px] ml-auto">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5b6885]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 150)}
          placeholder="自然语言搜索，如：最近30天增长最快适合做副业的AI项目"
          className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#0c1322] border border-[#1c2942] text-[13px] placeholder:text-[#4d5a75] focus:outline-none focus:border-[#2c4370] focus:bg-[#0e1626]"
        />
        {focus && (
          <div className="absolute top-11 left-0 right-0 panel p-2 z-40">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={() => { setQ(s); router.push(`/ask?q=${encodeURIComponent(s)}`); }}
                className="block w-full text-left px-3 py-2 rounded-lg text-[12.5px] text-[#aab6cd] hover:bg-[#16233d] hover:text-white"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </form>
      <SyncControl />
      <Link
        href="https://github.com"
        target="_blank"
        className="hidden sm:flex items-center gap-1.5 text-[12px] text-[#8b98b3] hover:text-white border border-[#1c2942] rounded-lg px-3 h-9"
      >
        <GithubIcon size={14} /> GitHub
      </Link>
    </header>
  );
}


function SyncControl() {
  const { state, syncing, refresh } = useDb();
  const live = state.repos.length > 0;
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {syncing ? (
        <span className="flex items-center gap-1.5 text-[11.5px] text-[#7dd3fc]"><RefreshCw size={12} className="animate-spin" /> 全库同步中…</span>
      ) : live ? (
        <span className="hidden md:flex items-center gap-1 text-[11px] text-[#8b98b3] num">
          <Radio size={12} className="text-emerald-400" />
          {state.source === "live" ? "实时" : "缓存"} · {state.repos.length} 项目
          {state.fetchedAt > 0 && <> · {new Date(state.fetchedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</>}
        </span>
      ) : (
        <span className="hidden md:flex items-center gap-1 text-[11px] text-[#5b6885]"><Database size={12} /> 本地快照</span>
      )}
      <button onClick={refresh} disabled={syncing} title="同步全平台实时数据（GitHub）" className="chip cursor-pointer hover:!text-[#7dd3fc] disabled:opacity-50 !py-1">
        <RefreshCw size={11} className={syncing ? "animate-spin" : ""} /> 实时同步
      </button>
    </div>
  );
}
