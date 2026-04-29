---
name: cold-send
description: Push the active campaign to FoxReach — creates sequences, registers variants from cold-draft output, runs pre-flight checks (banned-phrase lint, audience check, plan-limit math, bounce-rate guard), and starts the campaign. Use after /cold leads + /cold draft. Replaces v0 stub.
---

# cold-send

Step 4 of the cold.md autoresearch suite. Turns drafts + leads into a live FoxReach campaign.

## When to use

- User has run `/cold leads` (writes `.cold/last-import.json`)
- User has run `/cold draft` (writes `.cold/drafts/<campaignId>/`)
- User says "ship it", "send", "launch", "go live"

## Inputs

- `.cold/last-import.json` — campaign id from cold-leads
- `.cold/drafts/<campaignId>/arm_*/` — variant drafts from cold-draft (experiment mode), OR a single set of drafts (no experiment)
- `cold.md` (`## Sequence` section for cadence)
- `.cold/experiments/.active` (optional — points at active experiment)
- `.cold/config.json` — guards thresholds
- `FOXREACH_API_KEY`

## Pre-flight checks (ALL must pass — stop on first failure)

### Check 1 — Banned-phrase lint

For every draft in `.cold/drafts/<campaignId>/`, scan body + subject against `cold.md ## Banned`. Any match = stop, print which file failed, ask user to re-run `/cold draft`.

### Check 2 — Audience check

For every lead in `.cold/import.csv`, verify ICP fit (already done by cold-leads, but re-verify the threshold). Any lead with `fit_score < 0.5` should not be in `import.csv`. If found: stop, ask user to re-run `/cold leads`.

### Check 3 — Plan limits

```bash
foxreach analytics workspace-stats --json
```

Confirm `monthlyEmailsRemaining >= total_planned_sends`. Total = leads × sequence_steps. If insufficient: stop, print the gap.

### Check 4 — Bounce-rate guard

For each sender account assigned to the campaign, fetch 7-day bounce rate:

```bash
foxreach analytics account-stats --account <id> --since 7d --json | jq '.bounceRate'
```

If any account `> config.guards.bounceRateThreshold` (default 0.05): stop with the account that failed, suggest re-warming or swapping.

### Check 5 — Domain warmup

For each sender, check `warmupScore >= 70`:

```bash
foxreach accounts get <id> --json | jq '.warmupScore'
```

If any account `< 70`: warn but allow user to override with `--force-warmup`.

### Check 6 — Duplicate check

Query FoxReach for any leads already contacted in the last 90 days:

```bash
# Pseudo — exact CLI subcommand depends on what foxreach-cli exposes
foxreach leads list --emails @.cold/import.csv --contacted-since 90d --json
```

Any matches: stop, print the duplicates, ask user to clean the CSV or `--allow-duplicates` to override.

## Process (after pre-flight)

### Step 1 — Create FoxReach sequences matching `cold.md ## Sequence`

Parse the sequence section. For each step, build the sequence body JSON:

```json
{
  "stepNumber": 1,
  "delayDays": 0,
  "subject": "<from arm_a_*/[any].md if experiment, else default cold.md template>",
  "body": "<same>"
}
```

Push:

```bash
foxreach sequences add --campaign $CAMPAIGN_ID --json @step1.json
```

Capture each `sequenceId` from the output.

### Step 2 — Register variants per sequence step

If experiment is active: for each `arm_<x>_<descriptor>/` directory under `.cold/drafts/<campaignId>/`, register a variant:

```json
{
  "label": "arm_a_statement",
  "subject": "<arm-a subject template>",
  "body": "<arm-a body template>",
  "weight": 50
}
```

Push:

```bash
foxreach variants add --campaign $CAMPAIGN_ID --sequence $SEQ_ID --json @arm_a.json
```

Capture each `variantId`.

If no experiment: skip variants (the sequence step itself is the only variant).

### Step 3 — Verify

```bash
foxreach sequences list --campaign $CAMPAIGN_ID --json
```

Confirm steps + variants registered correctly. If anything's off: print and stop.

### Step 4 — Start the campaign

```bash
foxreach campaigns start $CAMPAIGN_ID
```

### Step 5 — Save state

Write `.cold/last-send.json`:

```json
{
  "campaignId": "...",
  "experimentId": "<id from .cold/experiments/.active>" or null,
  "sequenceIds": ["seq_...", "seq_..."],
  "variantIds": {
    "arm_a_statement": "var_...",
    "arm_b_question":  "var_..."
  },
  "sentAt": "2026-04-29T...",
  "leadCount": 87
}
```

### Step 6 — Print confirmation

```
✓ Campaign cmd_abc123 ("Q2 SaaS founders") is live.
  Sequences: 3 (opener, bump, breakup)
  Variants: 2 (arm_a_statement vs arm_b_question)
  Leads: 87 (split 50/50)
  First sends: scheduled within the hour

Watch progress:
  /cold status              How is the experiment going?
  /cold triage              Any replies arriving?
  /cold learn               Read the experiment in 7 days
```

## Fallback contract (CLI → curl → docs)

Same pattern as cold-leads:

1. Cached OpenAPI: `jq '.paths."/<path>"' .cold/docs-cache/foxreach-openapi.json`
2. Raw curl: `curl -X POST https://api.foxreach.io/api/v1/<path> -H "Authorization: Bearer $FOXREACH_API_KEY"`
3. Docs: `WebFetch https://docs.foxreach.io/api-reference/<resource>/<action>` (e.g. `/campaigns/start-campaign`)

Never guess endpoint paths. If all three fail: surface the error and stop.

## Constraints

- Pre-flight checks are **all** mandatory. No `--skip-preflight`. Bounce guard is non-negotiable.
- Don't start a paused/dead-domain account.
- Don't push more sends than the plan allows. Plan-limit math comes from FoxReach, not local guesses.
- If the user wants to ship without an experiment (simple campaign), it works — the variant step just collapses to one default arm.

## Output

- Live campaign in FoxReach
- `.cold/last-send.json`

## References

- Spec: https://cold.md
- FoxReach campaigns docs: https://docs.foxreach.io/api-reference/campaigns/start-campaign
- FoxReach sequences docs: https://docs.foxreach.io/api-reference/campaigns/list-sequences
