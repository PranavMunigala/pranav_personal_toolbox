"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownView } from "@/components/markdown-view";
import { sendResearchChatMessageAction } from "@/app/research/actions";
import { MessageCircle, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
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
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply! }]);
      if (result.profileUpdated) {
        toast.success("Profile updated with the new info.");
        router.refresh();
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

          <ScrollArea className="flex-1 px-4">
            <div className="flex flex-col gap-4 py-4">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Ask a follow-up question, or tell me to add something specific to
                  the saved profile.
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
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
              ))}
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
