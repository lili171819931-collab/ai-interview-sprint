import Link from "next/link";
import { MessageSquareText } from "lucide-react";

export const dynamic = "force-dynamic";

const EXAMPLES = [
  { q: "过去 24 小时 AI 圈最重要的 5 件事是什么？", hint: "GET /api/v1/items?mode=selected&window=24h&limit=5" },
  { q: "现在 AI 圈最热的事件是什么？", hint: "GET /api/v1/hot-topics" },
  { q: "看一下今天的 AI 日报", hint: "GET /api/v1/dailies/latest" },
  { q: "最近一周的 AI 论文", hint: "GET /api/v1/items?mode=selected&category=paper&window=7d&limit=10" },
];

export default function AgentPage() {
  return (
    <div className="container py-10 space-y-10 max-w-3xl">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(139,92,246,0.45)] bg-[var(--ai-accent-dim)] px-3 py-1 text-xs text-[#d7ccff]">
          <MessageSquareText size={14} aria-hidden />
          Agent 接入 · 匿名只读 v1
        </div>
        <h1 className="page-title">让 Agent 直接问看板</h1>
        <p className="page-sub leading-relaxed">
          复刻 AIHOT 的接入方式：Skill 式中文问题 → 稳定 REST。本仓 v1 读的是本地快照（AIHOT 精选 + 智衡聚类），不是 AIHOT 的公开镜像代理。
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="display text-xl font-semibold">先这样问</h2>
        <ul className="space-y-3">
          {EXAMPLES.map((e) => (
            <li key={e.q} className="surface p-4 space-y-1">
              <p className="text-sm">{e.q}</p>
              <code className="text-xs text-[var(--muted)] break-all">{e.hint}</code>
            </li>
          ))}
        </ul>
        <Link href="/ask" className="btn btn-primary">
          打开问问 Agent
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="display text-xl font-semibold">v1 合同</h2>
        <ul className="text-sm text-[var(--muted)] space-y-2 leading-relaxed">
          <li>
            <code className="text-[var(--text)]">GET /api/v1/items</code> — mode=selected|all · window=24h|7d ·
            category=ai-models|ai-products|industry|paper|tip · q · limit
          </li>
          <li>
            <code className="text-[var(--text)]">GET /api/v1/hot-topics</code> — 最多 10 条，按 rank，不返回内部热度值
          </li>
          <li>
            <code className="text-[var(--text)]">GET /api/v1/dailies/latest</code> — 日切成品，保留 sections / flashes
          </li>
        </ul>
        <p className="text-xs text-[var(--muted)]">
          精选默认 selected。只有明确要全部才用 all。关键词搜精选为空时，客户端应再用相同参数打 all。
        </p>
      </section>

      <section className="space-y-2 text-sm text-[var(--muted)] leading-relaxed">
        <h2 className="display text-xl font-semibold text-[var(--text)]">许可</h2>
        <p>
          AIHOT Skill 是 MIT；AIHOT 数据适用{" "}
          <a href="https://aihot.virxact.com/terms" className="text-[var(--signal)] hover:underline">
            公开使用规则
          </a>
          。本页演示属于个人非商业。对外商业产品、公开镜像或数据转售需 AIHOT 书面授权。
        </p>
      </section>
    </div>
  );
}
