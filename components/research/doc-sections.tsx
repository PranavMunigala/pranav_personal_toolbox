"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContentDoc } from "@/lib/content";

function DocSection({
  title,
  docs,
  category,
}: {
  title: string;
  docs: ContentDoc[];
  category: string;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">{title}</h2>
      {docs.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nothing here yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {docs.map((doc) => (
            <Link key={doc.slug} href={`/research/${category}/${doc.slug}`}>
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">{doc.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {doc.excerpt}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ResearchDocSections({
  companies,
  products,
  topics,
}: {
  companies: ContentDoc[];
  products: ContentDoc[];
  topics: ContentDoc[];
}) {
  const [filterText, setFilterText] = useState("");
  const q = filterText.trim().toLowerCase();
  const matches = (doc: ContentDoc) => !q || doc.title.toLowerCase().includes(q);

  return (
    <div className="space-y-8">
      <Input
        placeholder="Filter by title..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        className="max-w-sm"
      />
      <DocSection title="Companies" docs={companies.filter(matches)} category="companies" />
      <DocSection title="Products" docs={products.filter(matches)} category="products" />
      <DocSection title="Topics" docs={topics.filter(matches)} category="topics" />
    </div>
  );
}
