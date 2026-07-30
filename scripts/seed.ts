/**
 * Seeds the local SQLite DB with:
 *  - the outreach contacts already reached out to (from LinkedIn URLs supplied by the user)
 *  - the fixed target-company list, grouped by commute tier
 *
 * Names/companies/titles below were inferred from LinkedIn URL slugs where no profile
 * text was available — flagged in `notes` so they can be corrected via the
 * contact-intake skill (paste the real About/Experience text to enrich the record).
 *
 * Run with: npm run seed
 */
import { insertContact, findContactByLinkedInUrl, updateContact } from "../lib/db/contacts";
import { upsertTargetCompany } from "../lib/db/targetCompanies";
import type { ContactStatus, SeniorityTier } from "../lib/db/types";

const INFERRED_NOTE =
  "Name/company/title inferred from LinkedIn URL slug — confirm and enrich via the contact-intake skill.";

interface SeedContact {
  name: string;
  linkedin_url: string;
  status: ContactStatus;
  seniority_tier: SeniorityTier;
  company?: string;
  title?: string;
  notes?: string;
}

// All contacts already reached out to. Status defaults to "sent"; the three
// confirmed coffee chats are marked "coffee_chatted".
const COFFEE_CHATTED = new Set([
  "https://www.linkedin.com/in/isaac-perez-44a839181/",
  "https://www.linkedin.com/in/rajvi-shah-7083571a0/",
  "https://www.linkedin.com/in/ankita-akanksha-998504241/",
]);

