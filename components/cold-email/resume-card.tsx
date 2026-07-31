"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { uploadResumeAction } from "@/app/cold-email/actions";
import { Upload } from "lucide-react";

export function ResumeCard({
  filename,
  uploadedAt,
  keywordCount,
}: {
  filename: string | null;
  uploadedAt: string | null;
  keywordCount: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function submit(rawText: string, name?: string) {
    startTransition(async () => {
      const result = await uploadResumeAction({ raw_text: rawText, filename: name });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setText("");
    });
  }

  async function handleFile(file: File) {
    const content = await file.text();
    submit(content, file.name);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume</CardTitle>
        <CardDescription>
          Used by the contact-discovery skill to judge how well a candidate matches your
          background. Paste your resume text or upload a .txt/.md file — parsed locally,
          no external API involved.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {filename && (
          <p className="text-sm text-muted-foreground">
            Current: <span className="font-medium text-foreground">{filename}</span>
            {uploadedAt && ` · uploaded ${new Date(uploadedAt).toLocaleDateString()}`}
            {` · ${keywordCount} keywords extracted`}
          </p>
        )}
        <Textarea
          rows={4}
          placeholder="Paste resume text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={isPending || !text.trim()}
            onClick={() => submit(text)}
          >
            Save pasted text
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-3.5" />
            Upload .txt/.md
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
