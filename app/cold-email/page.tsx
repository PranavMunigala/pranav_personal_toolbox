import { listContacts, applyNoResponseAging } from "@/lib/db/contacts";
import { getPreferences } from "@/lib/db/preferences";
import { getDiscoveryPreferences } from "@/lib/db/discoveryPreferences";
import { listSuggestedContacts, latestBatchDate } from "@/lib/db/suggestedContacts";
import { SuggestedContactsCard } from "@/components/cold-email/suggested-contacts-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactTable } from "@/components/cold-email/contact-table";
import { AddContactDialog } from "@/components/cold-email/add-contact-dialog";
import { PreferencesCard } from "@/components/cold-email/preferences-card";
import { DiscoveryPreferencesCard } from "@/components/cold-email/discovery-preferences-card";
import { RunDiscoveryCard } from "@/components/cold-email/run-discovery-card";
import { DailyDiscoveryCard } from "@/components/cold-email/daily-discovery-card";
import { EnrichContactsCard } from "@/components/cold-email/enrich-contacts-card";
import { getDiscoveryRateLimitStatus } from "@/lib/discovery/runContactDiscovery";

export const dynamic = "force-dynamic";

export default async function ColdEmailPage() {
  applyNoResponseAging();

  const allContacts = listContacts();
  const preferences = getPreferences();
  const discoveryPreferences = getDiscoveryPreferences();
  const suggestions = listSuggestedContacts();
  const suggestionsBatchDate = latestBatchDate();

  const discoveryRateLimit = getDiscoveryRateLimitStatus(discoveryPreferences.last_discovery_run_at);

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

      <Card>
        <CardHeader>
          <CardTitle>How this page works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1.5">
          <p>
            <strong className="text-foreground">1. Set preferences and discovery filters</strong> —
            target industries/roles, schools, connection requirements, and any standing
            context you want every discovery run to consider.
          </p>
          <p>
            <strong className="text-foreground">2. Run discovery</strong> — &quot;Run
            contact discovery&quot; below is for specific searches (describe who you
            want, run as often as you like, up to 3 results each time);
            &quot;Daily discovery&quot; is a broader general sweep off your
            preferences and existing contacts alone, limited to once a day, up to 5
            results. Both write candidates to Suggested contacts for review — neither
            adds anyone to your tracker automatically.
          </p>
          <p>
            <strong className="text-foreground">3. Review suggestions</strong> — each one shows
            their LinkedIn link, company/title, and a short note on why they matched. Add
            promotes them to your tracker (through the same dedup guard as everywhere else)
            and automatically drafts an outreach email for them; Dismiss discards them.
          </p>
          <p>
            <strong className="text-foreground">4. Track outreach</strong> — the table below
            lists every contact and its status (contacts sitting in &quot;sent&quot; for 30+
            days with no reply automatically move to &quot;no response&quot; and are hidden
            from the table by default); use the keyword search to narrow it down, and click
            a row to edit details or view/draft an email.
          </p>
        </CardContent>
      </Card>

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
          notes={discoveryPreferences.notes}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <RunDiscoveryCard />
        <DailyDiscoveryCard
          isRateLimited={discoveryRateLimit.isRateLimited}
          nextAvailableLabel={discoveryRateLimit.nextAvailableLabel}
        />
      </div>

      <SuggestedContactsCard suggestions={suggestions} batchDate={suggestionsBatchDate} />

      <EnrichContactsCard />

      <ContactTable contacts={allContacts} />
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
