---
name: cold-leads
description: Import a CSV of leads, score each against icp.md, drop misaligned ones, optionally enrich with per-lead web research, then push the survivors into FoxReach as a campaign. Replaces the v0 stub. Use when the user says "import leads", "score these prospects", "filter to my ICP", "build a campaign from this CSV".
---

# cold-leads

Step 2 of the cold.md autoresearch suite. Imports + scores + ships leads to FoxReach.

## When to use

- User has a CSV of prospects and says "import these"
- User says "score this list against my ICP"
- User says "build a campaign from these leads"

## Inputs

- `./icp.md` (required — run `/cold icp` first)
- `.cold/config.json` (`personalization.perLead`, `personalization.perLeadBudget`)
- One of:
  - `--csv <path>` — local CSV file with at minimum an `email` column (recommended: `firstName, lastName, email, company, title, linkedinUrl, website`)
  - `--from-companies <file>` — list of company names (deferred to v0.3 — needs an enrichment provider)
- `--campaign-name "..."` — name for the FoxReach campaign (default: `<icp.md vertical> — <today's date>`)
- `--threshold 0.5` — minimum ICP-fit score (default 0.5)

## Process

### Step 1 — Validate inputs

- `icp.md` must exist. If not: stop, tell the user to run `/cold icp`.
- CSV must have an `email` column. If not: stop, tell the user the schema.
- `FOXREACH_API_KEY` must be set. If not: stop with the install hint.

### Step 2 — Read CSV + ICP

Parse the CSV into rows. Read `icp.md` (full file content) for the scoring prompt.

### Step 3 — Score each lead against ICP (client-side)

For each row, call Claude with this prompt structure:

```
Given this ICP:
<icp.md content>

And this lead:
<row as JSON>

Output strictly:
{ "fit": 0.0-1.0, "reason": "<one sentence>" }
```

The skill does this in batches of 20 rows per call to keep cost bounded.

Add `fit_score` and `fit_reason` columns to the CSV. Drop rows with `fit < --threshold` (default 0.5).

Save the scored full CSV to `.cold/scored-leads-<YYYY-MM-DD>.csv` (audit trail, not pushed). Save the survivors-only CSV to `.cold/import.csv` (this is what gets pushed to FoxReach).

### Step 4 — (Optional) Per-lead personalization

Only run if `.cold/config.json` has `personalization.perLead: true`.

Budget: per `personalization.perLeadBudget` (default `2-search-queries-per-lead`).

For each surviving lead, run up to 2 WebSearch queries:

1. `"<firstName> <lastName>" "<company>"` — find their recent activity
2. `"<company>" hire OR launch OR funding 2026` — recent company news

Save findings to `.cold/research/lead-personalization/<email-hash>.md` so retries don't re-search:

```markdown
# Personalization — <firstName> <lastName> @ <company>

## Lead
- Email: ...
- Title: ...
- LinkedIn: ...

## Signals (web search)
- <signal 1 with source URL>
- <signal 2>

## Suggested hook for opener
<one-line hook the cold-draft skill will use>
```

If WebSearch fails or returns nothing useful, write a placeholder noting "no signal" — do NOT block the import.

### Step 5 — Push to FoxReach

Use the existing `foxreach` CLI. Create a campaign first, then import leads to it.

```bash
# Create campaign (use a JSON body matching FoxReach's POST /api/v1/campaigns schema)
foxreach campaigns create \
  --name "<campaign-name>" \
  --daily-limit 50

# Capture id from output
CAMPAIGN_ID=$(foxreach campaigns list --json | jq -r '.[0].id')

# Import leads
foxreach leads create-batch --csv .cold/import.csv --campaign $CAMPAIGN_ID
```

(Adjust subcommands to match the live `foxreach --help` output. If a subcommand doesn't exist, fall back to the skill-side fallback contract — see "Fallback" below.)

### Step 6 — Save state

Write `.cold/last-import.json`:

```json
{
  "campaignId": "<id>",
  "campaignName": "<name>",
  "importedAt": "2026-04-29T...",
  "scored": 142,
  "imported": 87,
  "droppedBelow": 55,
  "personalization": "enabled" or "disabled",
  "perLeadResearchCount": 87
}
```

### Step 7 — Print summary

```
Imported: 87 leads (scored 142, dropped 55 below fit threshold 0.5).
Campaign: cmd_abc123 ("Q2 SaaS founders")
Per-lead research: enabled (87 lookups, cached at .cold/research/lead-personalization/)

Next:
  /cold experiment    Design the first A/B (subject lines)
  /cold draft         Generate variants per the experiment
  /cold send          Push to FoxReach with full pre-flight
```

## Fallback contract (CLI → curl → docs)

If a `foxreach` subcommand fails or doesn't exist:

1. **Cached OpenAPI:**
   ```bash
   jq '.paths."/leads"' .cold/docs-cache/foxreach-openapi.json
   ```
   Find the right endpoint + method.

2. **Raw curl:**
   ```bash
   curl -X POST "https://api.foxreach.io/api/v1/leads/import" \
     -H "Authorization: Bearer $FOXREACH_API_KEY" \
     -F "file=@.cold/import.csv" \
     -F "campaignId=$CAMPAIGN_ID"
   ```

3. **Docs:**
   ```
   WebFetch https://docs.foxreach.io/api-reference/leads/list-leads
   ```
   (or whichever specific page matches the action — the doc tree is `https://docs.foxreach.io/api-reference/<resource>/<action>`).

4. **Surface error to user** with what was tried and stop. Do NOT guess endpoint paths.

## Constraints

- Never push leads with `fit < threshold`. They burn budget and reputation.
- Dedupe against any prior import on the same workspace (FoxReach handles dupes; we trust it).
- Per-lead research is **off by default**. Only runs if user opted in at `/cold init`.
- Never call any external enrichment provider unless explicitly added by the user (deferred to v0.3).

## References

- Spec: https://cold.md
- FoxReach API docs: https://docs.foxreach.io/api-reference/leads/list-leads
- foxreach CLI: `pip install foxreach-cli` (lives in foxreach/integrations/cli/)
