import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus, CommuteTier } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  applied: "bg-muted text-muted-foreground",
  oa: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  interview: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  follow_up: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  offer: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-red-500/15 text-red-700 dark:text-red-300",
};

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  applied: "Applied",
  oa: "OA",
  interview: "Interview",
  follow_up: "Follow up",
  offer: "Offer",
  rejected: "Rejected",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge variant="outline" className={cn("border-0 font-medium", STATUS_STYLE[status])}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

const TIER_LABEL: Record<CommuteTier, string> = {
  under_30: "< 30 min",
  "30_45": "30–45 min",
  "45_60": "45–60 min",
  "60_75": "60–75 min",
};

export function CommuteTierBadge({ tier }: { tier: CommuteTier }) {
  return (
    <Badge variant="secondary" className="font-normal">
      {TIER_LABEL[tier]}
    </Badge>
  );
}
