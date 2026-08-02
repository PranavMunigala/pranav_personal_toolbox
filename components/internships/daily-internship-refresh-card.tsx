"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { runDailyInternshipRefreshAction } from "@/app/internships/actions";
import { Calendar } from "lucide-react";

export function DailyInternshipRefreshCard({
  isRateLimited,
  nextAvailableLabel,
}: {
  isRateLimited: boolean;
  nextAvailableLabel: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await runDailyInternshipRefreshAction();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily suggested postings</CardTitle>
        <CardDescription>
          Passive refresh — checks only your target companies for new postings, using
          the same hardcoded filters and live verification. Returns nothing if there
          isn&apos;t anything new from target companies (never backfills with other
          postings). Limited to once a day.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" disabled={isPending || isRateLimited} onClick={run}>
            <Calendar className="size-3.5" />
            {isPending ? "Searching..." : "Refresh Today's Matches"}
          </Button>
          {isRateLimited && (
            <p className="text-xs text-muted-foreground">
              Already refreshed today — next refresh available {nextAvailableLabel}.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
