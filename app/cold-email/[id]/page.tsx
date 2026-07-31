import { notFound } from "next/navigation";
import { getContact } from "@/lib/db/contacts";
import { ContactDetailForm } from "@/components/cold-email/contact-detail-form";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = getContact(Number(id));
  if (!contact) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      <ContactDetailForm contact={contact} />
    </div>
  );
}
