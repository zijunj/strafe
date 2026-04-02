import { redirect } from "next/navigation";
import TournamentDetailClient from "./TournamentDetailClient";
import {
  getTournamentDetailByVlrEventId,
  getTournamentSlug,
} from "@/lib/tournaments/detail";

export default async function TournamentDetailPage(props: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id, slug } = await props.params;
  const vlrEventId = Number(id);

  if (Number.isFinite(vlrEventId)) {
    const detail = await getTournamentDetailByVlrEventId(vlrEventId);

    if (detail) {
      const canonicalSlug = getTournamentSlug(
        detail.event.urlPath,
        detail.event.title
      );

      if (slug !== canonicalSlug) {
        redirect(`/tournaments/${id}/${canonicalSlug}`);
      }
    }
  }

  return <TournamentDetailClient id={id} slug={slug} />;
}
