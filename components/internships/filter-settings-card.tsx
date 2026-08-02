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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { updateInternshipFilterSettingsAction } from "@/app/internships/actions";
import type { InternshipFilterSettings } from "@/lib/db/types";

export function FilterSettingsCard({ settings }: { settings: InternshipFilterSettings }) {
  const [isPending, startTransition] = useTransition();

  const [roleTypeEnabled, setRoleTypeEnabled] = useState(Boolean(settings.role_type_enabled));
  const [paidOnlyEnabled, setPaidOnlyEnabled] = useState(Boolean(settings.paid_only_enabled));
  const [locationEnabled, setLocationEnabled] = useState(Boolean(settings.location_enabled));
  const [locationState, setLocationState] = useState(settings.location_state);
  const [seniorityEnabled, setSeniorityEnabled] = useState(Boolean(settings.seniority_enabled));
  const [eligibleClassYears, setEligibleClassYears] = useState(
    (JSON.parse(settings.eligible_class_years) as string[]).join(", ")
  );
  const [relevanceEnabled, setRelevanceEnabled] = useState(Boolean(settings.relevance_enabled));
  const [relevanceMinScore, setRelevanceMinScore] = useState(String(settings.relevance_min_score));

  function save() {
    startTransition(async () => {
      const result = await updateInternshipFilterSettingsAction({
        role_type_enabled: roleTypeEnabled,
        paid_only_enabled: paidOnlyEnabled,
        location_enabled: locationEnabled,
        location_state: locationState.trim() || "NJ",
        seniority_enabled: seniorityEnabled,
        eligible_class_years: eligibleClassYears
          .split(",")
          .map((y) => y.trim())
          .filter(Boolean),
        relevance_enabled: relevanceEnabled,
        relevance_min_score: Number(relevanceMinScore) || 1,
      });
      if (!result.ok) toast.error(result.message);
      else toast.success(result.message);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search filters</CardTitle>
        <CardDescription>
          Toggle or edit the hardcoded eligibility rules internship search enforces.
          Postings that fail one or more enabled filters aren&apos;t dropped silently —
          they show up as near-misses on the Search tab with the specific reason, so you
          can override or dismiss. Live posting verification always applies and can&apos;t
          be turned off. Changes apply to the next search you run.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <FilterRow
          label="Role type"
          description="Only internships/co-ops — full-time and new-grad roles are always rejected."
          checked={roleTypeEnabled}
          onCheckedChange={setRoleTypeEnabled}
        />

        <FilterRow
          label="Paid only"
          description="Reject unpaid or unconfirmed-compensation postings."
          checked={paidOnlyEnabled}
          onCheckedChange={setPaidOnlyEnabled}
        />

        <FilterRow
          label="Location"
          description="Require this state, unless the term is summer."
          checked={locationEnabled}
          onCheckedChange={setLocationEnabled}
        >
          <Input
            className="w-24"
            value={locationState}
            onChange={(e) => setLocationState(e.target.value.toUpperCase())}
            maxLength={2}
            disabled={!locationEnabled}
          />
        </FilterRow>

        <FilterRow
          label="Seniority"
          description="Comma-separated class years the posting must be open to at least one of."
          checked={seniorityEnabled}
          onCheckedChange={setSeniorityEnabled}
        >
          <Input
            className="w-56"
            value={eligibleClassYears}
            onChange={(e) => setEligibleClassYears(e.target.value)}
            placeholder="sophomore, junior"
            disabled={!seniorityEnabled}
          />
        </FilterRow>

        <FilterRow
          label="Resume relevance"
          description="Minimum 1-5 relevance score to the resume on file."
          checked={relevanceEnabled}
          onCheckedChange={setRelevanceEnabled}
        >
          <Input
            type="number"
            min={1}
            max={5}
            className="w-20"
            value={relevanceMinScore}
            onChange={(e) => setRelevanceMinScore(e.target.value)}
            disabled={!relevanceEnabled}
          />
        </FilterRow>

        <Button size="sm" disabled={isPending} onClick={save}>
          Save filters
        </Button>
      </CardContent>
    </Card>
  );
}

function FilterRow({
  label,
  description,
  checked,
  onCheckedChange,
  children,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
      <div className="flex items-start gap-2">
        <Checkbox
          checked={checked}
          onCheckedChange={(c) => onCheckedChange(c === true)}
          className="mt-0.5"
        />
        <div>
          <Label className="font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}
