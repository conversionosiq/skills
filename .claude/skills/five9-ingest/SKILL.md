---
name: five9-ingest
description: Five9 dialer optimization — align lead arrival curves with call-center agent capacity, tune queue priority, and generate ACD reports that expose Lost Time Silos. Use whenever the user types a /five9 command (optimize, report), asks about dialer queues, call routing, arrival curves, agent capacity, next-day set rates, ACD data, speed-to-lead call performance, or why the call center is busy but appointments aren't holding — even if they don't say "Five9".
---

# Five9 Dialer Optimization

Purpose: align arrival curves with agent capacity. The dialer's job is not to fill
calendars — it is to connect high-intent leads to the right rep inside the
**30-second golden window** and to set appointments that actually hold.

## Commands

### `/five9 optimize` — queue priority tuning

Adjust queue priority based on real-time arrival velocity:

1. **Read the arrival curve.** Pull or ask for the current arrival data (leads per
   half-hour by source). Identify the peaks and compare against staffed agent
   capacity for the same intervals.
2. **Prioritize by Next Day Set %.** Rank sources and queues by the share of leads
   that can be booked within 24 hours. Leads set for tomorrow cancel far less than
   leads set for next week — a calendar full of far-out appointments is a vanity
   metric hiding future cancellations.
3. **Route high-intent inbound first.** Tag inbound calls by source; route
   recognized high-intent sources (form fills, quote requests, transferred SMS
   replies from `outbound-iq-sync`) to high-EQ reps immediately, ahead of outbound
   redial attempts.
4. **Propose concrete priority changes.** Output a specific before/after queue
   priority table with the reasoning for each change. Changes to a live dialer
   config are outward-facing — present the table and get confirmation before
   applying anything to a production system.

### `/five9 report` — ACD reporting

Generate ACD analysis aimed at finding **Lost Time Silos** — intervals where leads
waited, agents idled, or handoffs stalled:

- Arrival volume vs. staffed capacity by interval (where did we drown? where did we idle?)
- Speed-to-answer distribution, with the % answered inside the golden window
- Next Day Set % by source and by rep
- Abandon rate and callback backlog by interval
- Transfer/handoff points where a lead crossed departments and waited

For each silo found, name the dollar cost in plain terms (missed golden-window
connects × set rate × average job value) and the smallest fix that closes it.

## Data access

If a Five9 API/report export or an MCP connector is available in the environment,
use it. If not, ask the user for the ACD export (CSV) and analyze that — never
fabricate call-center numbers. State clearly which data source the analysis used.

## The "So What?"

Optimizing the dialer prevents the call center from merely filling calendars with
low-quality appointments. Every recommendation must protect marketing capital by
spending agent time on leads that stay on the board.
