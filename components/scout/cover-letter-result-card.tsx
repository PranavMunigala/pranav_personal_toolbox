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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MarkdownView } from "@/components/markdown-view";
import { draftCoverLetterAction, refineCoverLetterDraftAction } from "@/app/scout/actions";
import type {
  CoverLetterDraft,
  CoverLetterChatMessage,
  CoverLetterResearchSource,
} from "@/lib/db/types";
import { Copy, Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export function CoverLetterResultCard({
  sessionId,
  drafts,
  chatMessages,
}: {
  sessionId: number;
  drafts: CoverLetterDraft[];
  chatMessages: CoverLetterChatMessage[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [researchEnabled, setResearchEnabled] = useState(true);
  const [extraContext, setExtraContext] = useState("");
  const [messages, setMessages] = useState<ChatTurn[]>(
    chatMessages.map((m) => ({ role: m.role, content: m.content }))
  );
  const [refineText, setRefineText] = useState("");
  const [isRefining, startRefine] = useTransition();

  function write() {
    startTransition(async () => {
      const result = await draftCoverLetterAction(
        sessionId,
        researchEnabled,
        extraContext || undefined
      );
      if (!result.ok) toast.error(result.message);
      else toast.success(result.message);
      router.refresh();
    });
  }

  function copy(d: CoverLetterDraft) {
    navigator.clipboard.writeText(d.cover_letter_markdown);
    toast.success("Copied to clipboard.");
  }

  function send() {
    const text = refineText.trim();
    if (!text || isRefining) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setRefineText("");

    startRefine(async () => {
      const result = await refineCoverLetterDraftAction(sessionId, text);
      const noteText = result.ok ? result.note : result.error;
      if (noteText) {
        setMessages((prev) => [...prev, { role: "assistant", content: noteText }]);
      }
      if (result.ok) {
        toast.success(result.note ?? "New cover letter version ready.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Refine failed.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cover letter</CardTitle>
        <CardDescription>
          Grounded in sourced company research, never generic template filler.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="research-enabled"
              checked={researchEnabled}
              onCheckedChange={(checked) => setResearchEnabled(checked === true)}
            />
            <Label htmlFor="research-enabled" className="text-sm font-normal">
              Research the company first
            </Label>
          </div>
          <Textarea
            rows={2}
            value={extraContext}
            onChange={(e) => setExtraContext(e.target.value)}
            placeholder="Extra context/instructions, e.g. 'mention I'd love to work on the platform team', 'keep it under 300 words'..."
          />
          <div className="flex justify-end">
            <Button size="sm" disabled={isPending} onClick={write}>
              <Sparkles className="size-3.5" />
              {isPending ? "Writing..." : drafts.length ? "Rewrite" : "Write cover letter"}
            </Button>
          </div>
        </div>

        {drafts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cover letter yet.</p>
        ) : (
          <div className="space-y-3">
            {drafts.map((d, i) => (
              <div key={d.id} className="rounded-lg border p-3 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(d.created_at).toLocaleString()}
                      {i === 0 ? " · latest" : ""}
                    </p>
                    <Badge variant="secondary">{d.word_count} words</Badge>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copy(d)}>
                    <Copy className="size-3.5" />
                    Copy
                  </Button>
                </div>
                <MarkdownView content={d.cover_letter_markdown} />
                <SourcesView sources={JSON.parse(d.research_sources) as CoverLetterResearchSource[]} />
              </div>
            ))}
          </div>
        )}

        {drafts.length > 0 && (
          <div className="rounded-lg border">
            <div className="border-b px-3 py-2">
              <p className="text-sm font-medium">Refine this draft</p>
              <p className="text-xs text-muted-foreground">
                Add context, request an edit, or paste a reference letter or URL. Each
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
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="e.g. 'more concise', paste a reference letter, or paste a URL..."
                className="max-h-32 min-h-9"
                disabled={isRefining}
              />
              <Button size="icon" disabled={isRefining || !refineText.trim()} onClick={send}>
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SourcesView({ sources }: { sources: CoverLetterResearchSource[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="space-y-1.5 border-t pt-3">
      <p className="text-xs font-medium text-muted-foreground">Sources</p>
      <div className="space-y-1">
        {sources.map((s, i) => (
          <p key={i} className="text-xs">
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline break-all"
            >
              {s.url}
            </a>
            {s.note ? <span className="text-muted-foreground"> — {s.note}</span> : null}
          </p>
        ))}
      </div>
    </div>
  );
}
