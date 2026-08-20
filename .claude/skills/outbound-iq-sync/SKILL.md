---
name: outbound-iq-sync
description: Outbound IQ speed-to-lead execution — the real-time SMS/email trigger layer that hits the 30-second Golden Window for high-intent inbound leads, plus high-EQ drip campaigns for aged leads. Use whenever the user types an /iq command (sync, campaign), asks about speed-to-lead, lead follow-up timing, SMS or email templates for leads, drip sequences, nurture cadences, or re-engaging aged leads — even if they just say "follow up with these leads faster".
---

# Outbound IQ Sync

Purpose: real-time, high-EQ speed-to-lead execution. Speed-to-lead is the margin of
victory — a lead contacted inside 30 seconds is still on your website, still in the
mindset that made them raise their hand.

## Commands

### `/iq sync` — real-time follow-up for high-intent inbounds

1. **Confirm the trigger source.** New high-intent inbounds come from the sanitized
   `lp-ingest` output or the portal webhook (`builderprime-integration`) — never
   from an unvalidated raw list.
2. **Enforce the Golden Window.** The SMS/email trigger must fire within 30 seconds
   of lead creation, 100% of the time. If the current wiring can't guarantee that
   (batch jobs, polling intervals), flag it as the leak to fix before tuning copy.
3. **Route by classification.** Use the `lp-ingest` consumer-shift classification:
   "Stay in Place" (tech-savvy) leads get digital-first sequences; "Age in Place"
   leads get a phone-first touch (coordinate with `five9-ingest` routing) with SMS
   as backup.
4. **High-EQ, mirror-paced copy.** Templates mirror the lead's own language and
   energy — reference what they actually asked about, in the register they used.
   Short, human, one clear next step. No robotic scripting, no ALL-CAPS urgency.

### `/iq campaign` — drip sequences for aged leads

Manage re-engagement drips using **relatable language**:

- Segment aged leads by classification and last-touch recency before writing a
  single message; a 30-day-old quote request and a 9-month-old brochure download
  are different conversations.
- Write sequences that acknowledge the gap honestly ("when we talked in the spring…")
  rather than pretending continuity. Relatable beats clever.
- Space touches to reduce friction: each message should be answerable in one tap
  (a reply, a booking link), never a form.

## Send-safety rules (non-negotiable)

These exist because of the Cole Medine incident (see `builderprime-integration`):
an agent once mass-emailed a discount code by misreading a task.

- **Never trigger a bulk send without explicit, same-session confirmation** that
  names the segment, the count, and the message. "Send the campaign" is not
  specific enough — confirm "send message X to the 214 leads in segment Y".
- **Test-send first.** One message to an internal number/inbox, verified, before
  any segment send.
- **Scoped keys only** for the messaging provider — send-only, scoped to the
  campaign list, never an account-wide key.
- **Respect opt-outs and quiet hours.** Suppression lists are applied before every
  send, no exceptions.
- Report the proof of work after every send: segment, count, delivery rate, replies.
