"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CommuteTierBadge } from "./application-status-badge";
import { addTargetCompanyAction, removeTargetCompanyAction } from "@/app/internships/actions";
import type { TargetCompany, CommuteTier } from "@/lib/db/types";
import { ChevronDown, ChevronRight, ExternalLink, X } from "lucide-react";

const TIER_ORDER: CommuteTier[] = ["under_30", "30_45", "45_60", "60_75"];
const TIER_LABEL: Record<CommuteTier, string> = {
  under_30: "< 30 min",
  "30_45": "30–45 min",
  "45_60": "45–60 min",
  "60_75": "60–75 min",
};

export function TargetCompaniesCard({ companies }: { companies: TargetCompany[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [tier, setTier] = useState<CommuteTier>("under_30");
  const [careersUrl, setCareersUrl] = useState("");

  const byTier = TIER_ORDER.map((t) => ({
    tier: t,
    companies: companies.filter((c) => c.commute_tier === t),
  })).filter((g) => g.companies.length > 0);

  function add() {
    startTransition(async () => {
      const result = await addTargetCompanyAction({
        name,
        location: location || undefined,
        commute_tier: tier,
        careers_url: careersUrl || undefined,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setName("");
      setLocation("");
      setCareersUrl("");
    });
  }

  function remove(id: number, companyName: string) {
    startTransition(async () => {
      const result = await removeTargetCompanyAction(id);
      if (!result.ok) toast.error(result.message);
      else toast.success(`Removed ${companyName}.`);
    });
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-1.5">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          <CardTitle>Target companies ({companies.length})</CardTitle>
        </div>
        <CardDescription>
          Weighted extra interest in internship search, without restricting to just
          these — hidden by default, click to view.
        </CardDescription>
      </CardHeader>
      {open && (
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
            <div className="space-y-1.5">
              <Input
                placeholder="Company name"
                className="w-40"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Input
                placeholder="Location"
                className="w-36"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Input
                placeholder="Careers/ATS URL (optional)"
                className="w-48"
                value={careersUrl}
                onChange={(e) => setCareersUrl(e.target.value)}
              />
            </div>
            <Select value={tier} onValueChange={(v) => setTier(v as CommuteTier)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIER_ORDER.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TIER_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" disabled={isPending || !name.trim()} onClick={add}>
              Add
            </Button>
          </div>

          {byTier.map(({ tier: t, companies: tierCompanies }) => (
            <div key={t} className="space-y-2">
              <CommuteTierBadge tier={t} />
              <div className="grid sm:grid-cols-2 gap-2">
                {tierCompanies.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-md border px-3 py-2 text-sm flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="font-medium flex items-center gap-1.5">
                        {c.name}
                        {c.careers_url && (
                          <a
                            href={c.careers_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                      </div>
                      <div className="text-muted-foreground text-xs">{c.location}</div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-6 shrink-0"
                      disabled={isPending}
                      onClick={() => remove(c.id, c.name)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
