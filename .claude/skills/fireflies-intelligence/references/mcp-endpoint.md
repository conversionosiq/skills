# Fireflies MCP Server — Endpoint Reference

Remote MCP server (streamable HTTP): `https://api.fireflies.ai/mcp`

## Registration options

Pick one; the goal is `fireflies_*` tools visible in the session.

1. **claude.ai connector (recommended for Lauren's sessions).** Add Fireflies
   under claude.ai Settings → Connectors and authorize via OAuth. Tools appear
   automatically in web/remote sessions, prefixed `mcp__Fireflies__`.
2. **Project scope (this repo).** The repo root ships `.mcp.json` registering the
   endpoint. On first use Claude Code asks the user to approve the project
   server, then `/mcp` completes authentication.
3. **CLI, any machine:**

   ```bash
   claude mcp add --transport http fireflies https://api.fireflies.ai/mcp
   ```

   Then run `/mcp` inside Claude Code to authenticate (OAuth flow). If your plan
   uses API-key auth instead, attach the key as a header at registration time —
   key comes from Fireflies → Integrations → Fireflies API — and treat it as a
   secret (env var, never committed):

   ```bash
   claude mcp add --transport http fireflies https://api.fireflies.ai/mcp \
     --header "Authorization: Bearer ${FIREFLIES_API_KEY}"
   ```

The underlying data API (same auth key) is GraphQL at
`https://api.fireflies.ai/graphql` — useful only if a deterministic script needs
data outside a Claude session; inside sessions, always prefer the MCP tools.

## Tool surface

Verified against the live server (2026-08). Read tools are safe by default;
tools marked **⚠ write/exposure** change state or who can see a meeting and
require confirmation per the skill's rules.

| Tool | What it does |
|---|---|
| `fireflies_get_user` | Connected account identity — use as the setup proof-of-work |
| `fireflies_get_transcripts` | Query meetings by date/keyword/participants/organizer/channel; returns metadata + summary, max 50, paginated via `skip` |
| `fireflies_get_transcript` | One meeting's timestamped sentences (`[00:05 - 00:08] Speaker: text`); live meetings return a snapshot |
| `fireflies_get_summary` | One meeting's AI summary: keywords, overview, action items (no sentences) |
| `fireflies_search` | Cross-meeting search with the mini grammar (below) |
| `fireflies_get_analytics` | Meeting + conversation metrics (talk-listen, monologues, filler words, sentiment, WPM) vs. prior period; team level needs admin |
| `fireflies_get_user_contacts` | Contacts sorted by most recent meeting |
| `fireflies_get_active_meetings` | Currently live/paused meetings |
| `fireflies_list_channels` / `fireflies_get_channel` | Channel (folder) discovery for scoped queries |
| `fireflies_get_usergroups` | Team user groups |
| `fireflies_get_rule_executions` | Automation-rule run history |
| `fireflies_get_soundbites` | Existing clips |
| `fireflies_create_soundbite` | **⚠ write** — clip a segment (`transcriptId`, start/end seconds, optional privacy `public/team/participants`) |
| `fireflies_share_meeting` | **⚠ exposure** — grant someone access to a meeting |
| `fireflies_revoke_meeting_access` | **⚠ exposure** — remove someone's access |
| `fireflies_update_meeting_privacy` | **⚠ exposure** — change who can see a meeting |
| `fireflies_update_meeting_title` | **⚠ write** — rename a meeting |
| `fireflies_move_meeting` | **⚠ write** — move a meeting between channels |
| `fireflies_fetch` | Generic fetch fallback |

## Search mini grammar (`fireflies_search`)

```
keyword:"exact phrase"   scope:title|sentences|all   (default all)
from:YYYY-MM-DD  to:YYYY-MM-DD
organizers:a@x.com,b@y.com   participants:a@x.com
channel:CHANNEL_ID   mine:true|false
limit:N (max 50)   skip:N
```

Example — cancellation-signal sweep for a client's reps this month:

```
keyword:"cancel" scope:sentences from:2026-08-01 participants:rep@client.com limit:25
```

## Deep links

Every meeting ID links as `https://app.fireflies.ai/view/{id}`; append
`?t={seconds}` (convert the sentence's start timestamp) to open the recording at
that exact moment. Recaps and search reports must carry these links — that is
the re-listenable proof of work.

## Practical limits

- `get_transcripts`/`search` cap at 50 results per call — paginate with `skip`,
  and prefer date/participant filters over crawling.
- Responses default to a token-efficient format (`toon`); request `json` only
  when piping into a deterministic script.
- Team-wide analytics require Fireflies admin on the connected account; without
  it, per-user analytics still work.
