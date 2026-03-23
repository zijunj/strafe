import MatchDetailClient from "./MatchDetailClient";

export default async function MatchDetailPage(props: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id, slug } = await props.params;

  return <MatchDetailClient id={id} slug={slug} />;
}
