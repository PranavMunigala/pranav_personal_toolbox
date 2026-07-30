import { Badge } from "@/components/ui/badge";
import type { ContactStatus, SeniorityTier } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<ContactStatus, string> = {
  not_contacted: "bg-muted text-muted-foreground",
  drafted: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  sent: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  coffee_chatted: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  no_response: "bg-red-500/15 text-red-700 dark:text-red-300",
};

const STATUS_LABEL: Record<ContactStatus, string> = {
  not_contacted: "Not contacted",
  drafted: "Drafted",
  sent: "Sent",
  coffee_chatted: "Coffee chatted",
  no_response: "No response",
};

export function StatusBadge({ status }: { status: ContactStatus }) {
  return (
    <Badge variant="outline" className={cn("border-0 font-medium", STATUS_STYLE[status])}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

const TIER_LABEL: Record<SeniorityTier, string> = {
  peer: "Peer / early-career",
  mid: "Mid-level IC",
  senior: "Senior / exec",
};

export function TierBadge({ tier }: { tier: SeniorityTier }) {
  return (
    <Badge variant="secondary" className="font-normal">
      {TIER_LABEL[tier]}
    </Badge>
  );
}
