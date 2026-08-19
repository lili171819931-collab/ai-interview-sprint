import { FeedPageView } from "@/components/intel/FeedPageView";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI动态",
};

export default async function AllFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string; category?: string; q?: string }>;
}) {
  const sp = await searchParams;
  return <FeedPageView mode="all" searchParams={sp} />;
}
