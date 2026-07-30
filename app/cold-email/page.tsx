import { listContacts } from "@/lib/db/contacts";
import { getPreferences } from "@/lib/db/preferences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactTable } from "@/components/cold-email/contact-table";
import { AddContactDialog } from "@/components/cold-email/add-contact-dialog";
import { PreferencesCard } from "@/components/cold-email/preferences-card";

export const dynamic = "force-dynamic";

export default function ColdEmailPage() {
  const contacts = listContacts();
  const preferences = getPreferences();

  const stats = {
    total: contacts.length,
    sent: contacts.filter((c) => c.status === "sent").length,
    coffeeChatted: contacts.filter((c) => c.status === "coffee_chatted").length,
    noResponse: contacts.filter((c) => c.status === "no_response").length,
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

      <PreferencesCard
        industries={JSON.parse(preferences.industries)}
        roles={JSON.parse(preferences.roles)}
        seniorityFocus={JSON.parse(preferences.seniority_focus)}
      />

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
