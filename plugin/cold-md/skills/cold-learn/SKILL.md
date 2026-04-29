---
name: cold-learn
description: Read the active experiment's results from FoxReach, run the statistical test, and propose a cold.md diff (or auto-commit if trust earned). Computes interested-reply rate per variant via foxreach inbox categorize-stats, applies a two-proportion z-test, checks guards (bounce rate, not-interested rate), and either writes .cold/proposed-diff.patch or applies it directly. Use 7+ days after /cold send when an experiment is active. Updates beliefs.md and decisions.md. Use when the user says "read the experiment", "/cold learn", "what did we learn", or "is the test done yet".
---

# cold-learn

The autoresearch core. Reads variant stats, decides winner/inconclusive/extend, and proposes a `cold.md` diff under the trust ladder.

## When to use

- User has run `/cold send` and `>= protocol.min_days_before_read` days have passed
- User says "read the experiment", "is the test done", "/cold learn"
- A scheduled cron fires `/cold learn` (Sunday evening recommended)

## Inputs

- `.cold/experiments/.active` — active experiment id
- `.cold/experiments/<id>/protocol.md` — success criteria, arm specs
- `.cold/last-send.json` — campaign + variant ids (from cold-send)
- `.cold/trust.json` — auto-commit eligibility
- `.cold/config.json` — guards thresholds
- `cold.md` — file to potentially edit
- `FOXREACH_API_KEY`

## Process

### Step 1 — Verify experiment is ready to read

```bash
ACTIVE=$(cat .cold/experiments/.active 2>/dev/null)
[ -z "$ACTIVE" ] && { echo "No active experiment. Run /cold experiment first."; exit 0; }

PROTO=.cold/experiments/$ACTIVE/protocol.md
SENT_AT=$(jq -r '.sentAt' .cold/last-send.json)
MIN_DAYS=$(yq '.min_days_before_read' $PROTO)

# Compute now() - sentAt in days; if < MIN_DAYS, stop
```

If not ready: print "Experiment needs N more days" and stop. Do NOT pull stats early — it pollutes intuition.

### Step 2 — Pull stats

```bash
foxreach inbox categorize-stats \
  --campaign $(jq -r '.campaignId' .cold/last-send.json) \
  --group-by variant \
  --json > .cold/experiments/$ACTIVE/results.json
```

Expected response shape (from the new endpoint shipped in foxreach `4ca5dce`):

```json
{
  "data": {
    "groups": [
      { "key": "var_arm_a_statement", "sent": 100, "replied": 8,
        "interested": 5, "not_interested": 2, "out_of_office": 1,
        "bounce": 1, "uncategorized": 0 },
      { "key": "var_arm_b_question", "sent": 100, "replied": 11,
        "interested": 8, "not_interested": 2, "out_of_office": 1,
        "bounce": 1, "uncategorized": 0 }
    ]
  }
}
```

Match `key` against `.cold/last-send.json::variantIds` to identify which arm is which.

### Step 3 — Verify sample size

For each arm, `sent >= protocol.sample_size_per_arm`. If not:

- Either extend the experiment (bump variant weights to keep sending) up to `max_extensions × 50%` of original sample
- Or print "Need N more sends in arm_<x>" and stop

### Step 4 — Compute metrics per arm

```python
interested_rate = interested / sent
bounce_rate = bounce / sent
not_interested_rate = not_interested / sent
```

### Step 5 — Check guards (HARD STOP if breached)

If `bounce_rate > config.guards.bounceRateThreshold` for either arm:

```bash
# Pause the breaching variant
foxreach variants update --campaign $CID --sequence $SEQ --variant $VID --json '{"weight": 0}'
```

Append guard breach to `.cold/decisions.md`. Print alert. Do NOT propose any cold.md changes — the experiment is invalid.

If `not_interested_rate > config.guards.notInterestedRateThreshold`: warn but continue (the opener may still be salvageable; the test result is informative).

### Step 6 — Run two-proportion z-test

