---
name: cold-offer
description: Refine your value proposition (the "## Value" section of cold.md) using competitor pricing, market trends, and case studies. Searches the web for what comparable products charge, what pain points the target market is talking about, and what proof patterns work. Writes findings to .cold/research/ and proposes a tightened one-sentence value statement to commit to offer.md and cold.md. Use when starting a new project after /cold icp, or when the user says "tighten my offer", "refine my value prop", "what should I be charging", "validate my offer".
---

# cold-offer

Step 1.5 of the cold.md autoresearch suite. After ICP, refines the offer.

## When to use

- User has run `/cold icp` and wants to nail the offer before sending
- User says "refine my value prop", "tighten my offer", "what's my pitch"
- Existing `offer.md` is missing or stale (last edit > 30 days)
- User says "what should I be charging" or "is my pricing right"

## Inputs

- `./icp.md` — must exist; run `/cold icp` first if missing
- `./cold.md` — optional; reads the current `## Value` if present
- `.cold/config.json` — `research.maxQueriesPerInvocation` (default 5)

## Process

### Step 1 — Read current state

- Pull audience, vertical, pain signals from `icp.md`
- Pull the current `## Value` line from `cold.md` if it exists
- Note the user's product/service name from cold.md `## Identity`

### Step 2 — Web research (capped at maxQueriesPerInvocation, default 5)

Run these queries in order. Stop when you hit the cap. For each, capture: query, top 3 result titles + URLs, 1-sentence insight.

1. **Competitor pricing**
   `"<niche>" pricing OR cost OR plans`
   Goal: gather the comparable price band. Tells you whether your price is too high, too low, or aligned.

2. **Recent funding / acquisitions in the niche**
   `"<niche>" funding 2026`
   Goal: surface market dynamics — heating up? consolidating?

3. **Pain language (real users)**
   `"<niche> <main pain>" reddit OR g2 OR capterra reviews`
   Goal: capture how users describe the problem in their own words. This is the gold mine for opener language.

4. **Case study format**
   `<niche> case study <pain>`
   Goal: find proof formats that work in your space. Borrow the structure.

5. **Differentiation gaps**
   `"why <competitor>" OR "alternative to <competitor>"`
   Goal: find unmet needs in competitor reviews. These are your differentiation hooks.

### Step 3 — Save findings

Write to `.cold/research/offer-research-<YYYY-MM-DD>.md`:

```markdown
# Offer research — <YYYY-MM-DD>

## Source
- ICP: ./icp.md
- Current cold.md ## Value: "<current value statement, or 'none yet'>"
- Queries run: 5 of 5

## Insights summary
- Pricing band: $X–$Y/mo for comparable products
- Pain phrase repeating across sources: "..."
- Differentiation gap: <competitor> users complain about <thing>; this is unmet
- Case-study pattern that works: "<X> increased <metric> by <Y>% in <time>"

## Findings

### Competitor pricing
- Query: "..."
- Top results:
  1. <title> — <url>
  2. ...
- Insight: ...

### Recent funding / acquisitions
...

(continue per query)

## Risks
- [Anything the research flagged]

## Recommended value-statement angles
1. **Pain-first:** "<one sentence>"
2. **Gain-first:** "<one sentence>"
3. **Mechanism-first:** "<one sentence>"
```

### Step 4 — Synthesize 3 candidate value statements

Each must be:
- **One sentence** (hard rule — if it doesn't fit, the offer isn't clear enough)
- **Specific** — name a metric, a tool, or a number
- **Audience-grounded** — uses language from the pain research (Step 2.3)
- **Free of banned phrases** from `cold.md ## Banned`

Show the user all 3 with a one-line "why this works" each:

```
1. Pain-first: "<sentence>"
   Why: Mirrors the exact phrasing users on r/coldemail used (avg upvotes 200+).

2. Gain-first: "<sentence>"
   Why: Echoes the case-study pattern from <competitor>'s top-grossing landing page.

3. Mechanism-first: "<sentence>"
   Why: Names the specific tool stack the ICP already uses (per icp.md tech signals).
```

Ask: "Which angle fits? (1/2/3 / mix / none — propose another)"

### Step 5 — Write `offer.md`

Use the chosen value statement as the spine. Format:

```markdown
---
coldMdVersion: "0"
updated: <YYYY-MM-DD>
source: cold-offer skill (research log: .cold/research/offer-research-<YYYY-MM-DD>.md)
---

# Offer — <Product Name>

## Value (one sentence)

<the chosen statement>

## Proof points (3-5, drawn from research)

- [Stat or fact 1 with source URL]
- [Stat or fact 2]
- [Stat or fact 3]

## Pain-language quotes (use sparingly in opener)

- "<exact quote from user research>" — <source forum/review>
- "<another quote>"

## Pricing context

- Competitor band: $X–$Y/mo
- Our position: <higher / lower / aligned> because <reason>

## Differentiation hook

<one-line statement of the unmet need we serve that competitors don't>
```

### Step 6 — Update `cold.md`

Replace `## Value` with the chosen one-sentence value. Optionally append/merge proof points to `## Proof` (deduped).

**Diff handling (trust ladder):**

Read `.cold/trust.json`:
- If `autoCommit: true`: apply the diff with `git apply`, append the change to `.cold/decisions.md`.
- Else: write proposed diff to `.cold/proposed-diff.patch`, print:

```
Proposed cold.md edit at .cold/proposed-diff.patch
Review:  cat .cold/proposed-diff.patch
Accept:  git apply .cold/proposed-diff.patch && rm .cold/proposed-diff.patch
Reject:  rm .cold/proposed-diff.patch
```

## Constraints

- **Never invent pricing or facts.** Only cite what the research surfaced. Always include the source URL.
- **Reject value statements that exceed one sentence.** If you can't fit it, the offer isn't sharp enough.
- **Reject value statements that include banned phrases** from `cold.md ## Banned`.
- **Don't run if no `icp.md`.** Stop with: "Run `/cold icp` first — I need the audience to refine the offer."

## Output

- `offer.md` (new or updated)
- `.cold/research/offer-research-<YYYY-MM-DD>.md` (research log)
- `.cold/proposed-diff.patch` (cold.md changes — only if not auto-committing)

## Next step

Once `offer.md` is committed and `cold.md` reflects the new value:
- `/cold leads` to import + score prospects
- or `/cold experiment` to start the autoresearch loop directly

## References

- Spec: https://cold.md
- FoxReach API docs: https://docs.foxreach.io/api-reference
