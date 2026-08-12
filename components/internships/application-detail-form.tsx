"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateApplicationAction } from "@/app/internships/actions";
import type { Application, ApplicationStatus, Contact } from "@/lib/db/types";
import { ArrowLeft, ExternalLink, Compass } from "lucide-react";

const STATUS_OPTIONS: ApplicationStatus[] = [
  "applied",
  "oa",
  "interview",
  "follow_up",
  "offer",
  "rejected",
];

export function ApplicationDetailForm({
  application,
  closeConnections,
}: {
  application: Application;
  closeConnections: Contact[];
}) {
  const [isPending, startTransition] = useTransition();

  const [company, setCompany] = useState(application.company);
  const [role, setRole] = useState(application.role);
  const [link, setLink] = useState(application.link ?? "");
  const [location, setLocation] = useState(application.location ?? "");
  const [datePosted, setDatePosted] = useState(application.date_posted ?? "");
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [notes, setNotes] = useState(application.notes ?? "");
  const [interviewContactName, setInterviewContactName] = useState(
    application.interview_contact_name ?? ""
  );
  const [interviewContactEmail, setInterviewContactEmail] = useState(
    application.interview_contact_email ?? ""
  );

  function submit() {
    startTransition(async () => {
      const result = await updateApplicationAction(application.id, {
        company,
        role,
        link: link || null,
        location: location || null,
        date_posted: datePosted || null,
        status,
        notes: notes || null,
        interview_contact_name: interviewContactName || null,
        interview_contact_email: interviewContactEmail || null,
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
          href="/internships"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" />
          Back to tracker
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href={`/scout?applicationId=${application.id}`}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
          >
            <Compass className="size-3.5" />
            Scout this posting
          </Link>
          {application.link && (
            <a
              href={application.link}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            >
              View posting
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </div>

      {closeConnections.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">
              You have a close connection at {application.company}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {closeConnections.map((c) => (
              <p key={c.id} className="text-sm">
                <Link href={`/cold-email/${c.id}`} className="font-medium hover:underline">
                  {c.name}
                </Link>
                {c.relation ? ` — ${c.relation}` : ""}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {application.company} — {application.role}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company">
              <Input value={company} onChange={(e) => setCompany(e.target.value)} />
            </Field>
            <Field label="Role">
              <Input value={role} onChange={(e) => setRole(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location">
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={(v) => setStatus(v as ApplicationStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Posting link">
              <Input value={link} onChange={(e) => setLink(e.target.value)} />
            </Field>
            <Field label="Date posted">
              <Input
                placeholder="e.g. 2026-06-01"
                value={datePosted}
                onChange={(e) => setDatePosted(e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Interview contact name">
              <Input
                placeholder="Who reached out to schedule an interview"
                value={interviewContactName}
                onChange={(e) => setInterviewContactName(e.target.value)}
              />
            </Field>
            <Field label="Interview contact email">
              <Input
                value={interviewContactEmail}
                onChange={(e) => setInterviewContactEmail(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <div className="flex justify-end">
            <Button onClick={submit} disabled={isPending || !company.trim() || !role.trim()}>
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
