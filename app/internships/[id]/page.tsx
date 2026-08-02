import { notFound } from "next/navigation";
import { getApplication } from "@/lib/db/applications";
import { listContacts } from "@/lib/db/contacts";
import { ApplicationDetailForm } from "@/components/internships/application-detail-form";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = getApplication(Number(id));
  if (!application) notFound();

  const closeConnections = listContacts().filter(
    (c) =>
      Boolean(c.is_close_connection) &&
      c.company?.toLowerCase() === application.company.toLowerCase()
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      <ApplicationDetailForm application={application} closeConnections={closeConnections} />
    </div>
  );
}
