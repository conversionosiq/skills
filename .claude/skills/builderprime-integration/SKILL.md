---
name: builderprime-integration
description: BuilderPrime CRM integration — secure webhook and API field mapping from front-end portals (Lovable or other lead forms) into BuilderPrime, with scoped-key security enforcement (the "Cole Medine" protocol). Use whenever the user types /bp or mentions BuilderPrime, wants to wire a portal or webhook into the CRM, map JSON payload fields to CRM field IDs, debug why portal leads aren't landing in BuilderPrime, or verify portal-to-CRM data flow — even if they only say "connect the form to the CRM".
---

# BuilderPrime Integration Skill

Purpose: secure webhook and API mapping for lead status updates between "Lovable"
front-end portals and the BuilderPrime CRM.

## Procedures

### 1. API mapping

Map JSON payloads from portals to BuilderPrime field IDs using
`references/bp_map.json`:

- Treat `bp_map.json` as the single source of truth for field mapping. When a new
  portal field appears, add it to the map — never hardcode a field ID inline in
  webhook code, because unmapped drift here is the CRM-side twin of the schema
  drift `lp-ingest` guards against.
- On every mapping change, validate: every portal field maps to a real BP field ID,
  required BP fields (name, contact method, lead source) are all fed, and no two
  portal fields write the same BP field.
- The bundled `references/bp_map.json` is a template — confirm actual field IDs
  from the client's BuilderPrime instance before first use. Field IDs differ per
  instance; a mapping that "looks right" but points at the wrong custom field
  silently corrupts reporting.

### 2. Validation — prove the flow

After wiring or changing a mapping, verify end-to-end with a browser screenshot:
submit a test lead through the portal, then screenshot the BuilderPrime lead record
showing the mapped values landed in the right fields. "The webhook returned 200" is
not proof — the 200 proves delivery, the screenshot proves mapping. Use a clearly
marked test record (e.g., last name "ZZTEST") and clean it up afterward.

## Security Warning: The "Cole Medine" Protocol

An agent once misinterpreted a task and emailed a discount code to an entire list.
That incident is the reason for these constraints — they are not optional:

- **Scoped API keys only.** Request and use keys scoped to the narrowest capability
  the task needs (e.g., lead-write only — no bulk email, no export, no delete). If
  an agent can read a secret, it can use a secret; scoping is the only true safety.
- **Never assume system prompts are a permission layer.** Instructions do not
  constrain a misfire; credentials do. Design so that the worst misinterpretation
  of a task is still harmless.
- **No bulk outbound side effects from integration work.** Wiring a webhook must
  never be able to trigger mass sends. Anything that messages customers goes
  through `outbound-iq-sync` and its confirmation rules.
- Keep keys out of the repo: environment variables or a secret store, never
  committed, never echoed into logs or chat.

## Rules

- Before changing a live webhook or mapping, state what will change and confirm —
  a broken mapping drops real leads silently.
- After any change, run the validation procedure and show the proof of work.
- Log integration incidents and their fixes to the System Evolution Log in
  `CLAUDE.md` so the bug becomes a permanent upgrade.
