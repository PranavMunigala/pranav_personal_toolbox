"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createApplicationAction } from "@/app/internships/actions";
import { Plus } from "lucide-react";

export function AddApplicationDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [link, setLink] = useState("");
  const [location, setLocation] = useState("");

  function reset() {
    setCompany("");
    setRole("");
    setLink("");
    setLocation("");
  }

  function submit() {
    startTransition(async () => {
      const result = await createApplicationAction({
        company,
        role,
        link: link || undefined,
        location: location || undefined,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="size-4" />
            Add application
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add an application</DialogTitle>
          <DialogDescription>
            Paste a job posting link and use the <code>internship-intake</code> skill
            from Claude Code to auto-fill these fields instead, if you&apos;d rather not
            type them by hand.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="link">Application link</Label>
            <Input id="link" value={link} onChange={(e) => setLink(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={isPending || !company.trim() || !role.trim()}>
            Add application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