```python
from math import sqrt
from scipy.stats import norm  # or use a hardcoded Phi approximation

p_pool = (interested_a + interested_b) / (sent_a + sent_b)
se = sqrt(p_pool * (1 - p_pool) * (1/sent_a + 1/sent_b))
z = (rate_a - rate_b) / se
p_value = 2 * (1 - norm.cdf(abs(z)))

delta_pp = (rate_a - rate_b) * 100
margin = 1.96 * se * 100
ci_95 = (delta_pp - margin, delta_pp + margin)
```

If scipy isn't available in the agent's Bash env, use a Phi approximation (Abramowitz & Stegun 7.1.26 — code in any stats reference).

### Step 7 — Decide outcome

| Condition | Outcome |
|---|---|
| `|delta_pp| < protocol.min_delta_pp` | Inconclusive |
| `p_value > protocol.significance_level` | Inconclusive |
| `lower_ci <= 0 AND upper_ci >= 0` (CI crosses zero) | Inconclusive |
| All three pass + winner has higher interested_rate | **Winner declared** |

### Step 8 — If inconclusive

Append to `.cold/experiments/<ACTIVE>/decision.md`:

```markdown
# Decision — <ACTIVE>

## Status: inconclusive
## Read at: <YYYY-MM-DD>

## Numbers
- arm_a: 100 sent, 5 interested (5.0%)
- arm_b: 100 sent, 8 interested (8.0%)
- Delta: +3.0pp
- p = 0.21
- 95% CI: [-1.7, +7.7]

## Why inconclusive
- p > 0.05 (not significant)
- CI crosses zero
- More data needed

## Next
- Extend by 50% (50 more sends per arm), or
- Declare inconclusive and move to next tier without changing cold.md
```

If extending: bump variant weights; do not advance tier; tell user to wait another min_days_before_read.

### Step 9 — If winner

Write `decision.md`:

```markdown
# Decision — <ACTIVE>

## Status: winner
## Read at: <YYYY-MM-DD>

## Winner: arm_b_question
## Numbers
- arm_a_statement: 100 sent, 5 interested (5.0%)
- arm_b_question:  100 sent, 8 interested (8.0%)
- Delta: +3.0pp
- p = 0.04
- 95% CI: [+0.2, +5.8]

## Proposed cold.md edit

Replace the current `## Sequence` opener subject pattern with:
- Question, < 8 words, ends with ?
- Example: "Reply rate stuck under 2 percent?"

## Updated belief

> Tier 1 (subject): question-style subjects produce a +3.0pp lift in
> interested-reply rate vs statement-style in <vertical>. CI [+0.2, +5.8],
> n=200. Locked.
```

Update `.cold/beliefs.md` (append, don't overwrite):

```markdown
## Tier 1 — Subject
- **Pattern**: Question, < 8 words, ends with ?
- **Lift**: +3.0pp interested-reply rate
- **Confidence**: 95% CI [+0.2, +5.8] (p=0.04)
- **Sample**: n=200 (100 per arm)
- **Source**: 2026-W18-subject-statement-vs-question
- **Concluded**: 2026-04-29
```

Construct the `cold.md` diff (use `git diff`-style patch). Save to `.cold/proposed-diff.patch`.

### Step 10 — Apply diff (trust ladder)

Read `.cold/trust.json`:

```json
{ "approvedDiffStreak": 2, "autoCommit": false }
```

If `autoCommit: true`:

```bash
git apply .cold/proposed-diff.patch
rm .cold/proposed-diff.patch
echo "Auto-committed (streak: $STREAK)" >> .cold/decisions.md
```

If `autoCommit: false`:

```
Diff proposed at .cold/proposed-diff.patch
Review:  cat .cold/proposed-diff.patch
Accept:  git apply .cold/proposed-diff.patch && rm .cold/proposed-diff.patch
Reject:  rm .cold/proposed-diff.patch

