"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { draftEmailAction, refineEmailDraftAction } from "@/app/cold-email/actions";
import type { EmailDraft, EmailDraftChatMessage } from "@/lib/db/types";
import { Copy, Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export function EmailDraftsCard({
  contactId,
  drafts,
  chatMessages,
}: {
  contactId: number;
  drafts: EmailDraft[];
  chatMessages: EmailDraftChatMessage[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [messages, setMessages] = useState<ChatTurn[]>(
    chatMessages.map((m) => ({ role: m.role, content: m.content }))
  );
  const [refineDraft, setRefineDraft] = useState("");
  const [isRefining, startRefine] = useTransition();

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

  function send() {
    const text = refineDraft.trim();
    if (!text || isRefining) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setRefineDraft("");

    startRefine(async () => {
      const result = await refineEmailDraftAction(contactId, text);
      const noteText = result.ok ? result.note : result.error;
      if (noteText) {
        setMessages((prev) => [...prev, { role: "assistant", content: noteText }]);
      }
      if (result.ok) {
        toast.success(result.note ?? "New draft version ready.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Refine failed.");
      }
    });
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
      <CardContent className="space-y-4">
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

        {drafts.length > 0 && (
          <div className="rounded-lg border">
            <div className="border-b px-3 py-2">
              <p className="text-sm font-medium">Refine this draft</p>
              <p className="text-xs text-muted-foreground">
                Add context, request an edit, or paste a reference email or URL. Each
                refinement creates a new version above.
              </p>
            </div>

            {messages.length > 0 && (
              <ScrollArea className="max-h-48 border-b">
                <div className="flex flex-col gap-2 p-3">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        "max-w-[85%] rounded-lg px-2.5 py-1.5 text-sm",
                        m.role === "user"
                          ? "self-end bg-primary text-primary-foreground"
                          : "self-start bg-muted text-muted-foreground"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  ))}
                  {isRefining && (
                    <p className="self-start text-sm text-muted-foreground">Refining…</p>
                  )}
                </div>
              </ScrollArea>
            )}

            <div className="flex items-end gap-2 p-3">
              <Textarea
                value={refineDraft}
                onChange={(e) => setRefineDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="e.g. 'make it shorter', paste a reference email, or paste a URL..."
                className="max-h-32 min-h-9"
                disabled={isRefining}
              />
              <Button size="icon" disabled={isRefining || !refineDraft.trim()} onClick={send}>
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
