"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

const STATUS_OPTIONS = [
  "not_contacted",
  "drafted",
  "sent",
  "coffee_chatted",
  "no_response",
] as const;
const TIER_OPTIONS = ["peer", "mid", "senior"] as const;
const CONNECTION_OPTIONS = ["not_connected", "pending", "connected"] as const;

const ANY = "__any__";

export function ContactFilterBar({ allIndustryTags }: { allIndustryTags: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string | null | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  const company = searchParams.get("company") ?? "";
  const almaMater = searchParams.get("alma_mater") ?? "";
  const status = searchParams.get("status") ?? ANY;
  const tier = searchParams.get("seniority_tier") ?? ANY;
  const connectionStatus = searchParams.get("connection_status") ?? ANY;
  const recruitersOnly = searchParams.get("is_recruiter") === "true";
  const activeTag = searchParams.get("industry_tag");

  const hasActiveFilters =
    company || almaMater || status !== ANY || tier !== ANY || connectionStatus !== ANY || recruitersOnly || activeTag;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Company</Label>
          <Input
            className="w-40"
            value={company}
            onChange={(e) => setParam("company", e.target.value || undefined)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={status} onValueChange={(v) => setParam("status", v === ANY ? undefined : v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any status</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Seniority</Label>
          <Select value={tier} onValueChange={(v) => setParam("seniority_tier", v === ANY ? undefined : v)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any tier</SelectItem>
              {TIER_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Connection</Label>
          <Select
            value={connectionStatus}
            onValueChange={(v) => setParam("connection_status", v === ANY ? undefined : v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {CONNECTION_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Alma mater</Label>
          <Input
            className="w-32"
            placeholder="Rutgers"
            value={almaMater}
            onChange={(e) => setParam("alma_mater", e.target.value || undefined)}
          />
        </div>
        <div className="flex items-center gap-2 pb-2">
          <Checkbox
            id="recruiters-only"
            checked={recruitersOnly}
            onCheckedChange={(checked) => setParam("is_recruiter", checked ? "true" : undefined)}
          />
          <Label htmlFor="recruiters-only" className="text-sm">
            Recruiters only
          </Label>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
            <X className="size-3.5" />
            Clear filters
          </Button>
        )}
      </div>
      {allIndustryTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allIndustryTags.map((tag) => (
            <button key={tag} type="button" onClick={() => setParam("industry_tag", activeTag === tag ? undefined : tag)}>
              <Badge variant={activeTag === tag ? "default" : "outline"} className="cursor-pointer font-normal">
                {tag}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
