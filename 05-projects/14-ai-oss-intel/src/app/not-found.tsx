import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="panel p-16 text-center space-y-4">
      <Compass size={40} className="mx-auto text-[#33415e]" />
      <h1 className="text-2xl font-bold text-white">404 · 页面不存在</h1>
      <p className="text-[13px] text-[#5b6885]">这个项目或页面不在雷达范围内</p>
      <Link href="/" className="inline-block mt-2 h-9 px-4 rounded-lg bg-[#1a2a4a] border border-[#2c4370] text-[12.5px] text-white flex items-center gap-1.5 w-fit mx-auto">返回 Dashboard</Link>
    </div>
  );
}
