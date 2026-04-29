---
name: cold-status
description: Print the current state of the autoresearch loop — what we've learned, what's being tested, what's pending review, what's next. Reads everything in .cold/ and outputs a one-screen dashboard. Use anytime to orient. No FoxReach calls — purely local read.
---

# cold-status

The autoresearch dashboard. Use to orient yourself before kicking off the next step.

## When to use

- User says "what's the state", "where are we", "/cold status"
- Before running any other `/cold <verb>` command, to confirm prerequisites
- After a long break, to remember what's in flight

## Inputs (all optional, all local)

- `.cold/config.json`
- `.cold/beliefs.md`
- `.cold/decisions.md`
- `.cold/experiments/.active`
- `.cold/experiments/<id>/protocol.md`
- `.cold/experiments/<id>/decision.md` (if concluded)
- `.cold/proposed-diff.patch` (if pending review)
- `.cold/trust.json`
- `.cold/last-import.json`, `.cold/last-send.json`
- `cold.md`, `icp.md`, `offer.md` (existence checks)

## Process

### Step 1 — Check init state

If `.cold/config.json` doesn't exist:

```
cold.md not initialized. Run `/cold init` first.
```

Stop.

### Step 2 — Gather state

Read all the files listed in Inputs (silently skip missing ones).

### Step 3 — Print the dashboard

```
═══════════════════════════════════════════════════════════════
  cold.md autoresearch — status as of <YYYY-MM-DD HH:MM>
═══════════════════════════════════════════════════════════════

POLICY FILES
  cold.md   ✓ (last edit: <relative time>)
  icp.md    ✓
  offer.md  ⚠ missing — run /cold offer

CAMPAIGNS
  Active campaign: cmp_abc123 ("Q2 SaaS founders")
    Leads:    87 imported (142 scored, threshold 0.5)
    Sent at:  2026-04-22 (7 days ago)

EXPERIMENTS
  Active:    2026-W18-subject-statement-vs-question
    Variable: subject pattern (Tier 1)
    Arms:     arm_a_statement vs arm_b_question (50/50)
    Sample:   100/100 sent — ready to read ✓
    Days:     7 of 7 elapsed

  Last concluded: <none yet>

BELIEFS (current best-known patterns)
  <none yet — first experiment in flight>

PENDING REVIEW
  ⚠ Proposed cold.md diff at .cold/proposed-diff.patch
    From experiment: 2026-W18-subject-statement-vs-question
    Outcome: arm_b_question wins (+3.0pp, p=0.04)
    Review: cat .cold/proposed-diff.patch
    Accept: git apply .cold/proposed-diff.patch && rm .cold/proposed-diff.patch
    Reject: rm .cold/proposed-diff.patch

TRUST LADDER
  Approved-diff streak: 0 / 3
  Auto-commit:          OFF (will unlock at streak 3)

PERSONALIZATION
  Per-lead: enabled — 87 lookups cached at .cold/research/lead-personalization/

DECISIONS LOG (last 3)
  - 2026-04-29 — Tier 1 / subject — pending review
  - <older entries>

═══════════════════════════════════════════════════════════════

SUGGESTED NEXT
  → Review and accept the pending diff (above)
  → Then: /cold experiment to design Tier 2 (opener)

═══════════════════════════════════════════════════════════════
```

### Variations

- **No active experiment, no campaign:** suggest `/cold experiment` after `/cold leads`
- **Active experiment, not enough days elapsed:** show "Days: 3 of 7" and suggest waiting
- **No pending diff, no active experiment, beliefs empty:** suggest `/cold leads + /cold experiment` to start the first loop
- **Bounce-rate guard breached recently:** show in red, suggest reviewing `.cold/decisions.md` for the breach

### Step 4 — Suggested next action (always last)

Pick the single most important next action based on state:

| Current state | Suggested next |
|---|---|
| No `cold.md`, `icp.md`, `offer.md` | `/cold init` then `/cold icp <url>` |
| Has icp.md, no offer.md | `/cold offer` |
| Has cold.md, no `last-import.json` | `/cold leads --csv ./prospects.csv` |
| Has import, no `last-send.json`, no active experiment | `/cold experiment` |
| Has active experiment, no drafts | `/cold draft` |
| Has drafts, no `last-send.json` | `/cold send` |
| Active experiment, days remaining | "Wait N more days, then /cold learn" |
| Active experiment, ready to read | `/cold learn` |
| Pending diff | "Review and accept/reject the proposed diff" |
| Diff resolved, no active experiment | `/cold experiment` (next tier) |

## Constraints

- **Read-only** — never modify any file in `.cold/`. (Reading is fine.)
- **No FoxReach calls** — this is a local-only summary. Use `/cold report` for FoxReach-side stats.
- Format the output for terminal width (~80 cols). No emoji unless ascii-safe (`✓ ⚠ ✗`).

## Output

- Terminal dashboard (stdout only — no files written)

## References

- Spec: https://cold.md
- For FoxReach-side analytics: `/cold report`
