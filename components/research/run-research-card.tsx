"use client";

import { useRef, useState, useTransition } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { runResearchAction, runDocumentResearchAction } from "@/app/research/actions";
import { Sparkles, Paperclip, X } from "lucide-react";

type CategoryHint = "auto" | "companies" | "products" | "topics";
type SourceMode = "query" | "document";
type ResearchPurpose = "personal_research" | "learning" | "linkedin_post";

export function RunResearchCard({
  defaultQuery = "",
  defaultCategory = "auto",
}: {
  defaultQuery?: string;
  defaultCategory?: CategoryHint;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<SourceMode>("query");
  const [query, setQuery] = useState(defaultQuery);
  const [category, setCategory] = useState<CategoryHint>(defaultCategory);
  const [focus, setFocus] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [purpose, setPurpose] = useState<ResearchPurpose>("personal_research");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleResult(result: { ok: boolean; message: string; category?: string; slug?: string }) {
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    if (result.category && result.slug) {
      router.push(`/research/${result.category}/${result.slug}`);
    }
  }

  function runQuery() {
    startTransition(async () => {
      try {
        const result = await runResearchAction(
          query,
          category === "auto" ? undefined : category,
          focus.trim() || undefined
        );
        handleResult(result);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Research failed.");
      }
    });
  }

  function runDocument() {
    startTransition(async () => {
      try {
        const formData = new FormData();
        if (sourceFile) formData.set("sourceFile", sourceFile);
        if (sourceUrl.trim()) formData.set("sourceUrl", sourceUrl.trim());
        if (focus.trim()) formData.set("focus", focus.trim());
        formData.set("purpose", purpose);
        formData.set("categoryHint", category);
        const result = await runDocumentResearchAction(formData);
        handleResult(result);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Research failed.");
      }
    });
  }

  const canRunQuery = !!query.trim();
  const canRunDocument = !!sourceFile || !!sourceUrl.trim();

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
      <CardContent>
        <Tabs value={mode} onValueChange={(v) => setMode(v as SourceMode)}>
          <TabsList className="mb-3">
            <TabsTrigger value="query">Name & Topic</TabsTrigger>
            <TabsTrigger value="document">Link / PDF</TabsTrigger>
          </TabsList>

          <TabsContent value="query" className="space-y-3">
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
              placeholder="Optional — anything extra you want researched in depth (e.g. their internship program, how they compare to X) — we'll dig into this specifically and fold it into the profile"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              disabled={isPending}
            />
            <Button size="sm" disabled={isPending || !canRunQuery} onClick={runQuery}>
              <Sparkles className="size-3.5" />
              {isPending ? "Researching..." : "Run Research"}
            </Button>
          </TabsContent>

          <TabsContent value="document" className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Paste a link (e.g. a paper's page)"
                value={sourceUrl}
                onChange={(e) => {
                  setSourceUrl(e.target.value);
                  if (e.target.value) setSourceFile(null);
                }}
                disabled={isPending || !!sourceFile}
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

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                disabled={isPending || !!sourceUrl.trim()}
                onChange={(e) => setSourceFile(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending || !!sourceUrl.trim()}
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="size-3.5" />
                {sourceFile ? "Change PDF" : "Upload PDF"}
              </Button>
              {sourceFile && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  {sourceFile.name}
                  <button
                    type="button"
                    onClick={() => {
                      setSourceFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    disabled={isPending}
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              )}
            </div>

            <Textarea
              rows={2}
              placeholder="Optional — what to zoom in on within the doc, or context on how to research it (e.g. focus on the methodology, or how this compares to what's already in my tracker)"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              disabled={isPending}
            />

            <Select value={purpose} onValueChange={(v) => setPurpose(v as ResearchPurpose)}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal_research">Personal research / scouting</SelectItem>
                <SelectItem value="learning">Learning — explain it to me</SelectItem>
                <SelectItem value="linkedin_post">LinkedIn post prep — quick & shareable</SelectItem>
              </SelectContent>
            </Select>

            <Button size="sm" disabled={isPending || !canRunDocument} onClick={runDocument}>
              <Sparkles className="size-3.5" />
              {isPending ? "Analyzing..." : "Analyze & Research"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
