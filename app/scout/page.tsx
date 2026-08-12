import Link from "next/link";
import { getApplication } from "@/lib/db/applications";
import { listScoutSessions } from "@/lib/db/scoutSessions";
import { ScoutIntakeForm } from "@/components/scout/scout-intake-form";

export const dynamic = "force-dynamic";

export default async function ScoutPage({
  searchParams,
}: {
  searchParams: Promise<{ applicationId?: string }>;
}) {
  const { applicationId } = await searchParams;
  const application = applicationId ? getApplication(Number(applicationId)) : undefined;
  const sessions = listScoutSessions();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Scout</h1>
        <p className="text-muted-foreground mt-1">
          Tailor your resume and draft a cover letter for a specific job posting.
        </p>
      </div>

      <ScoutIntakeForm
        prefill={
          application
            ? {
                applicationId: application.id,
                company: application.company,
                role: application.role,
                link: application.link ?? "",
              }
            : undefined
        }
      />

      {sessions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Recent sessions</h2>
          <div className="space-y-2">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/scout/${s.id}`}
                className="block rounded-lg border p-3 text-sm hover:bg-muted transition-colors"
              >
                <span className="font-medium">{s.company}</span> — {s.role}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
