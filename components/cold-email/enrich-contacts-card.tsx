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
import { enrichContactsAction } from "@/app/cold-email/actions";
import { Sparkles } from "lucide-react";

export function EnrichContactsCard() {
  const [isPending, startTransition] = useTransition();
  const [names, setNames] = useState("");

  function run() {
    startTransition(async () => {
      const result = await enrichContactsAction(names);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fill in missing info</CardTitle>
        <CardDescription>
          Type the name(s) of contacts you want enriched, separated by commas. Searches
          the web to fill in missing LinkedIn URL, alma mater, and industry tags for just
          those people — never overwrites anything already filled in, and never runs in
          bulk automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="e.g. Isaac Perez, Ankita Akanksha"
          value={names}
          onChange={(e) => setNames(e.target.value)}
          disabled={isPending}
        />
        <Button size="sm" variant="outline" disabled={isPending || !names.trim()} onClick={run}>
          <Sparkles className="size-3.5" />
          {isPending ? "Searching..." : "Fill in missing info"}
        </Button>
      </CardContent>
    </Card>
  );
}
