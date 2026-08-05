import { notFound } from "next/navigation";
import { getContact } from "@/lib/db/contacts";
import { listDraftsForContact } from "@/lib/db/emailDrafts";
import { listDraftChatMessages } from "@/lib/db/emailDraftChat";
import { ContactDetailForm } from "@/components/cold-email/contact-detail-form";
import { EmailDraftsCard } from "@/components/cold-email/email-drafts-card";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = getContact(Number(id));
  if (!contact) notFound();
  const drafts = listDraftsForContact(contact.id);
  const chatMessages = listDraftChatMessages(contact.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      <ContactDetailForm contact={contact} />
      <EmailDraftsCard contactId={contact.id} drafts={drafts} chatMessages={chatMessages} />
    </div>
  );
}