const seedContacts: SeedContact[] = [
  { name: "Samuel Landestoy", linkedin_url: "https://www.linkedin.com/in/samuel-landestoy-3a0970169/", seniority_tier: "mid", notes: INFERRED_NOTE, status: "sent" },
  { name: "Isaac Perez", linkedin_url: "https://www.linkedin.com/in/isaac-perez-44a839181/", seniority_tier: "peer", notes: INFERRED_NOTE, status: "coffee_chatted" },
  { name: "H. Maisuria", linkedin_url: "https://www.linkedin.com/in/hmaisuria1994/", seniority_tier: "mid", notes: INFERRED_NOTE, status: "sent" },
  { name: "Lukasz Kidzinski", linkedin_url: "https://www.linkedin.com/in/lukaszkidzinski/", seniority_tier: "senior", notes: INFERRED_NOTE, status: "sent" },
  { name: "Elyas Sanzar", linkedin_url: "https://www.linkedin.com/in/elyassanzar/", seniority_tier: "mid", notes: INFERRED_NOTE, status: "sent" },
  { name: "Ankita Akanksha", linkedin_url: "https://www.linkedin.com/in/ankita-akanksha-998504241/", seniority_tier: "peer", notes: INFERRED_NOTE, status: "coffee_chatted" },
  { name: "Alex Bukowska", linkedin_url: "https://www.linkedin.com/in/alex-bukowska-student/", seniority_tier: "peer", notes: INFERRED_NOTE, status: "sent" },
  { name: "Alexandra Monti", linkedin_url: "https://www.linkedin.com/in/alexandra-monti/", seniority_tier: "mid", notes: INFERRED_NOTE, status: "sent" },
  { name: "Mohammed Elfaramawy", linkedin_url: "https://www.linkedin.com/in/mohammed-elfaramawy/", seniority_tier: "mid", notes: INFERRED_NOTE, status: "sent" },
  { name: "Atharv Kulkarni", linkedin_url: "https://www.linkedin.com/in/atharv-kulkarni/", seniority_tier: "peer", notes: INFERRED_NOTE, status: "sent" },
  { name: "Sakhi Shah", linkedin_url: "https://www.linkedin.com/in/sakhishah1011/", seniority_tier: "peer", notes: INFERRED_NOTE, status: "sent" },
  { name: "Krithik Malreddy", linkedin_url: "https://www.linkedin.com/in/krithikmalreddy/", seniority_tier: "peer", notes: INFERRED_NOTE, status: "sent" },
  { name: "Veronica Salas", linkedin_url: "https://www.linkedin.com/in/veronica-salas-0152806a/", seniority_tier: "mid", notes: INFERRED_NOTE, status: "sent" },
  { name: "Nicholas Salas", linkedin_url: "https://www.linkedin.com/in/salasnicholas/", seniority_tier: "mid", notes: INFERRED_NOTE, status: "sent" },
  { name: "Karan", linkedin_url: "https://www.linkedin.com/in/karan1149", seniority_tier: "mid", notes: INFERRED_NOTE, status: "sent" },
  { name: "Rebecca Soskin Hicks, MD", linkedin_url: "https://www.linkedin.com/in/rebecca-soskin-hicks-md/", seniority_tier: "senior", notes: INFERRED_NOTE, status: "sent" },
  { name: "Omeed Mariani", linkedin_url: "https://www.linkedin.com/in/omeedmariani/", seniority_tier: "mid", notes: INFERRED_NOTE, status: "sent" },
  { name: "Ollie Hayes", linkedin_url: "https://www.linkedin.com/in/olliehayesadobe/", company: "Adobe", seniority_tier: "mid", notes: INFERRED_NOTE, status: "sent" },
  {
    name: "Rajvi Shah",
    linkedin_url: "https://www.linkedin.com/in/rajvi-shah-7083571a0/",
    company: "Merck",
    title: "Bioinformatics",
    seniority_tier: "mid",
    notes: "Coffee-chatted about her path from Rutgers into bioinformatics at Merck.",
    status: "coffee_chatted",
  },
  { name: "Joshua M. Monteiro", linkedin_url: "https://www.linkedin.com/in/joshuammonteiro/", seniority_tier: "mid", notes: INFERRED_NOTE, status: "sent" },
  { name: "Heather Strasser", linkedin_url: "https://www.linkedin.com/in/heather-strasser/", seniority_tier: "mid", notes: INFERRED_NOTE, status: "sent" },
  { name: "Andrew Golden", linkedin_url: "https://www.linkedin.com/in/andrew-golden-65b70214/", seniority_tier: "mid", notes: INFERRED_NOTE, status: "sent" },
  { name: "Nyman Aydin", linkedin_url: "https://www.linkedin.com/in/nyman-aydin-616321160/", seniority_tier: "peer", notes: INFERRED_NOTE, status: "sent" },
  {
    name: "Akshada Chordiya",
    linkedin_url: "https://www.linkedin.com/in/akshada-chordiya/",
    company: "Medtronic",
    title: "Regulatory Affairs, Device-Based Therapies (previously Stryker, robotics regulatory affairs)",
    seniority_tier: "mid",
    notes: "Rutgers senior design (laparoscopic biomaterial delivery tool, 1st place). Discussed robotics vs. traditional device regulatory affairs.",
    status: "sent",
  },
  { name: "Eshaan Parikh", linkedin_url: "https://www.linkedin.com/in/eshaan-parikh/", seniority_tier: "peer", notes: INFERRED_NOTE, status: "sent" },
  { name: "Rudra Patel", linkedin_url: "https://www.linkedin.com/in/rudrapatel27/", seniority_tier: "peer", notes: INFERRED_NOTE, status: "sent" },
  { name: "Evani Ricaldi", linkedin_url: "https://www.linkedin.com/in/evani-ricaldi-145424139/", seniority_tier: "peer", notes: INFERRED_NOTE, status: "sent" },
  { name: "I. Ansari", linkedin_url: "https://www.linkedin.com/in/i-ansari/", seniority_tier: "mid", notes: INFERRED_NOTE, status: "sent" },
  { name: "Matthew Gregory", linkedin_url: "https://www.linkedin.com/in/matthewgregory12456/", seniority_tier: "mid", notes: INFERRED_NOTE, status: "sent" },
  { name: "Sangeevan Vellappan", linkedin_url: "https://www.linkedin.com/in/sangeevan-vellappan/", seniority_tier: "peer", notes: INFERRED_NOTE, status: "sent" },
];

