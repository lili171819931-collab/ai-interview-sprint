"use client";
import { Radar } from "lucide-react";

export function SaveButton({ slug, label = "Save" }: { slug: string; label?: string }) {
  const save = () => {
    try {
      const raw = localStorage.getItem("aioss.watchlist") ?? "[]";
      const list: string[] = JSON.parse(raw);
      if (!list.includes(slug)) {
        localStorage.setItem("aioss.watchlist", JSON.stringify([...list, slug]));
        alert("已加入 My AI Radar ✓");
      } else {
        alert("已在雷达中");
      }
    } catch {}
  };
  return (
    <button
      onClick={save}
      className="inline-flex items-center gap-1.5 text-[12px] text-[#8b98b3] hover:text-[#fbbf24]"
      title="加入雷达"
    >
      <Radar size={13} /> {label}
    </button>
  );
}

export function SaveButtonBig({ slug }: { slug: string }) {
  return (
    <button
      onClick={() => {
        try {
          const raw = localStorage.getItem("aioss.watchlist") ?? "[]";
          const list: string[] = JSON.parse(raw);
          if (!list.includes(slug)) {
            localStorage.setItem("aioss.watchlist", JSON.stringify([...list, slug]));
            alert("已加入 My AI Radar ✓");
          }
        } catch {}
      }}
      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-transparent border border-[#1c2942] text-[12.5px] text-[#aab6cd] hover:text-[#fbbf24]"
    >
      <Radar size={14} /> Save
    </button>
  );
}

export function LangSelect({ value, languages, q, category, sort }: {
  value: string; languages: string[]; q: string; category: string; sort: string;
}) {
  return (
    <select
      defaultValue={value}
      onChange={(e) => {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (category && category !== "all") params.set("category", category);
        if (e.target.value) params.set("lang", e.target.value);
        if (sort && sort !== "opportunity") params.set("sort", sort);
        const qs = params.toString();
        window.location.href = `/discover${qs ? `?${qs}` : ""}`;
      }}
      className="h-9 px-2.5 rounded-lg bg-[#0c1322] border border-[#1c2942] text-[12.5px] text-[#aab6cd] focus:outline-none"
    >
      <option value="">全部语言</option>
      {languages.map((l) => <option key={l} value={l}>{l}</option>)}
    </select>
  );
}
