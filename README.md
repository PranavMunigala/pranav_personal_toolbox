# Pranav Personal Toolbox

A personal dashboard for college: cold-email outreach tracking, internship search/tracking,
BME research tools, and a notes bank. Private, single-user, local-first.

## Modules

- **Cold Email Tracker** (`/cold-email`) — track outreach contacts, draft seniority-tiered
  emails, never re-email the same person.
- **Internship Tracker** (`/internships`) — track applications, auto-search for new postings
  matching target criteria/companies, cross-reference with contacts.
- **Research Tools** (`/research`) — BME research utilities, mirrored from
  [`bme-research`](https://github.com/PranavMunigala/bme-research) as a git submodule.
- **Notes Bank** (`/notes`) — mirrored from
  [`Athena.V0`](https://github.com/PranavMunigala/Athena.V0) as a git submodule.

## Getting started

```bash
git submodule update --init --recursive
npm install
npm run seed   # populate the local SQLite DB with seed contacts/target companies
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

See `CLAUDE.md` for the data model, skills, and conventions.
