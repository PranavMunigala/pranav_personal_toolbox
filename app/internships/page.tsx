import { listApplications } from "@/lib/db/applications";
import { listContacts } from "@/lib/db/contacts";
import { listTargetCompanies } from "@/lib/db/targetCompanies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationsTable } from "@/components/internships/applications-table";
import { AddApplicationDialog } from "@/components/internships/add-application-dialog";
import { TargetCompaniesCard } from "@/components/internships/target-companies-card";

export const dynamic = "force-dynamic";
import type { Contact } from "@/lib/db/types";

export default function InternshipsPage() {
  const applications = listApplications();
  const contacts = listContacts();
  const targetCompanies = listTargetCompanies();

  const contactsByCompany: Record<string, Contact[]> = {};
  for (const c of contacts) {
    if (!c.company) continue;
    const key = c.company.toLowerCase();
    (contactsByCompany[key] ??= []).push(c);
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

      <ApplicationsTable applications={applications} contactsByCompany={contactsByCompany} />

      <TargetCompaniesCard companies={targetCompanies} />
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
