# Multi-Client Isolation Architecture

How Lauren Kingsley Strategy / ConversionOS IQ keeps Claude Code work for
different clients isolated from each other and away from production credentials.

## The model: one repository, one session, one client

Claude Code scopes a session to the repository it is attached to. Isolation
falls out of that naturally when each client's work lives in its own repository
and each session is attached to exactly one of them:

| Context | Repositories |
|---|---|
| Internal (Lauren Kingsley Strategy / ConversionOS IQ) | `conversionosiq/skills` (this repo), `Lauren-Kingsley` master repo |
| Carolina Home Remodeling (CHR) | Carolina Production App repo |
| Privacy Fence Company (West MI) | Privacy Fence / Lovable portal repo |
| Aully Command / Carolina | `Aully-Command` repo |

Rules that make the model hold:

1. A session works on one client's repository. Cross-client work happens in a
   separate session attached to the other repository — never by cloning a second
   client's code into the first client's session.
2. Every repository carries its own `CLAUDE.md` (client-specific context, kept
   under 150 lines), `.claude/settings.json` (deny rules + hook registration),
   `.claude/hooks/protect_secrets.py`, and `.gitignore`.
3. Credential values live in each client's secret manager or in git-ignored
   local `.env` files — never in any repository, CLAUDE.md, or commit message.

## Requested mechanisms vs. what Claude Code actually supports

The original setup request asked for a `.claudeignore` file and a `.clauderc`
hook config. Neither is a Claude Code mechanism, so this repository implements
the supported equivalents:

| Requested | Implemented instead |
|---|---|
| `.claudeignore` "vault gate" | `permissions.deny` rules in `.claude/settings.json`. These are enforced by the Claude Code harness itself: a denied `Read`/`Edit`/`Write` never executes. |
| `.clauderc` PreToolUse hook | Hook registration in `.claude/settings.json` (the supported location), running `.claude/hooks/protect_secrets.py`. |

## The three protection layers in this repository

1. **`permissions.deny` rules** (`.claude/settings.json`) — the harness refuses
   `Read`/`Edit`/`Write` calls on `.env*`, private keys, certificates, `secrets/`
   directories, and client credential identifiers before any hook runs.
2. **PreToolUse hook** (`.claude/hooks/protect_secrets.py`) — catches what deny
   rules cannot: `Bash` commands that reference credential files or identifiers
   (`cat .env`, anything mentioning `leadperfection_password`,
   `supabase_access_token`, etc.), plus `Grep`/`Glob`/`NotebookEdit` targets.
   `.example` / `.sample` / `.template` files are exempt so placeholder configs
   stay readable.
3. **`.gitignore`** — the same credential patterns never enter version control,
   so there is nothing sensitive for a session to find in history.

Token burn is handled by the same deny/ignore patterns for the heavy offenders
(`node_modules/`, `dist/`, `build/`, `.next/`, logs). Claude Code does not index
the repository up front, so ignore patterns matter most for search and glob
operations.

## Rolling this into a client repository

1. Copy `.claude/` and `.gitignore` from this repository into the client repo.
2. Narrow the broad client patterns to credential-bearing names. In particular,
   `*builderprime*` blocks any file whose *name* contains "builderprime" — in
   the Privacy Fence repo that would block the integration source code itself.
   There, replace it with patterns like `*builderprime*key*` and rely on the
   `.env*` rules for the actual credentials. The same applies to
   `*leadperfection*`-style patterns in the CHR repo if source files carry those
   names.
3. Write that repository's `CLAUDE.md` from the matching template below, filling
   the placeholders from the client's real systems. Do not paste credential
   values, connection strings, or session tokens into it.
4. Verify the hook fires: from the client repo root, ask a session to read
   `.env` — the call should be denied with the hook's reason string.

## Client CLAUDE.md templates

Placeholders are marked `[FILL IN]`. Facts about client systems belong to the
client repo's author — nothing here should be invented.

### Carolina Home Remodeling (CHR)

```markdown
# CLAUDE.md — Carolina Production App

This repository is the production application for Carolina Home Remodeling.
The active client context is CHR only; internal and other-client work lives in
separate repositories.

The stack is [FILL IN: languages, frameworks, runtime versions].
LeadPerfection integration: the app talks to [FILL IN: endpoints/models used].
Outbound iQ syncs run [FILL IN: cadence and direction of each sync].
Carolina Compass sessions are structured as [FILL IN: session model].
Credentials for all three systems come from [FILL IN: secret manager / env],
which is git-ignored and deny-listed in .claude/settings.json.
```

### Privacy Fence Company (West MI)

```markdown
# CLAUDE.md — Privacy Fence Portals

This repository holds the Lovable portals and BuilderPrime integration for
Privacy Fence Company. The active client context is Privacy Fence only.

Frontend assets are synced from Lovable via [FILL IN: sync folder/flow].
BuilderPrime integration: [FILL IN: endpoints and object mappings used].
The BuilderPrime API key comes from [FILL IN: secret manager / env], which is
git-ignored and deny-listed in .claude/settings.json.
```

### Aully Command / Carolina

```markdown
# CLAUDE.md — Aully-Command

This repository backs the Aully Command Replit environments. The active client
context is Aully Command only.

Replit setup: [FILL IN: workspaces, run commands, deploy flow].
Replit logins and tokens are never stored in this repository; they come from
[FILL IN: secret manager / env] and are deny-listed in .claude/settings.json.
```
