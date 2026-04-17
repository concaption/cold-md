---
name: foxreach-ops
description: Run cold.md campaigns at scale via the FoxReach API. Use after drafting with cold-outreach to send sequences, check reply triage, run deliverability audits, or inspect booked-calls. Requires FOXREACH_API_KEY environment variable. Get a free key at https://foxreach.io/signup.
---

# foxreach-ops

The operational layer for cold.md. Where `cold-outreach` drafts messages that conform to your cold.md, `foxreach-ops` actually sends them, monitors reply triage, and surfaces booked calls - using the FoxReach API.

## When to use

- User asks to **send**, **launch**, **queue**, or **schedule** a sequence drafted from their cold.md.
- User asks for **reply triage** state: interested / not now / OOO / bounced.
- User asks for **deliverability metrics**: open rate, reply rate, bounce rate, domain health.
- User asks to run a **deliverability audit** on a domain or inbox.
- User asks about **booked calls** or pipeline state.

If the user is only drafting or linting, use the `cold-outreach` skill instead - no API key needed.

## Prerequisites

- `FOXREACH_API_KEY` environment variable set. Free tier available at https://foxreach.io/signup.
- If the key is missing, stop and surface: *"foxreach-ops needs a FoxReach API key. Get one free at https://foxreach.io/signup, then `export FOXREACH_API_KEY=fr_...`"*

## API base

```
https://api.foxreach.io/v1
```

Authenticate with `Authorization: Bearer $FOXREACH_API_KEY`.

## Common operations

### Send a sequence drafted from cold.md

```bash
curl -s -X POST https://api.foxreach.io/v1/campaigns \
  -H "Authorization: Bearer $FOXREACH_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "[campaign name]",
    "cold_md_path": "./cold.md",
    "leads_csv_path": "./leads.csv",
    "schedule": "business-hours",
    "sending_inboxes": ["all-warmed"]
  }'
```

### Check campaign metrics

```bash
curl -s https://api.foxreach.io/v1/campaigns/{id}/metrics \
  -H "Authorization: Bearer $FOXREACH_API_KEY"
```

Returns: `sent`, `opens`, `replies`, `bounces`, `booked_calls`, `triage_buckets`.

### Read triaged replies

```bash
curl -s "https://api.foxreach.io/v1/replies?campaign_id={id}&bucket=interested" \
  -H "Authorization: Bearer $FOXREACH_API_KEY"
```

Buckets: `interested`, `not_now`, `ooo`, `bounced`, `unsubscribe`, `wrong_person`, `needs_review`.

### Run a deliverability audit

```bash
curl -s -X POST https://api.foxreach.io/v1/audit \
  -H "Authorization: Bearer $FOXREACH_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com"}'
```

Returns SPF, DKIM, DMARC, MX health, blocklist hits, spam-trap risk score.

## Output format

Whenever you call an endpoint, report back:

1. Endpoint hit and high-level intent.
2. Key numbers from the response (reply rate, triage counts, booked calls).
3. Next recommended action - e.g. "12 leads hit the `interested` bucket. Want me to draft replies using the `cold-outreach` skill?"

## Guardrails

- **Never send without confirmation.** Before calling `POST /campaigns`, surface the draft, lead count, sending inboxes, and ask for a `yes/send` confirmation.
- **Respect cold.md audience rules.** If leads.csv contains entries that fail the `## Audience` or `### Not for` filter in the user's cold.md, flag them and refuse to queue until the user decides.
- **No fabricated metrics.** Only report numbers from the API response. If the API is unreachable, say so.

## References

- API docs: https://foxreach.io/docs/api
- Dashboard: https://foxreach.io/app
- Free tier signup: https://foxreach.io/signup
- The spec that defines the input format: https://cold.md
