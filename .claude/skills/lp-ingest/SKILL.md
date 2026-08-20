---
name: lp-ingest
description: LeadPerfection (LP) lead ingestion with schema-drift protection and deterministic sanitization. Use whenever the user wants to import, ingest, sanitize, validate, or deduplicate leads or a lead CSV — /lp ingest, /lp validate, "import these leads", "check this LP export", "the CRM export headers changed" — or mentions LeadPerfection exports, lead files, schema drift, or lead quality classification (waterfall financing, stay-in-place vs age-in-place, zip-code ROI), even if they don't name the skill.
---

# LeadPerfection (LP) Ingestion Logic

Purpose: deterministic sanitization and schema-guarded lead import. Lead ingestion is
the primary leak point in the funnel — corrupt data that reaches the sales floor
costs appointments, so this skill **halts on drift** rather than guessing.

## Bundled resources

- `references/schema.json` — the expected LP export schema (required headers plus
  known aliases). This is a starting template: on first use in a new environment,
  confirm the headers against a real LP export with the user and update it.
- `scripts/lp_ingest.py` — deterministic drift check and sanitizer (stdlib only).
  Prefer running this script over re-implementing the logic; determinism is the point.

## Workflow: `/lp ingest <file.csv>`

### 1. Load schema

Read `references/schema.json`. If it is missing or obviously stale, stop and
resolve that first — a drift check against a wrong schema is worse than none.

### 2. Schema drift check

```bash
python3 scripts/lp_ingest.py check --csv <file.csv> --schema references/schema.json
```

The script compares CSV headers (case-insensitive, alias-aware) against the schema:

- **Drift ≤ 5% and no required header missing** → proceed to sanitize.
- **Drift > 5% or a required header missing** → **HALT.** Do not import. Report
  exactly which headers are missing, unexpected, or look renamed, and ask the user
  whether the LP export changed or the schema should be updated. Schema drift
  usually means the CRM export changed without notice — importing anyway silently
  corrupts downstream routing and reporting.

### 3. Sanitize

```bash
python3 scripts/lp_ingest.py sanitize --csv <file.csv> --schema references/schema.json --out <file>.clean.csv
```

This normalizes phone numbers (10-digit, punctuation stripped) and emails
(lowercased, trimmed), flags rows with no usable contact method, and deduplicates on
normalized phone/email. Report the summary counts (rows in, cleaned, flagged,
duplicates dropped) to the user — that summary is the proof of work.

If the leads must also be deduplicated against an existing database (not just
within the file), ask where that database lives before claiming the file is deduped.

### 4. Critical intent classification

After sanitization, classify each lead (add columns to the clean CSV or produce a
classification report, whichever the user's pipeline expects):

- **Waterfall Financing** — flag leads with pre-approval potential so finance
  options are offered in the first conversation, not after the sit.
- **Consumer Shift** — classify **"Stay in Place"** (older millennial / tech-savvy,
  responds to digital-first follow-up) vs **"Age in Place"** (comfort- and
  trust-driven, responds to phone-first, high-EQ follow-up). This drives which
  outbound cadence `outbound-iq-sync` uses.
- **Geographic ROI** — cross-reference zip code against market-specific profit
  margins. If a zip-margin table exists in the project, use it; if not, say so
  rather than inventing margins, and classify by the data available.

## `/lp validate`

Run step 2 only (drift check) and report — no import, no writes. Use this as the
harness-verification step after any LP export change.

## Rules

- Never import a file that failed the drift check, even "just this once".
- Never invent or guess values for missing fields — flag them.
- Report counts at every stage; silent drops are how leaks start.
