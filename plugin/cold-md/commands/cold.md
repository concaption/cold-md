---
description: Run any step of the cold outreach loop — init, ICP, offer, leads, draft, send, experiment, learn, triage, status, report, audit, lint. Dispatches to the right skill.
argument-hint: "init | icp | offer | leads | draft | send | experiment | learn | triage | status | report | audit | lint [args...]"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch
---

# /cold

Router for the cold.md autoresearch suite. Every step of your outbound loop, one command.

## Usage

```
/cold init                    Bootstrap a project — runs the wizard, scaffolds .cold/, fetches OpenAPI
/cold icp [url]               Build/refine icp.md — URL or interactive Q&A; validates via web search
/cold offer                   Refine value prop via competitor + market research → offer.md (NEW)
/cold leads [--csv path]      Import + ICP-score; optional per-lead enrichment
/cold draft <lead>            Draft a spec-conformant message from cold.md (or variants if experiment is active)
/cold bump <lead>             Draft the bump (sequence step 2)
/cold breakup <lead>          Draft the breakup (sequence step 3)
/cold lint                    Check cold.md + icp.md against the v0 spec
/cold send                    Push campaign+sequence+variants to FoxReach with full pre-flight
/cold experiment              Design the next A/B (NEW — autoresearch core)
/cold learn                   Read variant stats, run z-test, propose cold.md diff (NEW)
/cold triage                  Sort replies, draft responses
/cold status                  Print current beliefs, active experiments, suggested next (NEW)
/cold report [daily|weekly]   Digest with experiment outcomes
/cold audit <domain>          Deliverability audit (stub)
```

## Dispatch table

| Subcommand | Skill invoked | Requires FOXREACH_API_KEY? |
|---|---|---|
| `init` | (inline — runs wizard, scaffolds `.cold/`) | Yes |
| `icp` | `cold-icp` | No |
| `offer` | `cold-offer` | No |
| `leads` | `cold-leads` | Yes |
| `draft`, `bump`, `breakup`, `lint` | `cold-draft` | No |
| `send` | `cold-send` | Yes |
| `experiment` | `cold-experiment` | No |
| `learn` | `cold-learn` | Yes |
| `triage` | `cold-triage` | Yes |
| `status` | `cold-status` | No (read-only) |
| `report`, `audit` | `cold-report` | Yes |

## Behavior

1. Parse the subcommand from `$ARGUMENTS`.
2. For all non-`init` subcommands: verify `.cold/config.json` exists. If not, stop and tell the user to run `/cold init` first.
3. Validate the current working directory has `cold.md` and/or `icp.md` as required by the subcommand:
   - `icp` — creates `icp.md` if missing
   - `offer` — requires `icp.md`
   - `leads` — requires `icp.md`
   - `draft` family — requires `cold.md`
   - `send` — requires `cold.md`, `icp.md`, `.cold/last-import.json`, FOXREACH_API_KEY
   - `triage`, `report`, `learn`, `audit` — require FOXREACH_API_KEY
4. Invoke the corresponding skill. If a required env var is missing, stop and surface a precise error with the fix.
5. Output in the format defined by the invoked skill.

## /cold init — inline behavior

When `$ARGUMENTS` starts with `init`, do not invoke a skill — run the wizard inline:

