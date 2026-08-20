# CLAUDE.md — conversionosiq/skills

## Repository identity

This is the internal skills repository for Lauren Kingsley Strategy / ConversionOS IQ,
in the `conversionosiq` GitHub organization. The active client context for any session
attached to this repository is **Internal** — never a client engagement.

Work for client environments lives in separate repositories and separate sessions:

| Client | Systems | Where the work lives |
|---|---|---|
| Carolina Home Remodeling (CHR) | Carolina Production App, LeadPerfection CRM, Outbound iQ, Carolina Compass | CHR's own repository |
| Privacy Fence Company (West MI) | Lovable portals, BuilderPrime CRM | Privacy Fence's own repository |
| Aully Command / Carolina | Replit environments | `Aully-Command` repository |

Client system details (LeadPerfection API models, Outbound iQ sync cadences,
BuilderPrime endpoint mappings, Lovable sync folders, Carolina Compass session
structures) are documented in each client repository's own CLAUDE.md, not here.
This file stays client-agnostic. `docs/multi-client-isolation.md` describes the
overall architecture and how each client repository gets its own copy of this
configuration.

## What lives here

Custom Claude Code skills used across the practice. Each skill is a directory
containing a `SKILL.md` with YAML frontmatter (`name`, `description`) plus any
supporting files:

```
<skill-name>/
  SKILL.md
  references/        # optional supporting docs
  scripts/           # optional helper scripts
```

Skill descriptions state what the skill does and when it triggers. Skill bodies
reference client systems generically; they never embed client data, live URLs to
private systems, or credentials.

## Session security configuration

- `.claude/settings.json` carries `permissions.deny` rules that prevent reading
  or editing credential-pattern files (`.env*`, private keys, certificates,
  client credential identifiers), and registers a PreToolUse hook.
- `.claude/hooks/protect_secrets.py` is that hook: it inspects Read, Edit,
  Write, NotebookEdit, Grep, and Bash calls and denies any that targets a
  credential-pattern file or references a known credential identifier.
- `.gitignore` keeps the same credential patterns out of version control.

## Credential handling

- Credential values are never committed to this repository — not in skills,
  docs, examples, commit messages, or this file. Pattern *names* (the string
  `SUPABASE_ACCESS_TOKEN`, for example) may appear in blocklists; values may not.
- Client credentials (LeadPerfection logins, BuilderPrime API keys, Outbound iQ
  keys, Supabase tokens, Replit logins) belong in each client's secret manager
  or in git-ignored local `.env` files inside that client's own repository.
- Sessions attached to this repository have GitHub scope limited to
  `conversionosiq/skills` and do not reach client repositories.

## Conventions

- Python scripts target Python 3.10+ with no third-party dependencies unless a
  skill's own documentation states otherwise.
- Markdown uses ATX headings and wraps near 100 columns.
- Commits are small and descriptive; one skill added or changed per pull request.
