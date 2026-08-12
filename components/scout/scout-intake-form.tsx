"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createScoutSessionAction } from "@/app/scout/actions";

export function ScoutIntakeForm({
  prefill,
}: {
  prefill?: { applicationId: number; company: string; role: string; link: string };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [company, setCompany] = useState(prefill?.company ?? "");
  const [role, setRole] = useState(prefill?.role ?? "");
  const [jobPostingUrl, setJobPostingUrl] = useState(prefill?.link ?? "");
  const [jobPostingText, setJobPostingText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [extraContext, setExtraContext] = useState("");

  function submit() {
    startTransition(async () => {
      const result = await createScoutSessionAction({
        application_id: prefill?.applicationId ?? null,
        company,
        role,
        job_posting_url: jobPostingUrl || undefined,
        job_posting_text: jobPostingText || jobPostingUrl,
        resume_source_text: resumeText,
        extra_context_text: extraContext || undefined,
      });
      if (!result.ok || !result.sessionId) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push(`/scout/${result.sessionId}`);
    });
  }

  const canSubmit =
    company.trim() &&
    role.trim() &&
    (jobPostingText.trim() || jobPostingUrl.trim()) &&
    resumeText.trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Scout session</CardTitle>
        <CardDescription>
          Paste a job posting and your resume. If you only have a link, paste that too —
          the tailoring step will fetch it as needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="scout-company">Company</Label>
            <Input id="scout-company" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scout-role">Role</Label>
            <Input id="scout-role" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="scout-url">Job posting URL (optional)</Label>
          <Input
            id="scout-url"
            value={jobPostingUrl}
            onChange={(e) => setJobPostingUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="scout-jd-text">Job posting text</Label>
          <Textarea
            id="scout-jd-text"
            rows={8}
            value={jobPostingText}
            onChange={(e) => setJobPostingText(e.target.value)}
            placeholder="Paste the full job description here. If you only have a URL above, you can leave this blank."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="scout-resume">Resume / experience bank</Label>
          <Textarea
            id="scout-resume"
            rows={10}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your current resume, in whatever format you use. The tailored version will match this structure."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="scout-extra">Extra projects / experience / context (optional)</Label>
          <Textarea
            id="scout-extra"
            rows={4}
            value={extraContext}
            onChange={(e) => setExtraContext(e.target.value)}
            placeholder="Anything relevant that's not already on your resume — Scout can draw on this to close gaps."
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={submit} disabled={isPending || !canSubmit}>
            {isPending ? "Creating..." : "Start Scout session"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
