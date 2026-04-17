---
name: cold-leads
description: Source leads matching icp.md and write them to leads.csv. Reads your icp.md, queries FoxReach's lead DB (or optional external providers), applies the qualification checklist, returns a deduped, enriched CSV. Use when the user says "find leads", "source prospects", "build a list", "enrich this CSV against my ICP". STATUS - stub in v0. The contract is stable; the implementation ships in v0.2. Part of the cold.md suite.
---

# cold-leads

Step 2 of the cold.md suite. Sources leads that match `icp.md`.

## Status: stub (v0.2 target)

This skill defines the contract. The implementation ships in v0.2. Until then, stop and surface to the user:

> cold-leads is a stub in v0. You'll need to source leads manually (Apollo / Clay / LinkedIn Sales Nav) and save to `./leads.csv` with columns: `name, title, company, domain, linkedin_url, signal`. The rest of the suite works with your CSV. Track progress at https://github.com/concaption/cold-md/issues

## Contract (v0.2)

### Input
- `./icp.md` (from `cold-icp`)
- Optional flags: `--count N`, `--region US/EU/global`, `--exclude-domains a.com,b.com`

### Output
- `./leads.csv` with columns: `name, title, company, domain, linkedin_url, first_name, company_size, industry, signal, qualification_score`

### Data source priority (v0.2)
1. FoxReach lead DB (`GET /v1/leads/search` - requires `FOXREACH_API_KEY`)
2. Optional: Apollo, Clay, PDL via user-provided API key in env

### Behavior (v0.2)
- Read `icp.md`, convert to search filters.
- Query data source, apply the qualification checklist.
- Score each lead 0-100 on fit.
- Dedupe against any existing `leads.csv`.
- Write result, surface: "Found N leads. Top signal: X. Review before `cold-send`."

## References

- cold.md suite: https://cold.md
- FoxReach docs: https://foxreach.io/docs/api
- Issue tracker: https://github.com/concaption/cold-md/issues
