"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { ApplicationStatusBadge } from "./application-status-badge";
import { deleteApplicationAction, setApplicationStatusAction } from "@/app/internships/actions";
import type { Application, ApplicationStatus, Contact } from "@/lib/db/types";
import { formatDate } from "@/lib/dates";
import { MoreHorizontal, ExternalLink, Star, Compass } from "lucide-react";

const STATUS_OPTIONS: ApplicationStatus[] = [
  "applied",
  "oa",
  "interview",
  "follow_up",
  "offer",
  "rejected",
];

export function ApplicationsTable({
  applications,
  contactsByCompany,
  closeConnectionsByCompany,
}: {
  applications: Application[];
  contactsByCompany: Record<string, Contact[]>;
  closeConnectionsByCompany: Record<string, Contact[]>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((a) =>
      [a.company, a.role, a.location].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [applications, query]);

  function changeStatus(id: number, status: ApplicationStatus) {
    startTransition(async () => {
      const result = await setApplicationStatusAction(id, status);
      if (!result.ok) toast.error(result.message);
      else toast.success(result.message);
    });
  }

  function remove(id: number, label: string) {
    startTransition(async () => {
      await deleteApplicationAction(id);
      toast.success(`Removed ${label}.`);
    });
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search by company, role, location..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Coffee chatted</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a) => {
              const linkedContacts = contactsByCompany[a.company.toLowerCase()] ?? [];
              const closeConnections = closeConnectionsByCompany[a.company.toLowerCase()] ?? [];
              return (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/internships/${a.id}`} className="hover:underline">
                        {a.company}
                      </Link>
                      {closeConnections.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="gap-1 font-normal"
                          title={closeConnections
                            .map((c) => `${c.name}${c.relation ? ` (${c.relation})` : ""}`)
                            .join(", ")}
                        >
                          <Star className="size-3" />
                          Close connection
                        </Badge>
                      )}
                      {a.link && (
                        <a
                          href={a.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.role}</TableCell>
                  <TableCell className="text-muted-foreground">{a.location || "—"}</TableCell>
                  <TableCell>
                    <ApplicationStatusBadge status={a.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {linkedContacts.length > 0
                      ? linkedContacts.map((c) => c.name).join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(a.date_applied)}
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
                        <DropdownMenuItem onClick={() => router.push(`/scout?applicationId=${a.id}`)}>
                          <Compass className="size-3.5" />
                          Scout this posting
                        </DropdownMenuItem>
                        {STATUS_OPTIONS.filter((s) => s !== a.status).map((s) => (
                          <DropdownMenuItem key={s} onClick={() => changeStatus(a.id, s)}>
                            Mark as {s.replace("_", " ")}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => remove(a.id, `${a.company} — ${a.role}`)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No applications match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
