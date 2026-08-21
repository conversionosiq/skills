#!/usr/bin/env python3
"""LeadPerfection ingestion helpers: schema-drift check and lead sanitization.

Deterministic pieces of the lp-ingest skill. Standard library only.

Usage:
  python3 lp_ingest.py check    --csv leads.csv --schema schema.json [--threshold 5]
  python3 lp_ingest.py sanitize --csv leads.csv --schema schema.json --out leads.clean.csv

Exit codes:
  0  OK
  1  usage / file error
  2  schema drift beyond threshold (halt the import)
"""

import argparse
import csv
import json
import re
import sys


def load_schema(path):
    with open(path, encoding="utf-8") as f:
        schema = json.load(f)
    required = schema.get("required_headers", [])
    optional = schema.get("optional_headers", [])
    aliases = {k.strip().lower(): v for k, v in schema.get("aliases", {}).items()}
    threshold = schema.get("drift_threshold_pct", 5)
    return required, optional, aliases, threshold


def canonicalize(header, required, optional, aliases):
    """Map a raw CSV header to its canonical schema name, or None if unknown."""
    key = header.strip().lower()
    if key in aliases:
        return aliases[key]
    for name in list(required) + list(optional):
        if key == name.strip().lower():
            return name
    return None


def read_headers(csv_path):
    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        try:
            return next(reader)
        except StopIteration:
            sys.exit("ERROR: CSV file is empty: %s" % csv_path)


def cmd_check(args):
    required, optional, aliases, threshold = load_schema(args.schema)
    if args.threshold is not None:
        threshold = args.threshold
    raw_headers = read_headers(args.csv)

    found = {}
    unexpected = []
    for h in raw_headers:
        canon = canonicalize(h, required, optional, aliases)
        if canon:
            found[canon] = h
        elif h.strip():
            unexpected.append(h)

    missing = [r for r in required if r not in found]
    drift_pct = (len(missing) + len(unexpected)) / max(len(required), 1) * 100

    print("Schema drift report")
    print("  required headers : %d" % len(required))
    print("  matched          : %d" % (len(required) - len(missing)))
    print("  missing required : %s" % (", ".join(missing) if missing else "none"))
    print("  unexpected extras: %s" % (", ".join(unexpected) if unexpected else "none"))
    print("  drift            : %.1f%% (threshold %.1f%%)" % (drift_pct, threshold))

    if missing or drift_pct > threshold:
        print("RESULT: DRIFT DETECTED — HALT. Do not import this file.")
        print("Likely cause: the LP export changed, or schema.json is stale.")
        return 2
    print("RESULT: OK — headers match the schema. Safe to sanitize/import.")
    return 0


def norm_phone(raw):
    digits = re.sub(r"\D", "", raw or "")
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    return digits if len(digits) == 10 else ""


def norm_email(raw):
    email = (raw or "").strip().lower()
    return email if re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email) else ""


def cmd_sanitize(args):
    required, optional, aliases, _ = load_schema(args.schema)
    with open(args.csv, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        raw_fields = reader.fieldnames or []
        rows = list(reader)

    # Rename raw headers to canonical names where recognized.
    rename = {}
    for h in raw_fields:
        canon = canonicalize(h, required, optional, aliases)
        rename[h] = canon if canon else h
    out_fields = [rename[h] for h in raw_fields]
    if "IngestFlag" not in out_fields:
        out_fields.append("IngestFlag")

    seen = set()
    cleaned, flagged, dupes = [], 0, 0
    for row in rows:
        r = {rename[k]: (v or "").strip() for k, v in row.items() if k is not None}
        r["Phone1"] = norm_phone(r.get("Phone1", ""))
        if "Phone2" in r:
            r["Phone2"] = norm_phone(r.get("Phone2", ""))
        r["Email"] = norm_email(r.get("Email", ""))

        if not r["Phone1"] and not r["Email"]:
            r["IngestFlag"] = "NO_CONTACT_METHOD"
            flagged += 1
        else:
            r["IngestFlag"] = ""

        key = (r["Phone1"], r["Email"])
        if key != ("", "") and key in seen:
            dupes += 1
            continue
        seen.add(key)
        cleaned.append(r)

    with open(args.out, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=out_fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(cleaned)

    print("Sanitize report")
    print("  rows in            : %d" % len(rows))
    print("  rows out           : %d -> %s" % (len(cleaned), args.out))
    print("  duplicates dropped : %d" % dupes)
    print("  flagged no-contact : %d" % flagged)
    return 0


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="cmd", required=True)

    c = sub.add_parser("check", help="compare CSV headers against schema.json")
    c.add_argument("--csv", required=True)
    c.add_argument("--schema", required=True)
    c.add_argument("--threshold", type=float, default=None,
                   help="drift %% threshold (overrides schema.json)")

    s = sub.add_parser("sanitize", help="normalize, flag, and dedupe leads")
    s.add_argument("--csv", required=True)
    s.add_argument("--schema", required=True)
    s.add_argument("--out", required=True)

    args = p.parse_args()
    sys.exit(cmd_check(args) if args.cmd == "check" else cmd_sanitize(args))


if __name__ == "__main__":
    main()
