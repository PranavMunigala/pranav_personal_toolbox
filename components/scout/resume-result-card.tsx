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
import { MarkdownView } from "@/components/markdown-view";
import { tailorResumeAction, refineResumeDraftAction } from "@/app/scout/actions";
import type { ResumeDraft, ResumeDraftChatMessage, GapAnalysis } from "@/lib/db/types";
import { Copy, Sparkles, Send, Check, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export function ResumeResultCard({
  sessionId,
  drafts,
  chatMessages,
}: {
  sessionId: number;
  drafts: ResumeDraft[];
  chatMessages: ResumeDraftChatMessage[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [messages, setMessages] = useState<ChatTurn[]>(
    chatMessages.map((m) => ({ role: m.role, content: m.content }))
  );
  const [refineText, setRefineText] = useState("");
  const [isRefining, startRefine] = useTransition();

  function tailor() {
    startTransition(async () => {
      const result = await tailorResumeAction(sessionId);
      if (!result.ok) toast.error(result.message);
      else toast.success(result.message);
      router.refresh();
    });
  }

  function copy(d: ResumeDraft) {
    navigator.clipboard.writeText(d.tailored_resume_markdown);
    toast.success("Copied to clipboard.");
  }

  function send() {
    const text = refineText.trim();
    if (!text || isRefining) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setRefineText("");

    startRefine(async () => {
      const result = await refineResumeDraftAction(sessionId, text);
      const noteText = result.ok ? result.note : result.error;
      if (noteText) {
        setMessages((prev) => [...prev, { role: "assistant", content: noteText }]);
      }
      if (result.ok) {
        toast.success(result.note ?? "New resume version ready.");
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
          <CardTitle>Tailored resume</CardTitle>
          <CardDescription>
            Preserves your resume&apos;s format. Never invents experience — only pulls
            from what you pasted in.
          </CardDescription>
        </div>
        <Button size="sm" disabled={isPending} onClick={tailor}>
          <Sparkles className="size-3.5" />
          {isPending ? "Tailoring..." : drafts.length ? "Retailor" : "Tailor resume"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {drafts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tailored resume yet.</p>
        ) : (
          <div className="space-y-3">
            {drafts.map((d, i) => (
              <div key={d.id} className="rounded-lg border p-3 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {new Date(d.created_at).toLocaleString()}
                    {i === 0 ? " · latest" : ""}
                  </p>
                  <Button size="sm" variant="ghost" onClick={() => copy(d)}>
                    <Copy className="size-3.5" />
                    Copy
                  </Button>
                </div>
                <MarkdownView content={d.tailored_resume_markdown} />
                <GapAnalysisView gapAnalysis={JSON.parse(d.gap_analysis) as GapAnalysis} />
              </div>
            ))}
          </div>
        )}

        {drafts.length > 0 && (
          <div className="rounded-lg border">
            <div className="border-b px-3 py-2">
              <p className="text-sm font-medium">Refine this draft</p>
              <p className="text-xs text-muted-foreground">
                Add context, request an edit, or paste a reference resume or URL. Each
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
                placeholder="e.g. 'lead with the ML project', paste a reference resume, or paste a URL..."
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

function GapAnalysisView({ gapAnalysis }: { gapAnalysis: GapAnalysis }) {
  return (
    <div className="space-y-3 border-t pt-3">
      <GapList title="Must-haves" items={gapAnalysis.must_haves} />
      {gapAnalysis.nice_to_haves.length > 0 && (
        <GapList title="Nice-to-haves" items={gapAnalysis.nice_to_haves} />
      )}
    </div>
  );
}

function GapList({
  title,
  items,
}: {
  title: string;
  items: GapAnalysis["must_haves"];
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            {item.evidence_in_resume ? (
              <Check className="size-3.5 mt-0.5 shrink-0 text-primary" />
            ) : (
              <TriangleAlert className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
            )}
            <div>
              <p>{item.requirement}</p>
              <p className="text-xs text-muted-foreground">{item.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
