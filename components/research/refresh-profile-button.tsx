"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runResearchAction } from "@/app/research/actions";
import { RefreshCw } from "lucide-react";

export function RefreshProfileButton({
  title,
  category,
}: {
  title: string;
  category: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      const result = await runResearchAction(title, category);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <Button variant="outline" size="sm" disabled={isPending} onClick={refresh}>
      <RefreshCw className="size-3.5" />
      {isPending ? "Refreshing..." : "Refresh this profile"}
    </Button>
  );
}
