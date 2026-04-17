---
description: Run any step of the cold outreach loop - ICP, leads, draft, send, triage, report, audit. Dispatches to the right skill.
argument-hint: "icp | leads | draft | send | triage | report | audit | lint [args...]"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch
---

# /cold

Router for the cold.md suite. Every step of your outbound loop, one command.

## Usage

```
/cold icp [url]           Build icp.md - from a URL (fetch + parse) or interactive Q&A
/cold leads [--count N]   Source leads matching icp.md into leads.csv (stub in v0)
/cold draft <lead>        Draft a spec-conformant opener from cold.md
/cold bump <lead>         Draft the bump (slot 2)
/cold breakup <lead>      Draft the breakup (slot 3)
/cold lint                Check cold.md + icp.md against the v0 spec
/cold send <csv>          Queue a campaign via FoxReach (stub in v0, needs FOXREACH_API_KEY)
/cold triage              Sort replies by intent, draft responses (stub in v0)
/cold report [daily|weekly]  Digest: deliverability + bookings (needs FOXREACH_API_KEY)
/cold audit <domain>      Deliverability audit on a sending domain (stub in v0)
```

## Dispatch table

| Subcommand | Skill invoked | Requires FOXREACH_API_KEY? |
|---|---|---|
| `icp` | `cold-icp` | No |
| `leads` | `cold-leads` | Yes (stub) |
| `draft`, `bump`, `breakup`, `lint` | `cold-draft` | No |
| `send` | `cold-send` | Yes (stub) |
| `triage` | `cold-triage` | Yes (stub) |
| `report`, `audit` | `cold-report` | Yes |

## Behavior

1. Parse the subcommand from `$ARGUMENTS`.
2. Validate the current working directory has `cold.md` and/or `icp.md` as required by the subcommand:
   - `icp` - creates `icp.md` if missing
   - `leads` - requires `icp.md`
   - `draft` family - requires `cold.md`
   - `send` - requires both + FOXREACH_API_KEY
   - `triage`, `report`, `audit` - require FOXREACH_API_KEY
3. Invoke the corresponding skill. If a required env var is missing, stop and surface a precise error with the fix.
4. Output in the format defined by the invoked skill.

## The full loop

```
/cold icp https://your-company.com      # Step 1: who
/cold leads --count 100                   # Step 2: prospects
/cold draft Jane Smith, CEO at Acme       # Step 3: draft (repeat per lead)
/cold send ./leads.csv                    # Step 4: launch (with pre-flight + confirm)
/cold triage                              # Step 5: sort replies, draft responses
/cold report weekly                       # Step 6: digest (ideally on cron)
```

## Spec reference

The spec that defines `cold.md` and `icp.md`: https://cold.md
