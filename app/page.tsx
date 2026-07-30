import Link from "next/link";
import { listContacts } from "@/lib/db/contacts";

export const dynamic = "force-dynamic";
import { listApplications } from "@/lib/db/applications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Briefcase, FlaskConical, NotebookText, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const contacts = listContacts();
  const applications = listApplications();

  const modules = [
    {
      href: "/cold-email",
      icon: Mail,
      title: "Cold Email Tracker",
      description: "Track outreach, draft seniority-calibrated emails, never repeat.",
      stat: `${contacts.filter((c) => c.status === "coffee_chatted").length} coffee chats · ${contacts.length} contacts`,
    },
    {
      href: "/internships",
      icon: Briefcase,
      title: "Internship Tracker",
      description: "Applications, daily search, and cross-referenced contacts.",
      stat: `${applications.filter((a) => ["applied", "oa", "interview", "follow_up"].includes(a.status)).length} active applications`,
    },
    {
      href: "/research",
      icon: FlaskConical,
      title: "Research Tools",
      description: "Biomedical/biotech/health-AI scouting notes.",
      stat: "Mirrored from bme-research",
    },
    {
      href: "/notes",
      icon: NotebookText,
      title: "Notes Bank",
      description: "RAG study assistant over your own lecture notes.",
      stat: "Mirrored from Athena.V0",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 space-y-12">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Pranav&apos;s Toolbox</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Everything for the semester, in one place.
        </h1>
        <p className="text-muted-foreground max-w-xl">
          Outreach, internships, research, and notes — private, local, and built to keep
          the busywork out of the way.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {modules.map((m) => (
          <Link key={m.href} href={m.href}>
            <Card className="h-full group hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-primary/10 text-primary p-2.5 w-fit">
                    <m.icon className="size-5" />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardTitle className="text-lg mt-2">{m.title}</CardTitle>
                <CardDescription>{m.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{m.stat}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
