"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { updatePreferencesAction } from "@/app/cold-email/actions";
import { Pencil } from "lucide-react";

export function PreferencesCard({
  industries,
  roles,
  seniorityFocus,
}: {
  industries: string[];
  roles: string[];
  seniorityFocus: string[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [industriesText, setIndustriesText] = useState(industries.join(", "));
  const [rolesText, setRolesText] = useState(roles.join(", "));

  function submit() {
    startTransition(async () => {
      await updatePreferencesAction({
        industries: industriesText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        roles: rolesText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        seniority_focus: seniorityFocus,
      });
      toast.success("Preferences updated.");
      setOpen(false);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Who I&apos;m targeting</CardTitle>
          <CardDescription>
            Used by the outreach and internship-search skills to decide who/what to
            surface.
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
              <DialogTitle>Edit targeting preferences</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Industries (comma-separated)</Label>
                <Textarea
                  rows={2}
                  value={industriesText}
                  onChange={(e) => setIndustriesText(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Roles (comma-separated)</Label>
                <Textarea
                  rows={2}
                  value={rolesText}
                  onChange={(e) => setRolesText(e.target.value)}
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
        {industries.map((i) => (
          <Badge key={i} variant="secondary">
            {i}
          </Badge>
        ))}
        {roles.map((r) => (
          <Badge key={r} variant="outline">
            {r}
          </Badge>
        ))}
      </CardContent>
    </Card>
  );
}
