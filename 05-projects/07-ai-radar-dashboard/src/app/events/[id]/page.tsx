import Link from "next/link";
import { Flame, Radar } from "lucide-react";
import { EventDetail } from "@/components/intel/EventDetail";
import { getEventById } from "@/lib/intel/events-data";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = getEventById(id);

  if (!event) {
    return (
      <div className="container py-10 space-y-4">
        <h1 className="display text-2xl font-semibold">事件未找到</h1>
        <p className="text-[var(--muted)]">id={id}</p>
        <Link href="/" className="btn btn-primary">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-10 space-y-6">
      <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(43,182,115,0.4)] bg-[var(--signal-dim)] px-3 py-1 text-xs text-[#b7f0d2]">
        <Flame size={14} aria-hidden />
        跨平台事件 · AI 分析
      </div>
      <EventDetail event={event} />
      <Link href="/radar" className="text-sm text-[var(--muted)] hover:text-[var(--text)] inline-flex items-center gap-1">
        <Radar size={14} aria-hidden /> 动态雷达日报
      </Link>
    </div>
  );
}
