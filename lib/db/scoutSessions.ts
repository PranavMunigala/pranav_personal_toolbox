import { db } from "./index";
import type { ScoutSession } from "./types";

export interface NewScoutSession {
  application_id?: number | null;
  company: string;
  role: string;
  job_posting_url?: string | null;
  job_posting_text: string;
  resume_source_text: string;
  extra_context_text?: string | null;
}

export function listScoutSessions(): ScoutSession[] {
  return db.prepare(`SELECT * FROM scout_sessions ORDER BY id DESC`).all() as ScoutSession[];
}

export function getScoutSession(id: number): ScoutSession | undefined {
  return db.prepare(`SELECT * FROM scout_sessions WHERE id = ?`).get(id) as
    | ScoutSession
    | undefined;
}

export function insertScoutSession(s: NewScoutSession): ScoutSession {
  const info = db
    .prepare(
      `INSERT INTO scout_sessions (application_id, company, role, job_posting_url, job_posting_text, resume_source_text, extra_context_text)
       VALUES (@application_id, @company, @role, @job_posting_url, @job_posting_text, @resume_source_text, @extra_context_text)`
    )
    .run({
      application_id: s.application_id ?? null,
      company: s.company,
      role: s.role,
      job_posting_url: s.job_posting_url ?? null,
      job_posting_text: s.job_posting_text,
      resume_source_text: s.resume_source_text,
      extra_context_text: s.extra_context_text ?? null,
    });
  return getScoutSession(Number(info.lastInsertRowid))!;
}
