# cold.md autoresearch — design spec

**Date:** 2026-04-28
**Status:** Approved scope; awaiting plan + build
**Inspired by:** Karpathy autoresearch loop (hypothesis → experiment → measure → update)

## Goal

Turn cold.md from a draft-helper into a **self-improving cold-outreach agent** that runs continuous experiments, measures real outcomes, and rewrites its own policy (`cold.md`, `icp.md`, `offer.md`) over time. FoxReach is the sender + measurement substrate.

## What changed from the original v0

The original 6 skills (3 stub) were "do step N once, output file" tools. Autoresearch needs **stateful agent + persistent beliefs + continuous loop**, so we rewrite — not patch.

## Constraints (from user, locked)

| Decision | Choice |
|---|---|
| Primary metric | **Interested-reply rate** (no open tracking exists in FoxReach) |
| Hard guards | bounce rate <5%, "not_interested" rate <30% |
| Auto-commit policy | **Human-approval diffs**, with auto-commit unlocked after **3 approved diffs in a row** |
| Per-lead personalization | **Yes**, but as a config flag asked at `/cold init` (policy-level web research is always-on) |
| API access pattern | **CLI primary**, raw curl + OpenAPI fallback at the backend |
| Web research | Always-on for policy-level (ICP/offer); optional per-lead via config |
| First experiment tier to ship | Tier 1 (subject lines) only |

## Skills (10 total)

```
Phase 1 — DEFINE         icp, offer
Phase 2 — DRAFT & SEND   leads, draft, send
Phase 3 — LEARN          experiment, learn, triage
Phase 4 — OBSERVE        status, report
```

| # | Skill | Status | Web search? | Calls FoxReach? |
|---|---|---|---|---|
| 1 | `cold-icp` | extend | yes (validate niche) | no |
| 2 | `cold-offer` | NEW | yes (competitor + market) | no |
| 3 | `cold-leads` | wires stub | conditional (per-lead) | yes |
| 4 | `cold-draft` | extend | conditional (per-lead) | no |
| 5 | `cold-send` | wires stub | no | yes (campaigns + sequences + variants) |
| 6 | `cold-experiment` | NEW | no | reads variant-stats |
| 7 | `cold-learn` | NEW | no | reads variant-stats |
| 8 | `cold-triage` | wires stub | no | yes (inbox + bulk update) |
| 9 | `cold-status` | NEW | no | yes (read-only summary) |
| 10 | `cold-report` | extend | no | yes (analytics + variant-stats) |

## File layout (per project)

```
./cold.md                         # voice, sequence, proof, banned, objections (gets edited by cold-learn via diff)
./icp.md                          # who we target (edited by cold-icp)
./offer.md                        # NEW — value prop (edited by cold-offer)
./.cold/
   config.json                    # NEW — answers from /cold init (per-lead personalization on/off, etc.)
   beliefs.md                     # current best-known patterns + confidence intervals (managed by cold-learn)
   trust.json                     # NEW — { approvedDiffStreak: number, autoCommit: bool }
   research/                      # always-timestamped web-search outputs
      icp-validation-2026-04-29.md
      offer-pricing-2026-04-30.md
      lead-personalization/<leadId>.md     # only if per-lead is enabled
   experiments/
      2026-W18-subject-question-vs-statement/
         protocol.md              # hypothesis, variants, sample size, success criteria
         results.json             # raw data fetched from FoxReach variant-stats
         decision.md              # what we learned + proposed cold.md change
   decisions.md                   # ordered changelog of cold.md edits (committed diffs)
   docs-cache/
      foxreach-openapi.json       # fetched on first run, refreshed weekly
      cold-md-spec.md             # local copy
   .last-sync                     # timestamp of last FoxReach poll
```

## `.cold/config.json` schema (asked at `/cold init`)

```json
{
  "version": "0.2",
  "personalization": {
    "perLead": true,
    "perLeadBudget": "2-search-queries-per-lead"
  },
  "research": {
    "policyLevelEnabled": true,
    "maxQueriesPerInvocation": 5,
    "cacheTtlDays": 14
  },
  "experiments": {
    "currentTier": 1,
    "minSamplePerVariant": 100,
    "minDaysBeforeRead": 7,
    "significanceLevel": 0.05,
    "autoAdvanceTier": false
  },
  "guards": {
    "bounceRateThreshold": 0.05,
    "notInterestedRateThreshold": 0.30,
    "autoPauseOnGuardBreach": true
  },
  "trust": {
    "humanApprovalRequired": true,
    "autoCommitAfterApprovedStreak": 3
  },
  "foxreach": {
    "baseUrl": "https://api.foxreach.io",
    "docsUrl": "https://docs.foxreach.io",
    "openapiUrl": "https://api.foxreach.io/openapi.json",
    "cliPath": "foxreach"
  }
}
```

