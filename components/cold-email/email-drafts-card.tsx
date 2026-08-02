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
import { draftEmailAction } from "@/app/cold-email/actions";
import type { EmailDraft } from "@/lib/db/types";
import { Copy, Sparkles } from "lucide-react";

export function EmailDraftsCard({
  contactId,
  drafts,
}: {
  contactId: number;
  drafts: EmailDraft[];
}) {
  const [isPending, startTransition] = useTransition();

  function draft() {
    startTransition(async () => {
      const result = await draftEmailAction(contactId);
      if (!result.ok) toast.error(result.message);
      else toast.success(result.message);
    });
  }

  function copy(d: EmailDraft) {
    const text = d.subject ? `Subject: ${d.subject}\n\n${d.body}` : d.body;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard.");
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Email drafts</CardTitle>
          <CardDescription>
            Draft-only — never sent automatically. Copy into Gmail yourself, then mark
            the contact as sent.
          </CardDescription>
        </div>
        <Button size="sm" disabled={isPending} onClick={draft}>
          <Sparkles className="size-3.5" />
          {isPending ? "Drafting..." : drafts.length ? "Redraft" : "Draft email"}
        </Button>
      </CardHeader>
      <CardContent>
        {drafts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No drafts yet.</p>
        ) : (
          <div className="space-y-3">
            {drafts.map((d) => (
              <div key={d.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {d.subject && <p className="font-medium text-sm">{d.subject}</p>}
                    <p className="text-xs text-muted-foreground">
                      {new Date(d.created_at).toLocaleString()} · {d.seniority_tier_used} tier
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copy(d)}>
                    <Copy className="size-3.5" />
                    Copy
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap">{d.body}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
