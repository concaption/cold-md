---
name: cold-research
description: Run per-lead web research on a candidates CSV, write one bundle.md per lead, and emit assignments.json splitting leads into A/B arms for experiments. Uses parallel sub-agents for batches of 10. Spawned by cold-experiment when the experiment design has personalization as the variable, or by the user saying "research these leads", "personalize this list", "build per-lead bundles".
---

# cold-research

Step 2.5 of the cold.md autoresearch suite. Bridges between `cold-leads` (raw imported list) and `cold-draft` (opener generation) with **per-lead observable findings** the draft skill can cite verbatim.

## When to use

- An experiment from `cold-experiment` declares **personalization** as the variable under test
- User says "research each of these leads", "do a personalized opener pass", "find a hook per lead"
- The list is small enough to be worth real research (≤200 leads) — for larger lists, use cheap signals only

## Inputs

- `--candidates <csv>` — CSV of leads to research. Required columns: `id, email, firstName, lastName, company, title`. Optional: `phone, website, linkedinUrl`.
- `--output-dir <path>` — defaults to `.cold/experiments/<currentExperimentId>/research/`
- `--depth light|deep` — `light` is 1 WebSearch per lead (cheap, fast). `deep` adds a second search and a website fetch (slower, finer signal). Default: `light`.
- `--batch-size 10` — leads per parallel sub-agent
- `--max-batches 5` — concurrency cap (5 batches × 10 leads = 50 in parallel)

## Process

### Step 1 — Validate inputs

- Candidates CSV must exist and have required columns. If not: stop, surface schema.
- Output dir parent must exist (the experiment folder). If not: tell user to run `/cold experiment` first.

### Step 2 — Split into batches

Chunk the candidates into batches of `--batch-size` (default 10). Write each batch to `/tmp/cold-research-batches/batch<N>.json` so sub-agents can read independently.

### Step 3 — Spawn parallel research agents

For each batch (up to `--max-batches` running concurrently), spawn a `general-purpose` sub-agent with this prompt skeleton:

```
You are researching <N> dental practice owners for a cold outreach
campaign. Read /tmp/cold-research-batches/batch<N>.json. For each
lead, run ONE WebSearch:

  "<company name>" "<lead name or city>" reviews hours

Pull from the result:
- Practice address / city / state
- Hours of operation (citable specifics — bold the schedule)
- Reviews count + star rating
- Number of doctors / specialty
- Years in practice
- DSO acquisition or rebrand signal
- Unusual schedule pattern (closed Wed, half-day Fri, lunch closure)

If you find a verifiable observable (a specific schedule fact, a real
review pattern, a real practice fact): status: send
If you cannot: status: skip

Write a markdown bundle per lead at <output-dir>/<leadId>.md following
the EXACT template in the existing bundles in that directory. Read one
existing bundle first for format reference.

Constraints: no em dashes (use hyphens with spaces), no emojis, opener
70-100 words, sign-off "Usama" only, do NOT invent stats.

Return summary:
batch<N> complete: X/<batchSize> send, Y/<batchSize> skip
- <leadId>: send | <one-line hook>
- <leadId>: skip | <reason>
```

Run agents with `run_in_background: true`. Wait for all completions before proceeding.

### Step 4 — Aggregate

Read all bundles in `<output-dir>/`. Parse frontmatter to classify by `status`. Build:

- `<output-dir>/../bundles-summary.json`:
  ```json
  {
    "total": 100,
    "send": 88,
    "skip": 12,
    "byStrength": {"high": 70, "medium": 18, "low": 0},
    "skipReasons": {"DSO": 4, "scrape_collision": 5, "not_found": 3}
  }
  ```

### Step 5 — Build arm assignments (if --arms is set)

If invoked with `--arms 50,50` (two-arm experiment) or similar:

Sort send-grade bundles by `signalStrength` (high → medium → low), then by leadId for stability. Take the first N for arm A. Pick another N candidates from the original CSV (excluding any researched lead) for arm B — these get the generic template, no per-lead bundle needed.