## Experiment design

### Variable tier ladder (locked, ordered)

| Tier | Variable | Min sample/variant | Min days | Unlocks when |
|---|---|---|---|---|
| 1 | Subject pattern (statement vs. question vs. number-led) | 100 | 7 | always |
| 2 | Opener template (line 1-2) | 150 | 10 | tier 1 has stable winner |
| 3 | CTA framing (ask vs. give vs. soft-CTA) | 200 | 14 | tier 2 stable |
| 4 | Cadence (days between bumps) | 300 | 21 | tier 3 stable |
| 5 | Voice tone (casual vs. formal) | cohort | 30+ | manual unlock only |

Only one variable changes per experiment. The previous tier must have a "stable winner" (95% CI on delta excluded zero) before the next tier unlocks.

### Statistical decision rule (v0 — frequentist)

For each variant pair (A, B):
1. Compute `interested-reply-rate` per variant after `minDaysBeforeRead` and `minSamplePerVariant` reached.
2. Two-proportion z-test, two-sided, `alpha = 0.05`.
3. **Winner**: |delta| > 2 percentage points AND p < 0.05 AND lower bound of 95% CI > 0.
4. **Inconclusive**: extend sample by 50% up to a hard cap of 3× original. After cap: declare inconclusive, keep current cold.md.
5. **Guard breach** (bounce rate > 5%): immediately pause variant, alert user, do NOT advance tier.

Bayesian (Beta posterior) is v0.2.

### Trust ladder

```
trust.json:
   approvedDiffStreak: number   // consecutive approved diffs
   autoCommit: boolean          // unlocked at streak >= 3

cold-learn behavior:
   if autoCommit:
      apply diff, commit, append decisions.md
   else:
      write proposed diff to .cold/proposed-diff.patch
      print "Run `git apply .cold/proposed-diff.patch` to accept, or edit it first"
      on next /cold learn or /cold status, check if diff was applied
      if applied: streak += 1
      if rejected (file deleted unchanged): streak = 0
```

## FoxReach access pattern

### Three layers

