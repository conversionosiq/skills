#!/usr/bin/env python3
"""PreToolUse guard for credential files.

Registered in .claude/settings.json. Reads the tool-call payload from stdin and
denies any Read/Edit/Write/NotebookEdit/Grep/Glob call whose target path matches
a credential pattern, and any Bash command that references one. Denials are
returned as PreToolUse JSON decisions; everything else passes through silently.

Pattern *names* (strings like "SUPABASE_ACCESS_TOKEN") are intentionally listed
here; credential *values* must never appear anywhere in this repository.
"""

import fnmatch
import json
import os
import re
import sys

# Globs matched case-insensitively against both the basename and the full path.
BLOCKED_PATH_GLOBS = [
    ".env",
    ".env.*",
    "*.env",
    "*.pem",
    "*.key",
    "*.p12",
    "*.pfx",
    "*.keystore",
    "*.ppk",
    "id_rsa*",
    "id_dsa*",
    "id_ecdsa*",
    "id_ed25519*",
    "secrets.*",
    "*.secret",
    "*.secrets",
    "secrets/*",
    "*/secrets/*",
    "*credentials*",
    # Client-specific credential identifiers (names only, never values).
    "*leadperfection_username*",
    "*leadperfection_password*",
    "*outbound_iq_api_key*",
    "*carolina_compass_session_secret*",
    "*builderprime*key*",
    "*builderprime*secret*",
    "*builderprime*token*",
    "*anon_key*",
    "*supabase_access_token*",
    "*supabase_db_password*",
]

# Placeholder/template files are safe to read even when they match a glob above.
ALLOWED_SUFFIXES = (".example", ".sample", ".template")

# Case-insensitive regexes applied to Bash command strings.
BLOCKED_COMMAND_PATTERNS = [
    r"\.env\b(?!\.example|\.sample|\.template)",
    r"\bid_(rsa|dsa|ecdsa|ed25519)\b",
    r"\.(pem|p12|pfx|ppk|keystore)\b",
    r"leadperfection_(username|password)",
    r"outbound_iq_api_key",
    r"carolina_compass_session_secret",
    r"builderprime[_-]?(api[_-]?key|secret|token|password)",
    r"anon_key",
    r"supabase_(access_token|db_password)",
]

PATH_FIELDS = {
    "Read": ("file_path",),
    "Edit": ("file_path",),
    "Write": ("file_path",),
    "NotebookEdit": ("notebook_path",),
    "Grep": ("path",),
    "Glob": ("path",),
}


def deny(reason):
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }))
    sys.exit(0)


def blocked_pattern_for(path):
    normalized = path.replace("\\", "/").lower()
    basename = os.path.basename(normalized)
    if basename.endswith(ALLOWED_SUFFIXES):
        return None
    for pattern in BLOCKED_PATH_GLOBS:
        p = pattern.lower()
        if fnmatch.fnmatch(basename, p) or fnmatch.fnmatch(normalized, p):
            return pattern
    return None


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        # Malformed payload: fall through to the permissions.deny rules in
        # .claude/settings.json rather than bricking every tool call.
        return

    tool = payload.get("tool_name", "")
    tool_input = payload.get("tool_input") or {}

    if tool in PATH_FIELDS:
        for field in PATH_FIELDS[tool]:
            target = str(tool_input.get(field) or "")
            if not target:
                continue
            pattern = blocked_pattern_for(target)
            if pattern:
                deny(
                    "Blocked: '{}' matches protected credential pattern '{}'. "
                    "Credential files are never read, edited, or committed in "
                    "this workspace.".format(target, pattern)
                )
    elif tool == "Bash":
        command = str(tool_input.get("command") or "")
        for pattern in BLOCKED_COMMAND_PATTERNS:
            if re.search(pattern, command, re.IGNORECASE):
                deny(
                    "Blocked: this command references a protected credential "
                    "pattern ({}). Credential files and secret values are "
                    "off-limits to tool calls in this workspace.".format(pattern)
                )


if __name__ == "__main__":
    main()
