"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { ResearchProfileHistoryEntry, ResearchProfileHistorySource } from "@/lib/db/types";
import { History } from "lucide-react";

const SOURCE_LABEL: Record<ResearchProfileHistorySource, string> = {
  research: "Research run",
  document: "Document import",
  chat: "Chat",
  incorporate: "Incorporated",
};

export function ResearchHistoryButton({
  history,
}: {
  history: ResearchProfileHistoryEntry[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <History className="size-3.5" />
            History
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profile history</DialogTitle>
        </DialogHeader>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.map((h) => (
              <div key={h.id} className="rounded-md border p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="font-normal">
                    {SOURCE_LABEL[h.source]}
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(h.created_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <p className="text-sm">{h.summary}</p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
