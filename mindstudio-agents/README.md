# MindStudio Agent Fleet — LKS & COSIQ RevOps

The four AI agents that operate the RevOps harness at the customer-facing layer.
Each agent's full build lives in one file here — the prompt IS the product, so it
is version-controlled in this repo, not just in a browser tab. When a prompt needs
fixing, fix it here first, then re-paste into MindStudio (and log the lesson in
the System Evolution Log in `CLAUDE.md`).

## The fleet

| # | Agent name (use exactly) | Job | Runs when |
|---|---|---|---|
| 1 | **Portal Concierge** | Turns a portal visitor conversation into a clean, structured lead | A visitor chats or submits on a client portal |
| 2 | **Speed-to-Lead Responder** | Drafts the 30-second Golden Window SMS + email for a new lead | A new high-intent lead lands |
| 3 | **Lead Qualifier** | Scores and classifies a lead (financing, stay/age-in-place, zip tier, routing) | Right after a lead is sanitized |
| 4 | **Revenue Reporter** | Writes the truth-over-vanity executive revenue brief | Weekly/monthly, or on demand |

## How to build each one (about 5 minutes per agent)

1. Go to **app.mindstudio.ai** and click **New Agent** (or **Create**).
2. Name it **exactly** as listed in the table above.
3. Open the matching file here (e.g. `01-portal-concierge.md`) and copy everything
   inside the "PASTE THIS INTO MINDSTUDIO" block.
4. Paste it as the agent's instructions/prompt.
5. MindStudio will detect the `{{double_curly}}` variables automatically — accept
   them as launch variables.
6. **Publish** the agent.
7. Come back and say "built" — the Zapier connection will see the new agent, and
   Claude will run a live test with sample data and wire it into the pipeline.

## Ground rules baked into every agent (the Cole Medine protocol)

- **Agents draft; the harness sends.** No agent ever claims a message was sent —
  drafts flow back to the governed outbound layer, which requires explicit
  confirmation (segment, count, message) before anything bulk goes out.
- **No invented facts.** No prices, availability, or financing terms unless they
  were provided as input. Unknown stays unknown.
- **Truth over vanity.** The reporter measures Revenue per Zip Code and Agent
  Capacity ROI, never raw lead counts.
- **Structured output.** Agents that feed the pipeline return strict JSON so the
  BuilderPrime/LeadPerfection adapters can consume them without guessing.
