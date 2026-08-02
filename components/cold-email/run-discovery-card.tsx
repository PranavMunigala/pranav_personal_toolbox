"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { runContactDiscoveryAction } from "@/app/cold-email/actions";
import { Search } from "lucide-react";

export function RunDiscoveryCard() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");

  function run() {
    startTransition(async () => {
      const result = await runContactDiscoveryAction(query.trim() || undefined);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setQuery("");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run contact discovery</CardTitle>
        <CardDescription>
          For specific searches — describe who you&apos;re looking for this run (e.g.
          &quot;Rutgers alumni doing ML in biotech, not recruiters&quot;). Searches the web for up
          to 3 new people matching that plus your resume/preferences above. Run as many
          times as you want — results land in Suggested contacts below for you to
          review; nothing is added to your tracker automatically. A run can take
          10–30 seconds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={2}
          placeholder='e.g. "Rutgers alumni doing ML in biotech, not recruiters"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isPending}
        />
        <Button size="sm" disabled={isPending} onClick={run}>
          <Search className="size-3.5" />
          {isPending ? "Searching..." : "Run Contact Discovery"}
        </Button>
      </CardContent>
    </Card>
  );
}
