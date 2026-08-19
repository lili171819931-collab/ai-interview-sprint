import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { projectBySlug } from "@/lib/store";
import { PROJECTS } from "@/data/projects";
import { buildProjectPrompt } from "@/lib/prompt";
import { ReportActions } from "@/components/ReportActions";

export const dynamic = "force-static";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export default async function ProjectPromptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = projectBySlug(slug);
  if (!p) notFound();
  const prompt = buildProjectPrompt(p);
  return (
    <div className="max-w-[920px] mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Link href={`/projects/${p.slug}/report`} className="chip hover:!text-[#7dd3fc]"><ArrowLeft size={12} /> 返回完整报告</Link>
        <Link href={`/projects/${p.slug}/qa`} className="chip hover:!text-[#7dd3fc]">💬 自问自答页</Link>
        <div className="ml-auto"><ReportActions markdown={prompt} /></div>
      </div>

      <div className="panel p-6">
        <div className="chip chip-accent mb-3"><Sparkles size={12} /> MASTER PROMPT GENERATOR</div>
        <h1 className="text-2xl font-extrabold text-white">{p.name} · 项目全部 Prompt</h1>
        <p className="text-[13px] text-[#8b98b3] mt-1.5">
          {p.fullName} · 一份自包含的 Master Prompt：角色（AI 产品逆向工程专家团队）+ 项目事实 + 完整链路 + 技术路线主线 +
          40 节报告 + 三件套 + 产品总监视角 + 自问自答 + Evidence 规则 + 最高标准。
          可直接粘贴到 Codex / Claude Code / Cursor 驱动深度分析。复制 / 下载 .md / 打印 PDF。
        </p>
      </div>

      <div className="panel p-5">
        <pre className="whitespace-pre-wrap font-mono text-[12px] text-[#cfe0ff] bg-[#0c1322] border border-[#16213a] rounded-xl p-5 max-h-[640px] overflow-y-auto leading-relaxed">
          {prompt}
        </pre>
      </div>
    </div>
  );
}
