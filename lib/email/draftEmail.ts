import { getContact } from "@/lib/db/contacts";
import { insertEmailDraft } from "@/lib/db/emailDrafts";
import { runSkill } from "@/lib/claudeCode/runSkill";
import type { EmailDraft } from "@/lib/db/types";

const SIGN_OFF = `Best,
Pranav Kumar Munigala
BSc in Biomedical Engineering
Rutgers University - New Brunswick
P: (862)-684-3583
E: pranav.munigala@gmail.com / pkm71@scarletmail.rutgers.edu
L: www.linkedin.com/in/pranavm26`;

const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    refusal_reason: { type: ["string", "null"] },
    subject: { type: ["string", "null"] },
    body: { type: ["string", "null"] },
  },
  required: ["ok", "refusal_reason", "subject", "body"],
  additionalProperties: false,
} as const;

export async function draftEmailForContact(contactId: number): Promise<EmailDraft> {
  const contact = getContact(contactId);
  if (!contact) throw new Error(`Contact ${contactId} not found`);

  const prompt = `This is a headless/automated invocation. contact_id: ${contactId}. Look up the contact yourself per the "Automated invocation" section, then draft a short cold-outreach email asking this person for a coffee chat or brief call. I'm a biomedical engineering / computer science student networking into engineering roles. Ground every claim strictly in facts from their stored profile; never invent shared connections, achievements, or background details.

## Tone by seniority tier
- peer (fellow student, early-career, <2 yrs experience): casual, first name, ask directly for a coffee chat. Shortest of the three tiers.
- mid (individual contributor / scientist / engineer): reference one specific detail from their background, ask one sharp question about their path, then ask for 15-20 minutes.
- senior (Director+, VP, Founder, MD, notable figure): more formal address if appropriate ("Mr./Ms. Last Name"), shortest version, one respectful ask, softer close ("if you have any time").

## Body rules
- Under ~120 words.
- Personalized opener naming a real, specific reason this person in particular (not generic flattery).
- One clear, low-commitment ask (a short chat/call), with flexible scheduling.
- Plain ASCII punctuation only - a plain hyphen for ranges like "15-20 minutes", never an em/en dash, backslash, or other special character.
- End the body with exactly this sign-off block, verbatim, nothing after it:
${SIGN_OFF}

## Subject line rules (based on cold-outreach research: short + specific subjects roughly double reply rates vs generic ones)
- 2-4 words. Specific to their role, company, or the topic - never generic phrases like "Quick question" or "Would love to connect" on their own.
- Example good subjects: "Your path into medtech", "Question about Stryker R&D", "BME grad, quick chat?"

## Voice/structure reference - match tone and length, do not copy verbatim
Mid-tier example (specific detail + question + ask):
"Hi Rajvi, I hope you are doing well. My name is Pranav Munigala and I'm a student studying Biomedical Engineering and Computer Science. I came across your background and would love to learn more about your experience at Merck and your path into bioinformatics. I'm also currently working on projects in the biomedical/computer science field and would appreciate hearing your perspective. If you're available I would love to set up a quick chat to speak. Thank you so much and I look forward to connecting."

Senior-tier example (formal address, shortest):
"Hi Mr. O'Brien, I hope you are doing well. My name is Pranav Munigala and I'm a student studying Biomedical Engineering and Computer Science. I came across your background and would love to learn more about your experience at Anthropic and your path into healthcare. I'm also currently working on projects in the biomedical/computer science field and would appreciate hearing your perspective. If you're available I would love to set up a quick chat to speak."

If the contact's stored background is thin, keep the ask general rather than inventing specifics.`;

  const parsed = await runSkill<{
    ok: boolean;
    refusal_reason: string | null;
    subject: string | null;
    body: string | null;
  }>({
    skill: "cold-email-draft",
    prompt,
    jsonSchema: DRAFT_SCHEMA,
    allowedTools: ["Bash(npx tsx scripts/db-cli.ts:*)"],
    timeoutMs: 120_000,
  });

  if (!parsed.ok || !parsed.subject || !parsed.body) {
    throw new Error(parsed.refusal_reason ?? "Couldn't draft an email for this contact.");
  }

  return insertEmailDraft({
    contact_id: contact.id,
    subject: parsed.subject,
    body: parsed.body,
    seniority_tier_used: contact.seniority_tier,
  });
}
