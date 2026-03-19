import { notFound } from "next/navigation";
import { CheckyScreen, getScreenDefinitions, isValidMode } from "@/components/checky-ui";

export function generateStaticParams() {
  return getScreenDefinitions()
    .filter((definition) => definition.slug)
    .map((definition) => ({ slug: definition.slug }));
}

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
