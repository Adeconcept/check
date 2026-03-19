import { notFound } from "next/navigation";
import { CheckyScreen, isValidMode } from "@/components/checky-ui";

export const dynamic = "force-dynamic";

export default async function ScreenPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isValidMode(slug)) {
    notFound();
  }

  return <CheckyScreen mode={slug} searchParams={resolvedSearchParams} />;
}
