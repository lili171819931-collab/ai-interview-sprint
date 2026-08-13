import { FeedPageView } from "@/components/intel/FeedPageView";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string; category?: string; q?: string }>;
}) {
  const sp = await searchParams;
  return <FeedPageView mode="selected" searchParams={sp} />;
}
