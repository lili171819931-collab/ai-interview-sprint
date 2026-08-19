"use client";
import { Copy, Download, Printer, Check } from "lucide-react";
import { useState } from "react";

export function ReportActions({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  const download = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-product-report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#1a2a4a] border border-[#2c4370] text-[12.5px] text-white hover:bg-[#1f3158]">
        <Printer size={14} /> 打印 / 导出 PDF
      </button>
      <button onClick={copy} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-transparent border border-[#1c2942] text-[12.5px] text-[#aab6cd] hover:text-white">
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />} {copied ? "已复制" : "复制 Markdown"}
      </button>
      <button onClick={download} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-transparent border border-[#1c2942] text-[12.5px] text-[#aab6cd] hover:text-white">
        <Download size={14} /> 下载 .md
      </button>
    </div>
  );
}
