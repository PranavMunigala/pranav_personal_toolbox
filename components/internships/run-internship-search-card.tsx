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
import { runInternshipSearchAction } from "@/app/internships/actions";
import { Search } from "lucide-react";

export function RunInternshipSearchCard() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");

  function run() {
    startTransition(async () => {
      const result = await runInternshipSearchAction(query.trim() || undefined);
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
        <CardTitle>Run internship search</CardTitle>
        <CardDescription>
          On-demand browsing — find more to apply to. Leave blank for a broad search
          ranked by your resume fit, or type what you want (e.g. &quot;data
          intern&quot;). Always searches broadly (not limited to target companies),
          starting with GitHub internship-tracking repos and a general web search,
          then escalating to more job boards (ZipRecruiter, Jobright.ai, LinkedIn,
          Indeed, WayUp) and niche biomedical sources only if that first pass
          doesn&apos;t turn up enough matches. Same hardcoded filters and live verification as
          always — 5 results per run, run as many times as you want.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={2}
          placeholder="Optional — leave blank for a broad, resume-ranked search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isPending}
        />
        <Button size="sm" disabled={isPending} onClick={run}>
          <Search className="size-3.5" />
          {isPending ? "Searching..." : "Run Internship Search"}
        </Button>
      </CardContent>
    </Card>
  );
}
