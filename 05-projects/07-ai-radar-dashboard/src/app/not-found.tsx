import Link from "next/link";
import { redirect } from "next/navigation";

/**
 * 兜底：任何未匹配路径（包括被误拼的中文路径）都直接回到精选界面，
 * 避免出现 "This page could not be found"。
 */
export default function NotFound() {
  redirect("/");
  return (
    <div className="page-main space-y-4 py-24 text-center">
      <p className="text-sm text-[var(--muted)]">正在回到精选界面…</p>
      <Link href="/" className="btn btn-primary inline-flex">
        回到精选
      </Link>
    </div>
  );
}
