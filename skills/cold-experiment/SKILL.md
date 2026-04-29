---
name: cold-experiment
description: Design the next A/B experiment for the autoresearch loop. Reads the current tier from .cold/config.json, picks the variable to test, drafts arm specs (e.g. statement vs. question subject lines), declares sample size + success criteria, and writes a protocol to .cold/experiments/. Use after /cold offer and before /cold draft. The experiment protocol is what cold-draft reads to generate variant pairs. Use when the user says "design the next experiment", "what should we test next", "set up the A/B", or "/cold experiment".
---

# cold-experiment

Step 5 of the cold.md autoresearch suite — designs the next experiment.

## When to use

- User has run `/cold init` (.cold/config.json exists)
- User has at least `cold.md` and `icp.md` populated
- User says "design the next experiment", "what should we test", "/cold experiment"
- The previous experiment has either declared a winner OR no experiment is active yet

## Inputs

- `.cold/config.json` — `experiments.currentTier`, sample sizes, etc.
- `.cold/beliefs.md` — current best-known patterns (informs whether tier prereqs are met)
- `cold.md` — current value, voice (informs arm bounds — variants must respect ## Banned and ## Voice)

## Process

### Step 1 — Determine current tier

Read `experiments.currentTier` from `.cold/config.json` (default 1).

### Step 2 — Verify tier prerequisites

If `currentTier > 1`, the previous tier must have a stable winner in `.cold/beliefs.md`. A "stable winner" is a `decision.md` with status `winner` and `applied: true` for that variable.

If prerequisites not met:

```
Tier <N> requires Tier <N-1> to have a stable winner first.
Current state: <whatever beliefs.md shows>.
Either run `/cold experiment` against the existing active experiment, or
manually set experiments.currentTier in .cold/config.json to override.
```

Stop.

### Step 3 — Pick the variable for this tier

| Tier | Variable | Default arm patterns |
|---|---|---|
| 1 | `subject` | `statement` vs `question` (or `statement` vs `number-led`) |
| 2 | `opener` | `compliment` vs `observation` vs `direct-ask` (pick 2) |
| 3 | `cta` | `calendar-link` vs `reply-to-confirm` vs `low-friction-yes-no` (pick 2) |
| 4 | `cadence` | `3-day` vs `5-day` vs `7-day` between bumps (pick 2) |
| 5 | `tone` | `casual` vs `formal` (manual unlock only — high risk) |

For Tier 5: refuse to advance unless user passes `--allow-tier-5`. Print a warning about voice changes affecting the brand.

### Step 4 — Draft 2 arm specs

For tier 1 (subject), example output:

```yaml
# .cold/experiments/<id>/protocol.md
---
id: 2026-W18-subject-statement-vs-question
created: 2026-04-29
variable: subject
hypothesis: |
  Question-style subjects will produce a higher interested-reply rate
  than statement-style subjects in the <vertical> niche, because <reason>.

arms:
  - id: arm_a_statement
    label: Statement
    pattern: |
      Declarative subject, < 8 words, ends without punctuation.
    example: 5x your reply rate without burning your domain
  - id: arm_b_question
    label: Question
    pattern: |
      Question subject, < 8 words, ends with ?
    example: Reply rate stuck under 2 percent?

sample_size_per_arm: 100        # from config.experiments.minSamplePerVariant
min_days_before_read: 7         # from config.experiments.minDaysBeforeRead
significance_level: 0.05
min_delta_pp: 2                 # minimum |delta| in percentage points

guard:
  bounce_rate_max: 0.05         # from config.guards.bounceRateThreshold
  not_interested_rate_max: 0.30 # from config.guards.notInterestedRateThreshold

success_criteria:
  test: two-proportion z-test on interested-reply rate
  alpha: 0.05
  decision_rule: |
    Winner declared when:
      |delta| > min_delta_pp
      AND p < alpha
      AND lower bound of 95% CI excludes zero

extension_policy:
  max_extensions: 2             # extend sample by 50% up to 3x cap
  extension_step_pct: 50

advance_tier_on_winner: false   # cold-learn will not auto-advance; user must opt in
---

## Hypothesis (prose)

In the <vertical> niche, prospects in <ICP audience> are more likely to
reply with intent ("interested") to a question subject than to a statement
subject because [reasoning grounded in icp.md pain signals + research].

## Arms (full prose)

### arm_a_statement
- Subject pattern: declarative, < 8 words, no question mark
- Example: "5x your reply rate without burning your domain"
- Why this might win: clear value claim, reads like a competitor positioning

### arm_b_question
- Subject pattern: question, < 8 words, ends with ?
- Example: "Reply rate stuck under 2 percent?"
- Why this might win: pattern-interrupt, mirrors prospect's internal monologue

## What's held constant
- Body
- CTA
- Send time
- Sender accounts
- Cadence
- Tone

## How cold-draft reads this
For each lead in `.cold/import.csv`, generate two emails — same body, same
CTA, same everything except the subject line, which matches the arm's
pattern. Output to `.cold/drafts/<campaignId>/arm_a_statement/<leadId>.md`
and `.cold/drafts/<campaignId>/arm_b_question/<leadId>.md`.
```

### Step 5 — Compute experiment id

Format: `<YYYY>-W<week>-<variable>-<arm-a-short>-vs-<arm-b-short>`

Example: `2026-W18-subject-statement-vs-question`

Use the ISO 8601 week number based on today's date.

### Step 6 — Write the protocol

```bash
mkdir -p .cold/experiments/<id>
# Write the YAML+prose to .cold/experiments/<id>/protocol.md
```

### Step 7 — Mark active

```bash
echo <id> > .cold/experiments/.active
```

If a previous experiment was active and not yet concluded, ask the user first: "An experiment is already in flight (`<old-id>`). Conclude it via /cold learn before designing a new one. Override? (y/N)"

### Step 8 — Print summary

```
Experiment designed: 2026-W18-subject-statement-vs-question
  Variable: subject pattern
  Arms: Statement vs. Question
  Sample size: 100 leads per arm (200 total sends)
  Decision in: 7 days minimum
  Statistical test: two-proportion z-test, alpha=0.05, min delta 2pp
  Guards: bounce <5%, not-interested <30%

Next: /cold draft (generates variant pairs from this protocol)
```

## Constraints

- Only **one** active experiment at a time. Concurrent experiments confound results.
- Only **one** variable per experiment (single-factor only in v0).
- Tier ladder is strict — no skipping unless user manually overrides `currentTier` in config.
- Tier 5 (voice) requires explicit `--allow-tier-5` flag.
- Arms must respect `cold.md ## Voice` and `## Banned`.

## Output

- `.cold/experiments/<id>/protocol.md`
- `.cold/experiments/.active` (one-line file containing `<id>`)

## References

- Spec: https://cold.md
- Statistical decision rule: see `.cold/experiments/<id>/protocol.md` `success_criteria` block
- cold-learn (consumes this output): `/cold learn` after the min-days window
