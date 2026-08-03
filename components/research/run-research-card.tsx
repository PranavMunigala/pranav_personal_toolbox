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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { runResearchAction } from "@/app/research/actions";
import { Sparkles } from "lucide-react";

type CategoryHint = "auto" | "companies" | "products" | "topics";

export function RunResearchCard({
  defaultQuery = "",
  defaultCategory = "auto",
}: {
  defaultQuery?: string;
  defaultCategory?: CategoryHint;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(defaultQuery);
  const [category, setCategory] = useState<CategoryHint>(defaultCategory);
  const [focus, setFocus] = useState("");

  function run() {
    startTransition(async () => {
      const result = await runResearchAction(
        query,
        category === "auto" ? undefined : category,
        focus.trim() || undefined
      );
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (result.category && result.slug) {
        router.push(`/research/${result.category}/${result.slug}`);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Research a company, product, or topic</CardTitle>
        <CardDescription>
          Runs the biomed-research skill headlessly — searches the web and writes/updates
          a profile under research/. Running it again on an existing profile refreshes it
          in place.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="e.g. Recursion Pharmaceuticals, mRNA-1273, CRISPR base editing"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isPending}
          />
          <Select value={category} onValueChange={(v) => setCategory(v as CategoryHint)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto-detect</SelectItem>
              <SelectItem value="companies">Company</SelectItem>
              <SelectItem value="products">Product</SelectItem>
              <SelectItem value="topics">Topic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea
          rows={2}
          placeholder="Optional — what to focus on (e.g. their internship program, competing platforms)"
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          disabled={isPending}
        />
        <Button size="sm" disabled={isPending || !query.trim()} onClick={run}>
          <Sparkles className="size-3.5" />
          {isPending ? "Researching..." : "Run Research"}
        </Button>
      </CardContent>
    </Card>
  );
}