Current trust streak: <streak>/<config.trust.autoCommitAfterApprovedStreak>.
After <N> more approvals, diffs will auto-commit.
```

### Step 11 — Streak bookkeeping (runs on every invocation)

Before doing anything else, check if a prior `proposed-diff.patch` exists from the last run:

```bash
PATCH=.cold/proposed-diff.patch
COLD_HASH_PREV=$(jq -r '.coldMdHashAtPropose' .cold/trust.json 2>/dev/null)
COLD_HASH_NOW=$(sha256sum cold.md | awk '{print $1}')

if [ -f "$PATCH" ]; then
  : # patch still pending, no streak change
elif [ -n "$COLD_HASH_PREV" ] && [ "$COLD_HASH_PREV" != "$COLD_HASH_NOW" ]; then
  # patch was applied -> streak += 1
  jq '.approvedDiffStreak += 1' .cold/trust.json > /tmp/t && mv /tmp/t .cold/trust.json
elif [ -n "$COLD_HASH_PREV" ] && [ "$COLD_HASH_PREV" = "$COLD_HASH_NOW" ]; then
  # patch was rejected (deleted without applying) -> streak = 0
  jq '.approvedDiffStreak = 0' .cold/trust.json > /tmp/t && mv /tmp/t .cold/trust.json
fi

# Unlock auto-commit if streak hit threshold
THRESHOLD=$(jq -r '.trust.autoCommitAfterApprovedStreak' .cold/config.json)
STREAK=$(jq -r '.approvedDiffStreak' .cold/trust.json)
if [ "$STREAK" -ge "$THRESHOLD" ]; then
  jq '.autoCommit = true' .cold/trust.json > /tmp/t && mv /tmp/t .cold/trust.json
fi
```

When proposing a new diff, snapshot the current cold.md hash:

```bash
jq --arg h "$(sha256sum cold.md | awk '{print $1}')" \
   '.coldMdHashAtPropose = $h' .cold/trust.json > /tmp/t && mv /tmp/t .cold/trust.json
```

### Step 12 — Mark experiment complete + advance tier

If winner: clear `.cold/experiments/.active`. If `config.experiments.autoAdvanceTier == true`, bump `currentTier += 1` in config.

### Step 13 — Append to decisions.md

```markdown
## 2026-04-29 — Tier 1 / subject

**Experiment**: 2026-W18-subject-statement-vs-question
**Outcome**: winner = arm_b_question
**Numbers**: 8.0% vs 5.0% interested (+3.0pp, p=0.04, CI [+0.2, +5.8])
**Status**: pending review (or: applied automatically — streak 3/3)
**Next**: Tier 2 (opener)
```

## Fallback contract

Same CLI → curl → docs pattern as cold-leads/cold-send. The new `inbox categorize-stats` endpoint:

- Cached OpenAPI: `jq '.paths."/inbox/categorize-stats"' .cold/docs-cache/foxreach-openapi.json`
- Curl: `curl -H "Authorization: Bearer $FOXREACH_API_KEY" "https://api.foxreach.io/api/v1/inbox/categorize-stats?campaignId=<id>&groupBy=variant"`
- Docs: (Mintlify page coming once endpoint is documented; for now, OpenAPI spec is the source of truth)

## Constraints

- Never read stats before `min_days_before_read`. The agent MUST refuse to peek early.
- Never auto-commit if `trust.autoCommit == false`. Always write to `.cold/proposed-diff.patch` first.
- Hard guard on bounce rate > 5% — pause the breaching variant immediately, do NOT propose any cold.md changes.
- One experiment at a time. If `.cold/experiments/.active` is missing, surface "no active experiment" and stop.

## Output

- `.cold/experiments/<id>/results.json`
- `.cold/experiments/<id>/decision.md`
- `.cold/beliefs.md` (updated)
- `.cold/decisions.md` (appended)
- `.cold/proposed-diff.patch` (if winner + not auto-commit)
- `.cold/trust.json` (streak + autoCommit fields updated)

## References

- Spec: https://cold.md
- categorize-stats endpoint: `GET /api/v1/inbox/categorize-stats?groupBy=variant` (foxreach commit `4ca5dce`)
- Two-proportion z-test: standard frequentist approach; v0.2 may upgrade to Bayesian Beta posteriors
