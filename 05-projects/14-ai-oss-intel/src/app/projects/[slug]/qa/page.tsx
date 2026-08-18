import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { projectBySlug } from "@/lib/store";
import { PROJECTS } from "@/data/projects";
import { buildPanoramaQA, buildMainlineQA, buildQaMarkdown } from "@/lib/master";
import { buildDirectorQA } from "@/lib/director";
import { ReportActions } from "@/components/ReportActions";

export const dynamic = "force-static";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export default async function ProjectQaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = projectBySlug(slug);
  if (!p) notFound();
  const md = buildQaMarkdown(p);
  const sections = [
    { title: "🖼️ 产品全景图 · 自问自答", items: buildPanoramaQA(p) },
    { title: "🗺️ 技术路线主线 · 自问自答", items: buildMainlineQA(p) },
    { title: "👔 产品总监全景图 · 自问自答", items: buildDirectorQA(p) },
  ];
  return (
    <div className="max-w-[860px] mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Link href={`/projects/${p.slug}/report`} className="chip hover:!text-[#7dd3fc]"><ArrowLeft size={12} /> 返回完整报告</Link>
        <div className="ml-auto"><ReportActions markdown={md} /></div>
      </div>

      <div className="panel p-6 print:bg-white">
        <div className="chip chip-accent mb-3">PRODUCT PANORAMA Q&A</div>
        <h1 className="text-2xl font-extrabold text-white print:text-black">{p.name} · 产品全景图自问自答</h1>
        <p className="text-[13px] text-[#8b98b3] mt-1.5">{p.fullName} · {p.tagline} · 可打印/导出 PDF · 复制/下载 Markdown</p>
      </div>

      {sections.map((sec) => (
        <section key={sec.title} className="panel p-6">
          <h2 className="text-[16px] font-bold text-white mb-4">{sec.title}</h2>
          <div className="space-y-3">
            {sec.items.map((it) => (
              <div key={it.node} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
                <div className="text-[12.5px] font-bold text-[#7dd3fc] mb-1.5">{it.node}</div>
                <div className="space-y-1.5">
                  {it.qa.map((x, i) => (
                    <div key={i} className="rounded-lg bg-[#101a2e] border border-[#16213a] p-2.5">
                      <div className="text-[12px] font-semibold text-[#fbbf24]">Q：{x.q}</div>
                      <div className="text-[12px] text-[#cfe0ff] leading-relaxed mt-0.5">A：{x.a}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="text-center text-[11px] text-[#4d5a75] pb-4">AI OSS Intel · {p.fullName} · {new Date().toISOString().slice(0, 10)}</div>
    </div>
  );
}
