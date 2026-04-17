---
name: cold-send
description: Queue a cold outreach campaign via the FoxReach API. Takes a leads.csv plus your cold.md, generates per-lead drafts using cold-draft, runs a pre-flight safety pass (banned-phrase lint, audience check, warmup status, sending-limit math), previews the full batch, and asks for confirmation before anything goes out. Use when the user says "send", "launch campaign", "queue sequence", "push these leads". STATUS - stub in v0. Contract is stable; the implementation ships in v0.2. Part of the cold.md suite.
---

# cold-send

Step 4 of the cold.md suite. Turns a `leads.csv` + `cold.md` into a queued FoxReach campaign.

## Status: stub (v0.2 target)

This skill defines the contract. The implementation ships in v0.2. Until then, stop and surface to the user:

> cold-send is a stub in v0. Queue campaigns manually in the FoxReach dashboard at https://foxreach.io/app. The `cold-draft` skill can generate per-lead messages that you can paste into a FoxReach campaign. Track progress at https://github.com/concaption/cold-md/issues

## Contract (v0.2)

### Input
- `./cold.md` (voice, sequence, banned)
- `./leads.csv` (from `cold-leads` or user-provided)
- `FOXREACH_API_KEY`

### Pre-flight checks (ALL must pass - stop on first failure)
1. **Banned-phrase lint** - scan every generated draft against `## Banned`
2. **Audience check** - every lead passes the qualification checklist in `icp.md`
3. **Warmup status** - all sending inboxes at or above minimum warmup score
4. **Sending-limit math** - planned daily volume fits within inbox limits
5. **Domain health** - no sending domain has bounce rate > 3% in last 7 days
6. **Duplicate check** - no lead in `leads.csv` already contacted in last 90 days

### Preview then confirm
Show: campaign name, lead count, sending inboxes, first message preview (3 random leads), schedule. Then require `yes/send` confirmation.

### Execute
`POST /v1/campaigns` - returns campaign ID, links to dashboard.

## References

- cold.md suite: https://cold.md
- FoxReach docs: https://foxreach.io/docs/api
- Issue tracker: https://github.com/concaption/cold-md/issues