const targetCompanies: { name: string; location: string; commute_tier: "under_30" | "30_45" | "45_60" | "60_75"; notes?: string }[] = [
  { name: "Johnson & Johnson (World HQ)", location: "New Brunswick, NJ", commute_tier: "under_30", notes: "Global pharma/medtech giant." },
  { name: "Johnson & Johnson (Janssen R&D, Ethicon)", location: "Raritan, NJ", commute_tier: "under_30", notes: "CAR-T cell therapy manufacturing, R&D labs." },
  { name: "Merck & Co.", location: "Rahway, NJ", commute_tier: "under_30", notes: "HQ and major R&D/manufacturing site." },
  { name: "Legend Biotech", location: "Somerset, NJ", commute_tier: "under_30", notes: "Cell and gene therapy (CAR-T), corporate HQ." },
  { name: "Cellares", location: "Bridgewater, NJ", commute_tier: "under_30", notes: 'Cell/gene therapy manufacturing ("Smart Factory").' },
  { name: "Sanofi", location: "Bridgewater, NJ", commute_tier: "under_30", notes: "US headquarters." },
  { name: "Biocon Biologics", location: "Bridgewater, NJ", commute_tier: "under_30", notes: "Biosimilars, North American HQ." },
  { name: "Integra LifeSciences", location: "Princeton (HQ) / Plainsboro, NJ", commute_tier: "30_45", notes: "Largest NJ-HQ'd medical device company — regenerative tissue, neurosurgery, orthopedic devices." },
  { name: "Novo Nordisk", location: "Plainsboro, NJ", commute_tier: "30_45", notes: "US headquarters." },
  { name: "Bristol Myers Squibb", location: "Princeton/Lawrenceville/Hopewell, NJ", commute_tier: "30_45", notes: "Early discovery research, biologics manufacturing." },
  { name: "Daiichi Sankyo", location: "Basking Ridge, NJ", commute_tier: "45_60", notes: "US headquarters, oncology-focused." },
  { name: "PTC Therapeutics", location: "Warren, NJ", commute_tier: "45_60", notes: "Rare disease biotech." },
  { name: "Celularity", location: "Florham Park, NJ", commute_tier: "45_60", notes: "Cellular therapeutics (placental-derived)." },
  { name: "Teva Pharmaceuticals USA", location: "Parsippany, NJ", commute_tier: "45_60", notes: "US headquarters." },
  { name: "Bayer HealthCare (US)", location: "Whippany, NJ", commute_tier: "45_60" },
  { name: "Inferyx", location: "Basking Ridge, NJ", commute_tier: "45_60", notes: "AI/data analytics for biomedical applications — former employer, worth revisiting for a fall role or referral." },
  { name: "BD (Becton Dickinson)", location: "Franklin Lakes, NJ", commute_tier: "60_75", notes: "Global medtech HQ, one of the largest medical device companies in the world (~$20B+ revenue)." },
  { name: "Stryker Orthopaedics", location: "Mahwah, NJ", commute_tier: "60_75", notes: "Major orthopedic implant/device maker; may run slightly past 1.2 hrs depending on traffic." },
];

function main() {
  let inserted = 0;
  let skipped = 0;

  for (const c of seedContacts) {
    const existing = findContactByLinkedInUrl(c.linkedin_url);
    if (existing) {
      updateContact(existing.id, {
        name: c.name,
        company: c.company,
        title: c.title,
        seniority_tier: c.seniority_tier,
        notes: c.notes,
        status: COFFEE_CHATTED.has(c.linkedin_url) ? "coffee_chatted" : c.status,
      });
      skipped++;
      continue;
    }
    insertContact({
      name: c.name,
      linkedin_url: c.linkedin_url,
      company: c.company,
      title: c.title,
      seniority_tier: c.seniority_tier,
      notes: c.notes,
      status: COFFEE_CHATTED.has(c.linkedin_url) ? "coffee_chatted" : c.status,
      date_last_contacted: new Date().toISOString(),
    });
    inserted++;
  }

  for (const tc of targetCompanies) {
    upsertTargetCompany(tc);
  }

  console.log(
    `Seed complete: ${inserted} contacts inserted, ${skipped} already existed (updated), ${targetCompanies.length} target companies upserted.`
  );
}

main();
