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
import {
  promoteSuggestedContactAction,
  dismissSuggestedContactAction,
} from "@/app/cold-email/actions";
import type { SuggestedContact } from "@/lib/db/types";
import { Check, ExternalLink, X } from "lucide-react";

export function SuggestedContactsCard({
  suggestions,
  batchDate,
}: {
  suggestions: SuggestedContact[];
  batchDate: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function add(id: number) {
    startTransition(async () => {
      const result = await promoteSuggestedContactAction(id);
      if (!result.ok) toast.error(result.message);
      else toast.success(result.message);
    });
  }

  function dismiss(id: number) {
    startTransition(async () => {
      const result = await dismissSuggestedContactAction(id);
      if (!result.ok) toast.error(result.message);
      else toast.success(result.message);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suggested contacts{batchDate ? ` — ${batchDate}` : ""}</CardTitle>
        <CardDescription>
          Candidates found by the contact-discovery skill, matched against your
          targeting preferences and existing contacts. Review before adding — nothing here is emailed
          automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No new suggested contacts yet. Use &quot;Run contact discovery&quot; above to find some.
          </p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border p-3 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    {s.name}
                    {s.linkedin_url && (
                      <a
                        href={s.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {[s.title, s.company].filter(Boolean).join(" @ ") || "—"}
                  </p>
                  {s.match_reasons && (
                    <p className="text-xs text-muted-foreground italic">{s.match_reasons}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" disabled={isPending} onClick={() => add(s.id)}>
                    <Check className="size-3.5" />
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => dismiss(s.id)}
                  >
                    <X className="size-3.5" />
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
