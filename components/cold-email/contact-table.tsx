"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, TierBadge } from "./status-badge";
import { deleteContactAction, setContactStatusAction } from "@/app/cold-email/actions";
import type { Contact, ContactStatus } from "@/lib/db/types";
import { MoreHorizontal, ExternalLink } from "lucide-react";

const STATUS_OPTIONS: ContactStatus[] = [
  "not_contacted",
  "drafted",
  "sent",
  "coffee_chatted",
  "no_response",
];

export function ContactTable({ contacts }: { contacts: Contact[] }) {
  const [query, setQuery] = useState("");
  const [showNoResponse, setShowNoResponse] = useState(false);
  const [isPending, startTransition] = useTransition();

  const noResponseCount = useMemo(
    () => contacts.filter((c) => c.status === "no_response").length,
    [contacts]
  );

  const filtered = useMemo(() => {
    const visible = showNoResponse
      ? contacts
      : contacts.filter((c) => c.status !== "no_response");
    const q = query.trim().toLowerCase();
    if (!q) return visible;
    return visible.filter((c) =>
      [c.name, c.company, c.title].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [contacts, query, showNoResponse]);

  function changeStatus(id: number, status: ContactStatus) {
    startTransition(async () => {
      const result = await setContactStatusAction(id, status);
      if (!result.ok) toast.error(result.message);
      else toast.success(result.message);
    });
  }

  function remove(id: number, name: string) {
    startTransition(async () => {
      await deleteContactAction(id);
      toast.success(`Removed ${name}.`);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search by name, company, title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
        {noResponseCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setShowNoResponse((v) => !v)}
          >
            {showNoResponse
              ? "Hide no-response contacts"
              : `Show ${noResponseCount} no-response contact${noResponseCount === 1 ? "" : "s"}`}
          </Button>
        )}
      </div>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company / Title</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Contacted</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/cold-email/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                    {c.linkedin_url && (
                      <a
                        href={c.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {[c.title, c.company].filter(Boolean).join(" @ ") || "—"}
                </TableCell>
                <TableCell>
                  <TierBadge tier={c.seniority_tier} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={c.status} />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {c.date_last_contacted
                    ? new Date(c.date_last_contacted).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" disabled={isPending}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      {STATUS_OPTIONS.filter((s) => s !== c.status).map((s) => (
                        <DropdownMenuItem key={s} onClick={() => changeStatus(c.id, s)}>
                          Mark as {s.replace("_", " ")}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => remove(c.id, c.name)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No contacts match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
