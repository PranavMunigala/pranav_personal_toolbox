"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  promoteSuggestedApplicationAction,
  dismissSuggestedApplicationAction,
} from "@/app/internships/actions";
import type { SuggestedApplication } from "@/lib/db/types";
import { Check, ExternalLink, X } from "lucide-react";

export function SuggestedApplicationsCard({
  suggestions,
  batchDate,
}: {
  suggestions: SuggestedApplication[];
  batchDate: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function add(id: number) {
    startTransition(async () => {
      const result = await promoteSuggestedApplicationAction(id);
      if (!result.ok) toast.error(result.message);
      else toast.success(result.message);
    });
  }

  function dismiss(id: number) {
    startTransition(async () => {
      const result = await dismissSuggestedApplicationAction(id);
      if (!result.ok) toast.error(result.message);
      else toast.success(result.message);
    });
  }

  const fullMatches = suggestions.filter((s) => !s.filter_failures);
  const nearMisses = suggestions.filter((s) => s.filter_failures);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Suggested postings{batchDate ? ` — ${batchDate}` : ""}</CardTitle>
          <CardDescription>
            Postings found by internship search, matched against your resume and
            preferences. Review before adding — nothing here is tracked automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fullMatches.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No new suggested postings yet. Use the search cards above to find some.
            </p>
          ) : (
            <div className="space-y-3">
              {fullMatches.map((s) => (
                <SuggestionRow
                  key={s.id}
                  suggestion={s}
                  isPending={isPending}
                  onAdd={add}
                  onDismiss={dismiss}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {nearMisses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Didn&apos;t fully match — review</CardTitle>
            <CardDescription>
              Failed one or more enabled filters but is still a confirmed-live posting.
              Add anyway if it&apos;s worth it, or dismiss.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nearMisses.map((s) => (
                <SuggestionRow
                  key={s.id}
                  suggestion={s}
                  isPending={isPending}
                  onAdd={add}
                  onDismiss={dismiss}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SuggestionRow({
  suggestion: s,
  isPending,
  onAdd,
  onDismiss,
}: {
  suggestion: SuggestedApplication;
  isPending: boolean;
  onAdd: (id: number) => void;
  onDismiss: (id: number) => void;
}) {
  const failures = s.filter_failures ? (JSON.parse(s.filter_failures) as string[]) : [];
  return (
    <div className="rounded-lg border p-3 flex items-start justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 font-medium">
          {s.company} — {s.role}
          {s.link && (
            <a
              href={s.link}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{s.location || "—"}</p>
        {s.match_reasons && (
          <p className="text-xs text-muted-foreground italic">{s.match_reasons}</p>
        )}
        {failures.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {failures.map((reason, i) => (
              <Badge key={i} variant="destructive">
                {reason}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        <Button size="sm" disabled={isPending} onClick={() => onAdd(s.id)}>
          <Check className="size-3.5" />
          Add
        </Button>
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => onDismiss(s.id)}>
          <X className="size-3.5" />
          Dismiss
        </Button>
      </div>
    </div>
  );
}
