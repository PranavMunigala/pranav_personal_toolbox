import { listContacts, type ContactFilters } from "@/lib/db/contacts";
import { getPreferences } from "@/lib/db/preferences";
import { getDiscoveryPreferences } from "@/lib/db/discoveryPreferences";
import { getResume } from "@/lib/db/resume";
import { listSuggestedContacts, latestBatchDate } from "@/lib/db/suggestedContacts";
import { SuggestedContactsCard } from "@/components/cold-email/suggested-contacts-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactTable } from "@/components/cold-email/contact-table";
import { ContactFilterBar } from "@/components/cold-email/contact-filter-bar";
import { AddContactDialog } from "@/components/cold-email/add-contact-dialog";
import { PreferencesCard } from "@/components/cold-email/preferences-card";
import { ResumeCard } from "@/components/cold-email/resume-card";
import { DiscoveryPreferencesCard } from "@/components/cold-email/discovery-preferences-card";
import type { ConnectionStatus, ContactStatus, SeniorityTier } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export default async function ColdEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters: ContactFilters = {
    status: params.status as ContactStatus | undefined,
    company: params.company,
    seniority_tier: params.seniority_tier as SeniorityTier | undefined,
    connection_status: params.connection_status as ConnectionStatus | undefined,
    is_recruiter: params.is_recruiter === "true" ? true : undefined,
    alma_mater: params.alma_mater,
    industry_tag: params.industry_tag,
  };

  const allContacts = listContacts();
  const contacts = listContacts(filters);
  const preferences = getPreferences();
  const discoveryPreferences = getDiscoveryPreferences();
  const resume = getResume();
  const suggestions = listSuggestedContacts();
  const suggestionsBatchDate = latestBatchDate();

  const allIndustryTags = Array.from(
    new Set(allContacts.flatMap((c) => JSON.parse(c.industry_tags) as string[]))
  ).sort();

  const stats = {
    total: allContacts.length,
    sent: allContacts.filter((c) => c.status === "sent").length,
    coffeeChatted: allContacts.filter((c) => c.status === "coffee_chatted").length,
    noResponse: allContacts.filter((c) => c.status === "no_response").length,
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cold Email Tracker</h1>
          <p className="text-muted-foreground mt-1">
            Track outreach, draft seniority-calibrated emails, never re-email the same
            person twice.
          </p>
        </div>
        <AddContactDialog />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile label="Total contacts" value={stats.total} />
        <StatTile label="Sent" value={stats.sent} />
        <StatTile label="Coffee chatted" value={stats.coffeeChatted} />
        <StatTile label="No response" value={stats.noResponse} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PreferencesCard
          industries={JSON.parse(preferences.industries)}
          roles={JSON.parse(preferences.roles)}
          seniorityFocus={JSON.parse(preferences.seniority_focus)}
        />
        <DiscoveryPreferencesCard
          targetSchools={JSON.parse(discoveryPreferences.target_schools)}
          requireConnection={discoveryPreferences.require_connection}
          excludeRecruiters={Boolean(discoveryPreferences.exclude_recruiters)}
        />
      </div>

      <ResumeCard
        filename={resume?.filename ?? null}
        uploadedAt={resume?.uploaded_at ?? null}
        keywordCount={resume ? (JSON.parse(resume.keywords) as string[]).length : 0}
      />

      <SuggestedContactsCard suggestions={suggestions} batchDate={suggestionsBatchDate} />

      <ContactFilterBar allIndustryTags={allIndustryTags} />

      <ContactTable contacts={contacts} />
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}
