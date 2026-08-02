"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { updateContactAction } from "@/app/cold-email/actions";
import type { Contact, ConnectionStatus, SeniorityTier } from "@/lib/db/types";
import { ArrowLeft, ExternalLink } from "lucide-react";

export function ContactDetailForm({ contact }: { contact: Contact }) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(contact.name);
  const [linkedinUrl, setLinkedinUrl] = useState(contact.linkedin_url ?? "");
  const [email, setEmail] = useState(contact.email ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [company, setCompany] = useState(contact.company ?? "");
  const [title, setTitle] = useState(contact.title ?? "");
  const [tier, setTier] = useState<SeniorityTier>(contact.seniority_tier);
  const [industryTags, setIndustryTags] = useState(
    (JSON.parse(contact.industry_tags) as string[]).join(", ")
  );
  const [almaMater, setAlmaMater] = useState(contact.alma_mater ?? "");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    contact.connection_status
  );
  const [isRecruiter, setIsRecruiter] = useState(Boolean(contact.is_recruiter));
  const [isCloseConnection, setIsCloseConnection] = useState(
    Boolean(contact.is_close_connection)
  );
  const [relation, setRelation] = useState(contact.relation ?? "");
  const [profileText, setProfileText] = useState(contact.profile_text ?? "");
  const [notes, setNotes] = useState(contact.notes ?? "");

  function submit() {
    startTransition(async () => {
      const result = await updateContactAction(contact.id, {
        name,
        linkedin_url: linkedinUrl || null,
        email: email || null,
        phone: phone || null,
        company: company || null,
        title: title || null,
        seniority_tier: tier,
        industry_tags: industryTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        alma_mater: almaMater || null,
        connection_status: connectionStatus,
        is_recruiter: isRecruiter,
        is_close_connection: isCloseConnection,
        relation: relation || null,
        profile_text: profileText || null,
        notes: notes || null,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
    });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/cold-email"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" />
          Back to tracker
        </Link>
        {contact.linkedin_url && (
          <a
            href={contact.linkedin_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
          >
            View LinkedIn
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{contact.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="LinkedIn URL">
              <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company">
              <Input value={company} onChange={(e) => setCompany(e.target.value)} />
            </Field>
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Seniority tier">
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
            </Field>
            <Field label="Industry tags (comma-separated)">
              <Input value={industryTags} onChange={(e) => setIndustryTags(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Alma mater">
              <Input
                placeholder="e.g. Rutgers"
                value={almaMater}
                onChange={(e) => setAlmaMater(e.target.value)}
              />
            </Field>
            <Field label="Connection status">
              <Select
                value={connectionStatus}
                onValueChange={(v) => setConnectionStatus(v as ConnectionStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_connected">Not connected</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="connected">Connected</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_recruiter"
              checked={isRecruiter}
              onCheckedChange={(checked) => setIsRecruiter(checked)}
            />
            <Label htmlFor="is_recruiter">This person is a recruiter</Label>
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id="close_connection"
                checked={isCloseConnection}
                onCheckedChange={(checked) => setIsCloseConnection(checked)}
              />
              <Label htmlFor="close_connection">Am I close with this person?</Label>
            </div>
            <Field label="Relation">
              <Input
                placeholder="e.g. Theta Tau, friend, mom's friend"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Pasted profile text (About / Experience)">
            <Textarea rows={5} value={profileText} onChange={(e) => setProfileText(e.target.value)} />
          </Field>
          <Field label="Notes">
            <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <div className="flex justify-end">
            <Button onClick={submit} disabled={isPending || !name.trim()}>
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
