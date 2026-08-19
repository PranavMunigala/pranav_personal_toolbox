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
import { runStartupDiscoveryAction } from "@/app/cold-email/actions";
import { Rocket } from "lucide-react";

export function RunStartupDiscoveryCard() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");

  function run() {
    startTransition(async () => {
      const result = await runStartupDiscoveryAction(query.trim() || undefined);
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
        <CardTitle>Run startup discovery</CardTitle>
        <CardDescription>
          Company-first: searches for early-stage startups in your target fields, then
          finds people who actually work there — cross-checking Rutgers alumni as one
          signal, never a filter. Optionally narrow this run (e.g. &quot;medical device
          startups, not health insurance&quot;). Run as many times as you want — up to
          5 new people land in Suggested contacts below for you to review. A run can
          take 20–40 seconds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={2}
          placeholder='e.g. "medical device startups, not health insurance"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isPending}
        />
        <Button size="sm" disabled={isPending} onClick={run}>
          <Rocket className="size-3.5" />
          {isPending ? "Searching..." : "Run Startup Discovery"}
        </Button>
      </CardContent>
    </Card>
  );
}
