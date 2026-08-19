"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownView } from "@/components/markdown-view";
import { sendResearchChatMessageAction, incorporateResearchAnswerAction } from "@/app/research/actions";
import { MessageCircle, X, Send, GitMerge } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  content: string;
  profileUpdated?: boolean;
}

export function ResearchChatSidebar({
  category,
  slug,
  initialMessages,
}: {
  category: string;
  slug: string;
  initialMessages: ChatMessage[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const [incorporatedIndices, setIncorporatedIndices] = useState<Set<number>>(new Set());
  const [incorporatingIndex, setIncorporatingIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function send() {
    const text = draft.trim();
    if (!text || isPending) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setDraft("");

    startTransition(async () => {
      const result = await sendResearchChatMessageAction(category, slug, text);
      if (!result.ok) {
        toast.error(result.error ?? "Chat failed.");
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: result.replyMessageId,
          role: "assistant",
          content: result.reply!,
          profileUpdated: result.profileUpdated,
        },
      ]);
      if (result.profileUpdated) {
        toast.success("Profile updated with the new info.");
        router.refresh();
      }
    });
  }

  function incorporate(index: number) {
    const answerMessage = messages[index];
    const questionMessage = messages[index - 1];
    if (!answerMessage || !questionMessage || questionMessage.role !== "user") return;
    if (answerMessage.id === undefined) return;

    setIncorporatingIndex(index);
    startTransition(async () => {
      const result = await incorporateResearchAnswerAction(
        category,
        slug,
        questionMessage.content,
        answerMessage.content,
        answerMessage.id!
      );
      setIncorporatingIndex(null);

      if (!result.ok) {
        toast.error(result.error ?? "Couldn't incorporate that.");
        return;
      }

      setIncorporatedIndices((prev) => new Set(prev).add(index));

      if (result.profileUpdated) {
        toast.success(result.note ?? "Profile updated with the new info.");
        router.refresh();
      } else {
        toast.info(
          result.note ?? "Nothing to incorporate — this is already reflected in the profile.",
          { duration: 10000 }
        );
      }
    });
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="fixed right-4 bottom-4 z-40 shadow-md"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="size-3.5" />
        Ask about this profile
      </Button>

      {open && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-background shadow-xl">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <p className="text-sm font-medium">Chat about this profile</p>
            <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 min-h-0 px-4">
            <div className="flex flex-col gap-4 py-4">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Ask a follow-up question, or tell me to add something specific to
                  the saved profile.
                </p>
              )}
              {messages.map((m, i) => {
                const canIncorporate =
                  m.role === "assistant" &&
                  m.id !== undefined &&
                  !m.profileUpdated &&
                  !incorporatedIndices.has(i) &&
                  messages[i - 1]?.role === "user";

                return (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm",
                        m.role === "user"
                          ? "self-end bg-primary text-primary-foreground"
                          : "self-start bg-muted"
                      )}
                    >
                      {m.role === "assistant" ? (
                        <MarkdownView content={m.content} />
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>
                    {canIncorporate && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="self-start"
                        disabled={incorporatingIndex === i}
                        onClick={() => incorporate(i)}
                      >
                        <GitMerge className="size-3.5" />
                        {incorporatingIndex === i ? "Incorporating…" : "Incorporate"}
                      </Button>
                    )}
                  </div>
                );
              })}
              {isPending && (
                <p className="self-start text-sm text-muted-foreground">Thinking…</p>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="flex items-end gap-2 border-t p-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask a follow-up, or say 'add this to the profile...'"
              className="max-h-32 min-h-9"
              disabled={isPending}
            />
            <Button size="icon" disabled={isPending || !draft.trim()} onClick={send}>
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
