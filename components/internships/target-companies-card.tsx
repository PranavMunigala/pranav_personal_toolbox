import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CommuteTierBadge } from "./application-status-badge";
import type { TargetCompany, CommuteTier } from "@/lib/db/types";

const TIER_ORDER: CommuteTier[] = ["under_30", "30_45", "45_60", "60_75"];

export function TargetCompaniesCard({ companies }: { companies: TargetCompany[] }) {
  const byTier = TIER_ORDER.map((tier) => ({
    tier,
    companies: companies.filter((c) => c.commute_tier === tier),
  })).filter((g) => g.companies.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Target companies</CardTitle>
        <CardDescription>
          Fixed list the internship-search skill checks daily, grouped by commute tier.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {byTier.map(({ tier, companies }) => (
          <div key={tier} className="space-y-2">
            <CommuteTierBadge tier={tier} />
            <div className="grid sm:grid-cols-2 gap-2">
              {companies.map((c) => (
                <div key={c.id} className="rounded-md border px-3 py-2 text-sm">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-muted-foreground text-xs">{c.location}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
