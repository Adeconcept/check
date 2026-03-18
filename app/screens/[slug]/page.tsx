import { notFound } from "next/navigation";
import { CheckyScreen, getScreenDefinitions, isValidMode } from "@/components/checky-ui";

export function generateStaticParams() {
  return getScreenDefinitions()
    .filter((definition) => definition.slug)
    .map((definition) => ({ slug: definition.slug }));
}

export default async function ScreenPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isValidMode(slug)) {
    notFound();
  }

  return <CheckyScreen mode={slug} />;
}
