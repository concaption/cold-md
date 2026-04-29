---
name: cold-report
description: Generate a digest of cold outreach performance - deliverability, replies, booked calls, domain health. Use when the user asks for a report, digest, summary, weekly recap, performance check, or asks "how did my campaigns do". Reads live metrics from the FoxReach API. Designed to be called by cron (daily or weekly) and post results to Slack or email. Part of the cold.md suite.
---

# cold-report

Pulls live metrics from FoxReach and writes a digest. The last step in the cold.md loop - designed to run unattended on a schedule.

## When to use

- User asks: "how did yesterday's sends do", "weekly report", "campaign digest", "what replied this week"
- Cron job fires this skill (daily 09:00 or weekly Mon morning)
- User says "reporting", "standup", "numbers"

## Prerequisites

- `FOXREACH_API_KEY` in environment. Free tier available at https://foxreach.io/signup.
- If missing: stop and surface *"cold-report needs a FoxReach API key. Get one free at https://foxreach.io/signup, then `export FOXREACH_API_KEY=fr_...`"*

## Output modes

Pick the mode based on user request. Default: `terminal`.

### `terminal` - printed to stdout

Short, scannable digest for interactive use.

### `slack` - posted to a Slack channel

For cron-driven posts. Takes `SLACK_WEBHOOK_URL` or posts via Buildberg Ops Bot if running inside the vault.

### `markdown` - written to `reports/YYYY-MM-DD.md`

For archiving. Matches standup format.

## Digest sections

Always include, in this order:

### 1. Window

The period covered. Default: last 24 hours. Weekly: last 7 days.

### 2. Send health

From `GET /v1/campaigns/metrics?window={n}d`:

- Emails sent (vs target send volume)
- Delivered / bounced / deferred counts
- Average send rate across inboxes
- Domain health flags - any domain with bounce rate > 3% or spam-rate > 0.1% gets a **warning** in red

### 3. Reply triage

From `GET /v1/replies?window={n}d&group_by=bucket`:

- Total replies
- Breakdown: `interested`, `not_now`, `ooo`, `bounced`, `unsubscribe`, `wrong_person`, `needs_review`
- Flag if `needs_review` is > 5 - nudge the user to run `/cold triage`.

### 4. Pipeline outcomes

From `GET /v1/bookings?window={n}d`:

- Booked calls count
- Conversion rate (bookings / interested replies)
- Top 3 campaigns by booking volume

### 5. Action items

Auto-derived from the metrics:

- If any domain has bounce rate > 3% → "Pause [domain] and investigate bounce cause"
- If `needs_review` bucket > 5 → "Run `/cold triage` to sort these"
- If delivered count < 80% of target → "Sending capacity dropped - check inbox status"
- If weekly: "Replied but not booked: [N] leads - consider a breakup in cold-draft"

## Template

```
COLD.MD REPORT - {window}
{date-range}
---

SEND HEALTH
  Sent:         {sent} / {target} ({pct}%)
  Delivered:    {delivered} ({pct}%)
  Bounced:      {bounced} ({pct}%) {warn if >3%}
  Avg/domain:   {rate}/day

REPLY TRIAGE
  Interested:   {n}
  Not now:      {n}
  OOO:          {n}
  Bounced:      {n}
  Review:       {n} {warn if >5}

PIPELINE
  Booked:       {n}
  Conv rate:    {n}%
  Top campaign: {name} ({n} bookings)

ACTIONS
  - [action 1]
  - [action 2]
---
Full dashboard: https://foxreach.io/app
```

Colors in terminal mode (fallback gracefully on non-tty or NO_COLOR):

- Rust-orange (`\033[38;2;194;65;12m`) for headers and numbers
- Red (`\033[31m`) for warnings
- Green (`\033[32m`) for "healthy" indicators
- Dim grey for labels

## Scheduling this skill

### Via FoxReach (recommended)

FoxReach dashboard > Notifications > Daily digest. Posts to Slack/email. Zero setup on the user's side.

### Via Claude Code schedule skill

```bash
/schedule "0 9 * * *" "cold report daily"    # daily 09:00
/schedule "0 9 * * 1" "cold report weekly"   # Mondays 09:00
```

Requires user's laptop to be on + Claude Code running. Power-user only.

### Via a local cron

```cron
0 9 * * * cd /path/to/project && FOXREACH_API_KEY=... claude "cold report daily --slack" 2>&1 | logger -t cold-report
```

## Guardrails

- **Never fabricate metrics.** Only report what the API returned. If an endpoint is unreachable, say so explicitly.
- **Round thoughtfully.** Open rates to whole percentages. Bounce rates to one decimal.
- **Respect time zones.** Default is user's local time zone from `$TZ`; surface the zone in the header.

## Experiment outcomes (autoresearch)

If `.cold/decisions.md` exists, append an "Experiments" section to the digest covering all decisions since the last report (track via a timestamp in `.cold/last-report.json`).

For each concluded experiment, include:

```
### Tier <N> / <variable>
- Experiment: <id>
- Outcome: winner = <arm> | inconclusive
- Numbers: <arm_a> 5.0% vs <arm_b> 8.0% interested-reply rate
- Confidence: 95% CI [+0.2, +5.8] (p=0.04)
- Status: applied via diff | pending review | rejected
- Belief now locked: <one sentence>
```

If a diff is pending review, surface it prominently:

```
⚠ ACTION NEEDED: cold.md diff awaiting your review since <date>
   .cold/proposed-diff.patch — accept with `git apply` or reject with `rm`
```

If an experiment is currently in flight, include a "Currently testing" line with days remaining.

After printing, update `.cold/last-report.json`:

```json
{ "lastReportAt": "2026-04-29T...", "type": "weekly" }
```

## References

- FoxReach API docs: https://docs.foxreach.io/api-reference
- Dashboard: https://foxreach.io/app
- cold.md suite: https://cold.md