Write `<output-dir>/../assignments.json`:

```json
{
  "experimentId": "<id>",
  "createdAt": "YYYY-MM-DD",
  "armA": [{"leadId": "...", "firstName": "...", "email": "...", "signalStrength": "high"}, ...],
  "armB": [{"leadId": "...", "firstName": "...", "email": "...", "score": 13}, ...]
}
```

### Step 6 — Print summary

```
Research complete: 100 candidates → 88 send-grade (88%)
  high signal:   70
  medium signal: 18
  skipped:       12 (4 DSO, 5 scrape collision, 3 not found)

Arm assignments written:
  arm A (personalized): 50 leads
  arm B (generic):      50 leads

Bundles in:    .cold/experiments/<id>/research/
Assignments:   .cold/experiments/<id>/assignments.json

Next:
  /cold draft   Generate per-lead drafts from bundles + arm assignments
  /cold send    Push verified+approved drafts to FoxReach
```

## Bundle template

Each `<leadId>.md` MUST follow this exact shape:

```markdown
---
leadId: <id>
name: <full name>
title: <title>
company: <company>
email: <email>
phone: "<phone>"
city: <city>
researchDate: <YYYY-MM-DD>
signalStrength: <high|medium|low>
status: <send|skip>
---

# <Name>, <DDS|DMD if found> — <Practice>, <City>

## Practice
- Location: <address>
- <solo|two-doc|multi-doc> <specialty>
- <years in practice>
- Reputation: <star rating + review count>
- Hours: **<full schedule>**

## Hook candidates
- **<Strong|Medium|Weak>:** <observable specific>
- **<Strong|Medium|Weak>:** <second hook if available>

## Draft opener
> Hi <FirstName>,
>
> <Cite ONE specific from research>. <Connect to gap framing>.
>
> Buildberg sets up an AI receptionist that <fills the cited gap>, books straight into your calendar, and texts the patient a confirmation. Live in 5 business days.
>
> Worth a 15-min call?
>
> — Usama

## Recommendation
**<Send|Skip>.** <one-line reason>
```

## Skip signals (research agents flag these)

| Signal | Example | Action |
|---|---|---|
| DSO acquisition | Yelp redirects to a chain brand (Fuller Smiles, Aspen, etc.) | skip |
| Scrape collision | Email domain ≠ company domain ≠ phone area code | skip |
| Practice not found | No search results match the company name | skip |
| Wrong-niche contamination | RN/FNP/DNP at non-dental clinic | skip |
| Identity collision | LinkedIn shows different practice than lead row | skip |

These reasons should be recorded in the bundle's `## Recommendation` line so they aggregate cleanly into `bundles-summary.json`.

## Constraints

- Per-lead research is **opt-in** — only runs when explicitly invoked or when `cold-experiment` declares personalization as the variable.
- Real numbers only. If the agent can't find a citable specific, mark `status: skip`. **Do not fabricate hooks.**
- Sub-agents do NOT spawn their own sub-agents. Each agent owns its 10 leads top-to-bottom.
- Sub-agents do NOT commit, do NOT modify files outside `<output-dir>/`, do NOT push to FoxReach.

## Cost budget (light depth)

For 100 leads:
- 100 WebSearch calls × ~$0.005 = ~$0.50
- ~5k input tokens per agent × 5 agents = 25k input tokens
- ~3k output tokens per agent × 5 agents = 15k output tokens
- Wall time: 3-5 minutes (5 agents in parallel)

For 100 leads at deep depth: roughly 3× cost (extra search + website fetch per lead).

## References

- Spec: https://cold.md
- Sister skill: `cold-leads` (provides the candidates CSV)
- Sister skill: `cold-draft` (consumes bundles + assignments to produce per-lead drafts)
- Sister skill: `cold-experiment` (declares whether personalization is in scope)
- Pattern origin: dental-voice-ai 2026-W18 experiment (`09-operations/cold-outreach/dental-voice-ai/.cold/experiments/2026-W18-personalized-opener/`)
