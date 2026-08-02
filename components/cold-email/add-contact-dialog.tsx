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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createContactAction } from "@/app/cold-email/actions";
import type { SeniorityTier } from "@/lib/db/types";
import { Plus } from "lucide-react";

export function AddContactDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [tier, setTier] = useState<SeniorityTier>("mid");
  const [industryTags, setIndustryTags] = useState("");
  const [profileText, setProfileText] = useState("");
  const [isCloseConnection, setIsCloseConnection] = useState(false);
  const [relation, setRelation] = useState("");

  function reset() {
    setName("");
    setLinkedinUrl("");
    setCompany("");
    setTitle("");
    setTier("mid");
    setIndustryTags("");
    setProfileText("");
    setIsCloseConnection(false);
    setRelation("");
  }

  function submit() {
    startTransition(async () => {
      const result = await createContactAction({
        name,
        linkedin_url: linkedinUrl || undefined,
        company: company || undefined,
        title: title || undefined,
        seniority_tier: tier,
        industry_tags: industryTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        profile_text: profileText || undefined,
        is_close_connection: isCloseConnection,
        relation: relation || undefined,
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
            Add contact
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a contact</DialogTitle>
          <DialogDescription>
            Paste the LinkedIn URL and their About/Experience text — the{" "}
            <code>contact-intake</code> skill can also do this structuring for you from
            Claude Code.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>
          </div>
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
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Seniority tier</Label>
              <Select value={tier} onValueChange={(v) => setTier(v as SeniorityTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="peer">Peer / early-career</SelectItem>
                  <SelectItem value="mid">Mid-level IC</SelectItem>
                  <SelectItem value="senior">Senior / exec</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tags">Industry tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="AI healthcare, comp bio"
                value={industryTags}
                onChange={(e) => setIndustryTags(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id="close-connection"
                checked={isCloseConnection}
                onCheckedChange={(checked) => setIsCloseConnection(checked)}
              />
              <Label htmlFor="close-connection">Am I close with this person?</Label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="relation">Relation</Label>
              <Input
                id="relation"
                placeholder="e.g. Theta Tau, friend, mom's friend"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile">Pasted profile text (About / Experience)</Label>
            <Textarea
              id="profile"
              rows={4}
              value={profileText}
              onChange={(e) => setProfileText(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={isPending || !name.trim()}>
            Add contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
