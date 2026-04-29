---
name: cold-triage
description: Pull unread inbox replies from FoxReach, surface interested ones, draft responses per cold.md ## Objections, mark routine ones (OOO/not_interested) as read. Replaces v0 stub. Use when the user says "triage replies", "any new replies", "/cold triage", or on a daily cron.
---

# cold-triage

Step 5 of the cold.md autoresearch suite — keeps the inbox sorted and drafts responses to interested replies.

## When to use

- Daily cron — recommended `0 9 * * *` (9am local)
- User asks "any new replies?" or "/cold triage"
- After a campaign is live and FoxReach is receiving replies

## Inputs

- `cold.md` — for `## Objections` (drafted-response patterns) and `## Voice`
- `.cold/last-send.json` — current campaign id
- `.cold/config.json` — research settings (we may need to pull lead enrichment)
- `FOXREACH_API_KEY`

## Process

### Step 1 — Pull unread threads

```bash
foxreach inbox list --filter unread --json > /tmp/unread.json
COUNT=$(jq 'length' /tmp/unread.json)
[ "$COUNT" = "0" ] && { echo "No unread replies. ✓"; exit 0; }
```

### Step 2 — Read each thread's category

FoxReach already auto-categorizes incoming replies (it has its own AI step). Each thread has a `.category` of: `interested | not_interested | out_of_office | bounce | uncategorized | unknown | warmup`.

We trust FoxReach's categorization for routine actions; we re-categorize uncategorized ones with our own pass.

### Step 3 — Bucket by category

| Category | Action |
|---|---|
| `interested` | Surface to user with a drafted response |
| `not_interested` | Mark read, move on |
| `out_of_office` | Snooze for OOO-end-date if parseable, else mark read |
| `bounce` | Already handled by FoxReach's bounce engine — mark read, no action |
| `uncategorized` | Re-categorize via Claude using `cold.md ## Objections` patterns |
| `unknown` | Surface to user — needs human eyes |
| `warmup` | Skip entirely (warmup traffic) |

### Step 4 — Draft responses for interested replies

For each `interested` thread:

1. Pull the conversation: `foxreach inbox conversation <reply_id> --json`
2. Read `cold.md ## Objections` for the response patterns
3. Read the lead's enrichment if it exists at `.cold/research/lead-personalization/<email-hash>.md`
4. Draft a response using:
   - The objection-handling patterns
   - The lead's specific signal from research (if any)
   - `cold.md ## Voice` rules (banned phrases, voice dos/don'ts)
5. Save to `.cold/drafts/replies/<reply_id>.md`:

```markdown
---
replyId: rpl_abc123
leadEmail: jane@acme.io
category: interested
draftedAt: 2026-04-29T...
---

# Suggested response to <jane>

> Their reply: "Yeah send the deck, what's the price band?"

## Drafted response

Hi Jane,

Deck attached. Pricing depends on volume — we typically run $X-$Y/mo
for <vertical>. Quick call to see if there's a fit?

[calendar link]

— Usama

## Why this response
- Objection pattern: "asking for pricing" → answer with band, ask for call
- Voice: short, direct, no em dashes
- Banned check: passes
```

### Step 5 — Re-categorize uncategorized

For each thread with `category: uncategorized`, run Claude:

```
Given this cold.md ## Objections section:
<objections>

And this incoming reply:
<reply body>

Output strictly:
{ "category": "interested|not_interested|out_of_office|unknown",
  "reason": "<one sentence>" }
```

Update FoxReach:

```bash
foxreach inbox update <reply_id> --json '{"category": "<new>"}'
```

### Step 6 — Bulk-mark routine ones as read

For `not_interested`, `out_of_office`, `bounce` (after surfacing to user if any new ones):

```bash
foxreach inbox bulk-update --json '{"ids": [...], "isRead": true}'
```

### Step 7 — Print summary

```
Triage complete (4 unread → 0):
  ✓ Interested:     2 — drafts in .cold/drafts/replies/
  ✓ Not interested: 1 — marked read
  ✓ OOO:            0
  ✓ Bounce:         0
  ✓ Re-categorized: 1 (was uncategorized → interested)

Review interested replies:
  cat .cold/drafts/replies/rpl_*.md

Send a drafted response:
  foxreach inbox reply <reply_id> --body @./draft.md

Or skip and reply manually in the FoxReach inbox UI.
```

## Fallback contract

Same CLI → curl → docs pattern.

- Curl: `curl -H "X-API-Key: $FOXREACH_API_KEY" "https://api.foxreach.io/api/v1/inbox/threads?category=uncategorized"`
- Docs: `WebFetch https://docs.foxreach.io/api-reference/inbox/list-threads`

## Constraints

- **Never auto-send a reply.** Always save the draft and let the user review + send.
- Don't act on `bounce` replies — FoxReach's bounce engine handles them.
- Respect `cold.md ## Banned` in drafted responses.
- If FoxReach categorization disagrees with ours, defer to ours — but log the disagreement to `.cold/decisions.md` for the user to review.

## Output

- `.cold/drafts/replies/<reply_id>.md` (drafted responses to interested replies)
- Updated FoxReach inbox state (read flags, category corrections)

## References

- Spec: https://cold.md
- FoxReach inbox docs: https://docs.foxreach.io/api-reference/inbox/list-threads
- Reply send: https://docs.foxreach.io/api-reference/inbox/send-reply
