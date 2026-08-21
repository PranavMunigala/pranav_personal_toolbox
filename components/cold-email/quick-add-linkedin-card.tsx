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
import { Input } from "@/components/ui/input";
import { quickAddContactFromLinkedInAction } from "@/app/cold-email/actions";
import { UserPlus } from "lucide-react";

export function QuickAddLinkedInCard() {
  const [isPending, startTransition] = useTransition();
  const [url, setUrl] = useState("");

  function run() {
    startTransition(async () => {
      const result = await quickAddContactFromLinkedInAction(url);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setUrl("");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add from LinkedIn URL</CardTitle>
        <CardDescription>
          Found someone yourself? Paste their LinkedIn URL — searches the web for
          public info, adds them straight to the tracker, and drafts an outreach
          email. No profile text to paste; if search can&apos;t find enough, use
          &quot;Add contact&quot; with pasted text instead.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="https://www.linkedin.com/in/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isPending}
        />
        <Button size="sm" variant="outline" disabled={isPending || !url.trim()} onClick={run}>
          <UserPlus className="size-3.5" />
          {isPending ? "Searching..." : "Add from LinkedIn URL"}
        </Button>
      </CardContent>
    </Card>
  );
}
