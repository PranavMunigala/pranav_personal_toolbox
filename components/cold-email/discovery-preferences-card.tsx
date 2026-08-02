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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateDiscoveryPreferencesAction } from "@/app/cold-email/actions";
import type { RequireConnection } from "@/lib/db/types";
import { Pencil } from "lucide-react";

export function DiscoveryPreferencesCard({
  targetSchools,
  requireConnection,
  excludeRecruiters,
  notes,
}: {
  targetSchools: string[];
  requireConnection: RequireConnection;
  excludeRecruiters: boolean;
  notes: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [schoolsText, setSchoolsText] = useState(targetSchools.join(", "));
  const [connection, setConnection] = useState<RequireConnection>(requireConnection);
  const [excludeRec, setExcludeRec] = useState(excludeRecruiters);
  const [notesText, setNotesText] = useState(notes ?? "");

  function submit() {
    startTransition(async () => {
      const result = await updateDiscoveryPreferencesAction({
        target_schools: schoolsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        require_connection: connection,
        exclude_recruiters: excludeRec,
        notes: notesText.trim() || null,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setOpen(false);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Discovery filters</CardTitle>
          <CardDescription>
            Narrows what the contact-discovery skill searches for when you ask it to find
            new people.
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button variant="outline" size="sm">
                <Pencil className="size-3.5" />
                Edit
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit discovery filters</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Target schools (comma-separated)</Label>
                <Input
                  placeholder="Rutgers"
                  value={schoolsText}
                  onChange={(e) => setSchoolsText(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Connection requirement</Label>
                <Select
                  value={connection}
                  onValueChange={(v) => setConnection(v as RequireConnection)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="connected_only">Connected only</SelectItem>
                    <SelectItem value="not_connected_only">Not connected only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="exclude-recruiters"
                  checked={excludeRec}
                  onCheckedChange={(checked) => setExcludeRec(checked)}
                />
                <Label htmlFor="exclude-recruiters">Exclude recruiters</Label>
              </div>
              <div className="space-y-1.5">
                <Label>Standing context for discovery (optional)</Label>
                <Textarea
                  rows={3}
                  placeholder="e.g. Prioritize early-stage startups over big companies."
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={isPending}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1.5">
        {targetSchools.map((s) => (
          <Badge key={s} variant="secondary">
            {s}
          </Badge>
        ))}
        <Badge variant="outline">{requireConnection.replace(/_/g, " ")}</Badge>
        {excludeRecruiters && <Badge variant="outline">excluding recruiters</Badge>}
      </CardContent>
    </Card>
  );
}
