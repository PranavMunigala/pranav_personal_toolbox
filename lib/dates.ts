// SQLite's `datetime('now')` (used as the default for every `created_at`/timestamp
// column in lib/db/schema.sql) returns UTC time as a space-separated string with no
// timezone marker, e.g. "2026-08-13 16:43:48". `new Date(...)` parses that shape as
// local time rather than UTC, silently reinterpreting a UTC clock reading as if it
// were already local — off by exactly the UTC offset. Route every DB timestamp
// through this before formatting.
export function parseSqliteUtc(value: string): Date {
  const iso = value.includes("T") || value.endsWith("Z") ? value : `${value.replace(" ", "T")}Z`;
  return new Date(iso);
}

// This is a single-user app that only ever runs for someone in US Eastern time, so
// timestamps are always rendered in that zone explicitly rather than trusting
// whatever timezone the browser/OS happens to report.
const EASTERN_TIME_ZONE = "America/New_York";

export function formatDateTime(
  value: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }
): string {
  return parseSqliteUtc(value).toLocaleString("en-US", { ...options, timeZone: EASTERN_TIME_ZONE });
}

export function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }
): string {
  return parseSqliteUtc(value).toLocaleDateString("en-US", { ...options, timeZone: EASTERN_TIME_ZONE });
}
