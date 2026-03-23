import { CheckyScreen } from "@/components/checky-ui";

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;

  return <CheckyScreen mode="home" searchParams={resolvedSearchParams} />;
}
