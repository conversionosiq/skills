---
name: command-center-deploy
description: Compile and deploy the LKS & COSIQ Sovereign Command Center — the branded single-pane-of-glass revenue dashboard — to Supabase Edge Functions. Use whenever the user types a /deploy command (--compile, --encode, --push), asks to build, update, or ship the command center or CEO dashboard, wants revenue-per-zip-code or agent-capacity-ROI reporting compiled from LeadPerfection, Five9, and BuilderPrime data, or mentions deploying dashboard HTML to Supabase.
---

# Command Center Deployment

Purpose: compile and deploy the branded HTML dashboard that gives the CEO a
single-pane-of-glass view of the **truth** — Revenue per Zip Code and Agent
Capacity ROI — not vanity metrics like raw lead counts.

## Commands (run in order for a full deploy)

### `/deploy --compile` — aggregate the truth

1. Pull data from the three systems: LeadPerfection (lead + appointment outcomes,
   via `lp-ingest` sanitized output), Five9 (ACD/set-rate metrics, via
   `five9-ingest` reporting), and BuilderPrime (job values and statuses, via the
   `builderprime-integration` mapping).
2. Compute the sovereignty metrics:
   - **Revenue per Zip Code** — closed revenue and margin by zip, not lead volume.
   - **Agent Capacity ROI** — revenue attributable per staffed agent-hour by
     interval, to inform capacity planning.
   - Funnel truth-check: leads → golden-window contacts → sets → holds → revenue,
     so every leak has a number on it.
3. Render into the branded HTML dashboard template. Every number on the dashboard
   must be traceable to a source system — if a metric can't be traced, leave it off
   rather than showing a guess. A wrong number on the CEO's screen is worse than a
   missing one.

### `/deploy --encode` — prepare assets

Base64-encode the branded HTML assets (logo, fonts, CSS) inline so the dashboard is
fully self-contained for edge-function storage — no external asset fetches at view
time. Verify the encoded page still renders locally before pushing.

### `/deploy --push` — ship to Supabase

Deploy to Supabase Edge Functions:

- If the Supabase MCP tools are connected, use them (`deploy_edge_function` and
  friends); otherwise use the Supabase CLI. Confirm the target project with the
  user before the first push to a new environment — deploying a client dashboard
  to the wrong project is an outward-facing mistake.
- After deploy, **prove the work**: fetch or screenshot the live URL and confirm
  the current data renders. "Deploy succeeded" without a rendered page is not done.
- Access: the dashboard is for the CEO/leadership — confirm the function's auth
  setting (JWT/verify) rather than defaulting to public, since it displays
  revenue data.

## Sovereignty benefit (keep this the north star)

- Replaces vanity metrics (leads, calendar fill) with truth (Revenue per Zip Code).
- Highlights Agent Capacity ROI so staffing decisions come from data, not gut.
- One pane of glass ends the "Lost Time Silo" of leadership chasing numbers across
  three logins.
