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
import { runDailyDiscoveryAction } from "@/app/cold-email/actions";
import { Calendar } from "lucide-react";

export function DailyDiscoveryCard({
  isRateLimited,
  nextAvailableLabel,
}: {
  isRateLimited: boolean;
  nextAvailableLabel: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await runDailyDiscoveryAction();
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
        <CardTitle>Daily discovery</CardTitle>
        <CardDescription>
          A broader, general sweep off your resume and preferences alone (no custom
          query) — up to 5 new people. Limited to once a day to keep search costs in
          check; use &quot;Run contact discovery&quot; above for specific searches,
          which has no daily limit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" disabled={isPending || isRateLimited} onClick={run}>
            <Calendar className="size-3.5" />
            {isPending ? "Searching..." : "Run Daily Discovery"}
          </Button>
          {isRateLimited && (
            <p className="text-xs text-muted-foreground">
              Already ran today — next run available {nextAvailableLabel}.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
