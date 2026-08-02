import { listApplications } from "@/lib/db/applications";
import { listContacts } from "@/lib/db/contacts";
import { listTargetCompanies } from "@/lib/db/targetCompanies";
import { getPreferences } from "@/lib/db/preferences";
import { listSuggestedApplications, latestBatchDate } from "@/lib/db/suggestedApplications";
import { getInternshipFilterSettings } from "@/lib/db/internshipFilterSettings";
import { getInternshipRateLimitStatus } from "@/lib/discovery/runInternshipSearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplicationsTable } from "@/components/internships/applications-table";
import { AddApplicationDialog } from "@/components/internships/add-application-dialog";
import { TargetCompaniesCard } from "@/components/internships/target-companies-card";
import { RunInternshipSearchCard } from "@/components/internships/run-internship-search-card";
import { DailyInternshipRefreshCard } from "@/components/internships/daily-internship-refresh-card";
import { SuggestedApplicationsCard } from "@/components/internships/suggested-applications-card";
import { FilterSettingsCard } from "@/components/internships/filter-settings-card";
import type { Contact } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export default function InternshipsPage() {
  const applications = listApplications();
  const contacts = listContacts();
  const targetCompanies = listTargetCompanies();
  const preferences = getPreferences();
  const suggestions = listSuggestedApplications();
  const suggestionsBatchDate = latestBatchDate();
  const rateLimit = getInternshipRateLimitStatus(preferences.last_internship_refresh_at);
  const filterSettings = getInternshipFilterSettings();

  // Only coffee-chatted contacts are worth surfacing as "people you know" at a company —
  // matching every not_contacted contact by company name was noisy and not useful.
  const contactsByCompany: Record<string, Contact[]> = {};
  const closeConnectionsByCompany: Record<string, Contact[]> = {};
  for (const c of contacts) {
    if (!c.company) continue;
    const key = c.company.toLowerCase();
    if (c.status === "coffee_chatted") (contactsByCompany[key] ??= []).push(c);
    if (c.is_close_connection) (closeConnectionsByCompany[key] ??= []).push(c);
  }

  const stats = {
    total: applications.length,
    active: applications.filter((a) =>
      ["applied", "oa", "interview", "follow_up"].includes(a.status)
    ).length,
    interviewing: applications.filter((a) => a.status === "interview").length,
    offers: applications.filter((a) => a.status === "offer").length,
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Internship Tracker</h1>
          <p className="text-muted-foreground mt-1">
            Track applications, auto-search for new postings, and see who you already
            know at each company.
          </p>
        </div>
        <AddApplicationDialog />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile label="Total applications" value={stats.total} />
        <StatTile label="Active" value={stats.active} />
        <StatTile label="Interviewing" value={stats.interviewing} />
        <StatTile label="Offers" value={stats.offers} />
      </div>

      <Tabs defaultValue="search">
        <TabsList>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-8 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <RunInternshipSearchCard />
            <DailyInternshipRefreshCard
              isRateLimited={rateLimit.isRateLimited}
              nextAvailableLabel={rateLimit.nextAvailableLabel}
            />
          </div>

          <SuggestedApplicationsCard suggestions={suggestions} batchDate={suggestionsBatchDate} />

          <ApplicationsTable
            applications={applications}
            contactsByCompany={contactsByCompany}
            closeConnectionsByCompany={closeConnectionsByCompany}
          />

          <TargetCompaniesCard companies={targetCompanies} />
        </TabsContent>

        <TabsContent value="filters" className="pt-4">
          <FilterSettingsCard settings={filterSettings} />
        </TabsContent>
      </Tabs>
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
