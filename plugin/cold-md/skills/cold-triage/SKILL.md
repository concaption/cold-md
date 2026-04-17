---
name: cold-triage
description: Sort inbound replies into buckets (interested, not_now, ooo, bounced, unsubscribe, wrong_person), match each against cold.md objections, and draft responses. Use when the user says "triage", "sort replies", "what replied", or when cold-report flags items in the needs_review bucket. Reads live replies from FoxReach API. STATUS - stub in v0. Contract is stable; the implementation ships in v0.2. Part of the cold.md suite.
---

# cold-triage

Step 5 of the cold.md suite. Takes raw replies, buckets them, drafts responses that match `## Objections`.

## Status: stub (v0.2 target)

This skill defines the contract. The implementation ships in v0.2. Until then, stop and surface to the user:

> cold-triage is a stub in v0. Replies live in the FoxReach dashboard at https://foxreach.io/app. For now, paste individual inbounds and the `cold-draft` skill will map them against your `## Objections` and draft a reply. Track progress at https://github.com/concaption/cold-md/issues

## Contract (v0.2)

### Input
- `FOXREACH_API_KEY`
- `./cold.md` (for the `## Objections` section)
- Optional: `--campaign-id X`, `--since N-days`, `--bucket needs_review`

### Buckets
- `interested` - positive intent, wants to learn more
- `not_now` - acknowledged, not now, door open
- `ooo` - out of office / auto-reply
- `bounced` - deliverability failure
- `unsubscribe` - explicit opt-out (STOP processing, mark in FoxReach)
- `wrong_person` - "I'm not the right person, contact X instead"
- `needs_review` - can't classify confidently

### Flow (v0.2)
1. `GET /v1/replies?bucket=needs_review` - pull replies
2. For each: classify bucket using LLM + `## Objections` patterns
3. If bucket matches a `> "objection"` in `cold.md`, use the preferred reply as base
4. If no pattern matches, flag and ask: *"No objection entry matches this. Want to draft fresh, or add an entry?"*
5. `POST /v1/replies/{id}/bucket` + draft reply to dashboard for human approval

### Never auto-send
Every triaged reply goes to FoxReach's approval queue. Human clicks "send" in the dashboard.

## References

- cold.md suite: https://cold.md
- FoxReach docs: https://foxreach.io/docs/api
- Issue tracker: https://github.com/concaption/cold-md/issues