1. **CLI primary** (`foxreach <subcommand>`)
2. **Raw curl + cached OpenAPI** (when CLI doesn't cover an endpoint)
3. **WebFetch docs.foxreach.io** (when stuck on usage)

### CLI surface (new — built for this)

```bash
# global
foxreach openapi                          # prints OpenAPI for the agent
foxreach docs <topic>                     # opens https://docs.foxreach.io/<topic>

# accounts
foxreach accounts list
foxreach accounts get <id>
foxreach accounts test --json @config.json

# campaigns
foxreach campaigns list
foxreach campaigns get <id>
foxreach campaigns create --json @file
foxreach campaigns start <id>
foxreach campaigns pause <id>

# sequences + variants
foxreach sequences list --campaign <id>
foxreach sequences add --campaign <id> --step 1 --json @file
foxreach variants add --campaign <id> --sequence <id> --json @file
foxreach variants stats --campaign <id> --sequence <id>

# leads
foxreach leads list [--filter ...]
foxreach leads import --csv @file --campaign <id>
foxreach leads bulk-tag --ids @ids.json --tags @tags.json

# inbox
foxreach inbox threads --filter unread --json
foxreach inbox categorize-stats --campaign <id> --since 7d --group-by variant
foxreach inbox bulk-update --ids @ids.json --json @updates.json

# templates + analytics
foxreach templates list
foxreach analytics campaign <id> --since 7d
```

The CLI is auto-generated from OpenAPI where possible (`openapi-typescript-codegen` or hand-written thin wrapper). Distributed as a single binary or `npx foxreach`.

### Fallback (curl + OpenAPI)

When CLI doesn't cover an endpoint, the skill:
1. Reads `.cold/docs-cache/foxreach-openapi.json`
2. Locates the matching path/method
3. Constructs the curl call with auth header from env (`FOXREACH_API_KEY`)
4. Executes via Bash, parses JSON response
5. If 4xx/5xx, fetches `https://docs.foxreach.io/<path-related-page>` for context

## API additions to FoxReach (small)

| # | Endpoint | Why | Effort |
|---|---|---|---|
| 1 | Confirm `/openapi.json` is public + CORS-allowed | Lets agent self-document | 5 min |
| 2 | `GET /api/v1/campaigns/{id}/categorize-stats?from=&to=&groupBy=variant` | Time-series of interested/not_interested/OOO/bounce per variant; data exists in Reply.category + Reply.variantId via EmailLog | 30-45 min |
| 3 | `POST /api/v1/leads/score-fit` body `{lead, icp_markdown}` → `{score: 0-1, rationale}` (optional, can do client-side) | Server-side ICP-fit scoring | 30 min, optional |

## Web research surfaces

### Policy-level (always-on)

| Skill | Searches |
|---|---|
| `cold-icp` | Validate niche size, find competitor companies in target vertical, scan job postings for titles |
| `cold-offer` | Competitor pricing, recent funding rounds, industry pain points (forums + reddit + reviews) |
| `cold-experiment` | (Optional) Look up benchmarks for the variable being tested |

Cap: `maxQueriesPerInvocation: 5` (configurable in `.cold/config.json`).

### Per-lead (config-flagged at init)

When `personalization.perLead = true`:

| Skill | Per-lead searches |
|---|---|
| `cold-leads` | Verify company is real + matches ICP (1 query per lead, cached) |
| `cold-draft` | Find a recent hook for the opener (recent post, hire, fundraise, product launch) — 1-2 queries per lead |

Output saved to `.cold/research/lead-personalization/<leadId>.md` so retries don't re-search.

## Autoresearch loop in practice

```
Day 0   /cold init                       # asks per-lead question; scaffolds .cold/, fetches OpenAPI
Day 0   /cold icp https://acme.io       # builds icp.md, validates with web search
Day 0   /cold offer                      # NEW — refines value prop via competitor research
Day 0   /cold leads --csv prospects.csv  # FoxReach import + (optional) per-lead enrichment + ICP scoring
Day 0   /cold experiment                 # picks Tier 1: subject. Designs A/B. Writes protocol.
Day 0   /cold draft                      # generates variant pairs from cold.md + experiment
Day 0   /cold send                       # ships campaign with both variants via FoxReach

[7 days pass — triage runs daily on cron]

Day 1+  /cold triage                     # categorizes inbound replies, drafts responses

Day 7   /cold learn                      # polls categorize-stats, computes interested-reply rate
                                          #   95% CI: question variant +3.2pp [+0.8, +5.6], p=0.04
                                          #   bounce guard OK (1.2%)
                                          #   proposes cold.md diff (subject pattern)
                                          #   writes .cold/proposed-diff.patch
                                          #   appends decisions.md
                                          #   user reviews + git applies → streak += 1
Day 7   /cold experiment                 # Tier 1 stable winner → unlocks Tier 2
Day 7   /cold draft + send               # ships next batch with new opener variants

Day N   /cold status                     # current beliefs, experiments in flight, suggested next
Day N   /cold report weekly              # human-readable summary, cron-ready
```

## Default cron schedule (suggested)

| Schedule | Skill | Why |
|---|---|---|
| Daily 9am local | `cold-triage` | Categorize replies + draft responses |
| Sunday 8pm | `cold-learn` | End-of-week experiment read |
| Sunday 9pm | `cold-report` weekly | Email digest + slack |

User opts in via `.cold/config.json` cron section.

## Out of scope (v0)

- Bayesian statistics (frequentist only)
- Multi-armed bandit (one A/B at a time)
- Multi-variable experiments (single-factor only)
- Tier 5 voice tests (manual unlock; high-risk)
- Auto-rotating sender accounts based on health (FoxReach already handles)
- Per-lead deep research (LinkedIn scrape, etc.) — only light web search per-lead
- A FoxReach SDK in another language; CLI + curl is enough

## Acceptance for v0

A user can run, in order:

```
/cold init
/cold icp <url>
/cold offer
/cold leads --csv ./leads.csv --campaign-name "Q2 SaaS founders"
/cold experiment
/cold draft
/cold send
# wait 7 days
/cold learn   # produces a reviewable diff
/cold status  # shows progress
```

…and have a real campaign running on FoxReach with at least one A/B test concluded and a `cold.md` diff proposed for review.

## Open questions resolved

| Question | Resolution |
|---|---|
| Auto-commit | Human approval; auto unlocks after 3 approved in a row |
| Per-lead personalization | Optional config, asked at init |
| CLI vs curl | CLI primary, curl + OpenAPI fallback |
| Primary metric | Interested-reply rate (no opens) |
| First tier | Subject lines only |
| Stats method | Frequentist (z-test) for v0; Bayesian deferred |
| Web research scope | Policy-level always-on, per-lead config-flagged |