### Step 1 — Prerequisites
- Run `which foxreach`. If missing: print `pip install foxreach-cli` and stop.
- Check `FOXREACH_API_KEY` env. If missing: print where to get one (https://foxreach.io/app/settings?tab=api) and stop.
- Confirm with user: "Initialize cold.md autoresearch in `<cwd>`? (Y/n)"

### Step 2 — Six-question wizard

Ask one at a time, accept defaults on Enter:

1. **"Per-lead personalization?** (light web search per prospect — recent news, posts, hires) [y/N]"
2. **"Policy-level web research?** (refine ICP/offer with competitor + market scans) [Y/n]"
3. **"Min sample size per variant before declaring a winner?** [default: 100]"
4. **"Min days before reading experiment results?** [default: 7]"
5. **"Bounce-rate guard threshold?** [default: 0.05 = 5%]"
6. **"Auto-commit cold.md diffs after 3 approved in a row?** [Y/n]"

### Step 3 — Write `.cold/config.json`

```json
{
  "version": "0.2",
  "personalization": {
    "perLead": <answer-1>,
    "perLeadBudget": "2-search-queries-per-lead"
  },
  "research": {
    "policyLevelEnabled": <answer-2>,
    "maxQueriesPerInvocation": 5,
    "cacheTtlDays": 14
  },
  "experiments": {
    "currentTier": 1,
    "minSamplePerVariant": <answer-3>,
    "minDaysBeforeRead": <answer-4>,
    "significanceLevel": 0.05,
    "autoAdvanceTier": false
  },
  "guards": {
    "bounceRateThreshold": <answer-5>,
    "notInterestedRateThreshold": 0.30,
    "autoPauseOnGuardBreach": true
  },
  "trust": {
    "humanApprovalRequired": true,
    "autoCommitAfterApprovedStreak": <answer-6 ? 3 : 999>
  },
  "foxreach": {
    "baseUrl": "https://api.foxreach.io",
    "docsUrl": "https://docs.foxreach.io/api-reference",
    "openapiUrl": "https://api.foxreach.io/openapi-public.json",
    "cliPath": "foxreach"
  }
}
```

### Step 4 — Write `.cold/trust.json`

```json
{ "approvedDiffStreak": 0, "autoCommit": false }
```

### Step 5 — Cache the FoxReach OpenAPI

```bash
mkdir -p .cold/docs-cache
foxreach openapi > .cold/docs-cache/foxreach-openapi.json 2>/dev/null \
  || curl -fsSL https://api.foxreach.io/openapi-public.json -o .cold/docs-cache/foxreach-openapi.json
```

If both fail: warn the user but continue (offline mode — skills will WebFetch docs.foxreach.io as needed).

### Step 6 — Scaffold stubs (only if missing)

- `cold.md` — copy from spec template (8 sections: Identity / Audience / Value / Voice / Proof / Sequence / Objections / Banned)
- `icp.md` — placeholder header with a TODO note
- `offer.md` — placeholder header

### Step 7 — Initialize state files

```
.cold/beliefs.md            # "# Beliefs\n\n_No experiments concluded yet._"
.cold/decisions.md          # "# Decisions Changelog\n\n_No diffs applied yet._"
.cold/experiments/.gitkeep
.cold/research/.gitkeep
```

### Step 8 — Verify auth

Run `foxreach campaigns list` (or curl fallback). Must succeed with HTTP 200 (even if empty list). If 401/403: print "API key invalid — re-export FOXREACH_API_KEY" and stop.

### Step 9 — Print next steps

```
✓ cold.md autoresearch initialized in <cwd>
  Config: .cold/config.json
  Personalization: <on|off>

Next:
  /cold icp <your-website-url>     Build icp.md
  /cold offer                       Refine the value prop (after icp.md)
  /cold leads --csv ./prospects.csv  Import + score leads
```

## The full loop (with autoresearch)

```
/cold init                              # one-time
/cold icp https://your-company.com      # who
/cold offer                             # what
/cold leads --csv ./prospects.csv       # who specifically
/cold experiment                        # design A/B
/cold draft                             # generate variants
/cold send                              # ship to FoxReach
# (wait 7 days; cold-triage runs daily)
/cold learn                             # propose cold.md diff
/cold status                            # what we learned, what's next
/cold report weekly                     # human-readable digest
```

## Spec reference

The spec that defines `cold.md`, `icp.md`, and the autoresearch loop: https://cold.md

FoxReach API docs (used by skills as a fallback when the CLI doesn't cover something): https://docs.foxreach.io/api-reference
