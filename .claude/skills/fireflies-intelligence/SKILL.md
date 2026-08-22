---
name: fireflies-intelligence
description: Fireflies.ai meeting intelligence — pull call transcripts, summaries, and conversation analytics through the Fireflies MCP server (https://api.fireflies.ai/mcp) and feed them into the RevOps loop as post-call recaps, CRM notes, follow-up copy in the lead's own words, and rep coaching stats. Use whenever the user types an /ff command (recap, search, sync, coach, setup), mentions Fireflies, or asks about a meeting recording, call transcript, meeting notes or summary, action items from a call, "what did the client/lead say", talk-time or talk-listen ratio, or coaching from recorded calls — even if they never say "Fireflies".
---

# Fireflies Meeting Intelligence

Purpose: turn recorded conversations into revenue actions. A sales call transcript
is the highest-EQ data source in the stack — the lead's own words, objections, and
commitments, timestamped. This skill pulls that data through the Fireflies MCP
server and routes it into the harness instead of letting it rot in a notetaker.

**Connection**: the Fireflies MCP server lives at `https://api.fireflies.ai/mcp`.
Tool names, registration options, auth, and the search grammar are documented in
`references/mcp-endpoint.md`. If no `fireflies_*` tools are available in the
session, run `/ff setup` before anything else.

## Commands

### `/ff recap [meeting | latest | participant email]` — post-call intelligence

1. **Resolve the meeting.** Use `fireflies_get_transcripts` (filter by date,
   participant, or keyword) to find the meeting ID; never guess an ID.
2. **Pull both halves.** `fireflies_get_summary` for keywords, overview, and action
   items; `fireflies_get_transcript` for the timestamped sentences. The summary is
   Fireflies' model output — treat it as a draft, not truth.
3. **Extract the revenue signal**, each item backed by a quoted transcript line
   with its timestamp and a deep link
   (`https://app.fireflies.ai/view/{id}?t={seconds}`):
   - Commitments made by us and by the lead (who, what, by when)
   - Objections and stalls, in the lead's exact words
   - Budget, timeline, and decision-maker signals
   - Cancellation risk (hedging, spouse-approval, competitor mentions)
4. **Output the recap** as: 3-line overview → commitments table → objections with
   quotes → recommended next action per item. A recap with no timestamps is not
   proof of work — every claim must be re-listenable.

### `/ff search <query>` — mine the transcript archive

Use `fireflies_search` with its mini grammar (`keyword:"…" scope:sentences
from:YYYY-MM-DD participants:a@x.com limit:20`) to answer questions across
meetings: where cancellations start, which objections recur by zip or source,
who mentioned a competitor, what pricing pushback sounds like this quarter.
Report hits as quote + meeting + timestamp deep link, then the pattern —
never the pattern alone.

### `/ff sync` — route meeting intelligence into the harness

After a recap is confirmed accurate:

- **CRM notes** → format commitments/objections as a note for the lead's record
  via `builderprime-integration` mapping rules (never hardcode field IDs).
- **Follow-up copy** → hand `outbound-iq-sync` the lead's own phrases so the
  drip/follow-up mirrors their language — this is the mirror-paced copy source.
  All send-safety rules in that skill still apply; a transcript never authorizes
  a send.
- **Dialer routing** → surface next-day-set opportunities and callback
  commitments to `five9-ingest` queue priorities.

### `/ff coach [rep | team] [period]` — conversation analytics

Use `fireflies_get_analytics` (team-level needs admin) for talk-listen ratio,
monologue length, filler words, questions asked, sentiment, and WPM, compared
against the prior period. Frame output as coaching, not surveillance: two
strengths, two fixes, each fix tied to a soundbite example
(`fireflies_create_soundbite`) a rep can actually hear.

### `/ff setup` — connect or verify the MCP server

1. Check whether `fireflies_*` tools are already present (claude.ai connector or
   existing registration). If yes, verify with `fireflies_get_user` and stop.
2. If not, register per `references/mcp-endpoint.md` — the repo ships a project
   `.mcp.json` pointing at `https://api.fireflies.ai/mcp`; the user approves it
   and completes auth via `/mcp`.
3. Proof of work: a successful `fireflies_get_user` call showing the connected
   account, and one `fireflies_get_transcripts limit:1` round-trip.

## Rules (non-negotiable)

- **Transcripts are PII.** Meeting content includes customer names, numbers, and
  addresses. Quote only what the task needs; never paste whole transcripts into
  commits, dashboards, or outbound messages.
- **Read-first bias.** Pull tools (`get_*`, `search`) run freely. Tools that
  change state or exposure — `share_meeting`, `update_meeting_privacy`,
  `revoke_meeting_access`, `move_meeting`, `update_meeting_title` — are
  outward-facing: state what will change and confirm first.
- **No bulk outbound from meeting data.** Discovering 40 leads who mentioned
  price does not authorize messaging them (Cole Medine protocol — see
  `builderprime-integration`). Segments born from transcript mining go through
  `outbound-iq-sync` confirmation like any other segment.
- **Summaries are drafts.** Fireflies' AI summary can miss or invert a
  commitment. Anything that drives a CRM update, a send, or a report must be
  verified against the transcript sentence itself.
- **Scoped access only.** Use the OAuth connector or a Fireflies API key for the
  operating account — never a super-admin key for read work, never committed,
  never echoed.

## The "So What?"

Speed-to-lead wins the first contact; meeting intelligence wins everything after
it. The rep who follows up quoting the lead's exact concern, with the commitment
date already in the CRM, holds appointments that others lose — and the coaching
loop turns every recorded call into training data for the next one.
