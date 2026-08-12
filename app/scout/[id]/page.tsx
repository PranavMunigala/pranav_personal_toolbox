import { notFound } from "next/navigation";
import Link from "next/link";
import { getScoutSession } from "@/lib/db/scoutSessions";
import { listResumeDraftsForSession } from "@/lib/db/resumeDrafts";
import { listResumeDraftChatMessages } from "@/lib/db/resumeDraftChat";
import { listCoverLetterDraftsForSession } from "@/lib/db/coverLetterDrafts";
import { listCoverLetterChatMessages } from "@/lib/db/coverLetterChat";
import { ResumeResultCard } from "@/components/scout/resume-result-card";
import { CoverLetterResultCard } from "@/components/scout/cover-letter-result-card";
import { ArrowLeft, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ScoutSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = getScoutSession(Number(id));
  if (!session) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/scout"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" />
          Back to Scout
        </Link>
        {session.job_posting_url && (
          <a
            href={session.job_posting_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
          >
            View posting
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>

      <div>
        <h1 className="text-xl font-semibold">
          {session.company} — {session.role}
        </h1>
      </div>

      <ResumeResultCard
        sessionId={session.id}
        drafts={listResumeDraftsForSession(session.id)}
        chatMessages={listResumeDraftChatMessages(session.id)}
      />

      <CoverLetterResultCard
        sessionId={session.id}
        drafts={listCoverLetterDraftsForSession(session.id)}
        chatMessages={listCoverLetterChatMessages(session.id)}
      />
    </div>
  );
}
