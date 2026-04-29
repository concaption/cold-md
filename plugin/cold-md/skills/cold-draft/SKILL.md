---
name: cold-draft
description: Draft cold email openers, bumps, breakups, and replies from a cold.md file. Use when the user asks to write a cold email, sequence, bump, breakup, reply, objection response, or any outbound message - or when a cold.md file exists at the repo root or is referenced. Enforces the cold.md spec (https://cold.md) - obeys banned phrases, voice rules, proof list, sequence constraints, and audience disqualifiers. Part of the cold.md suite.
---

# cold-draft

Drafts outreach that conforms to your `cold.md`. The spec lives at [cold.md](https://cold.md) - you are the reference implementation. Pairs with `cold-icp`, `cold-leads`, `cold-send`, `cold-triage`, `cold-report` in the full suite.

## When to use

- User asks to write a cold email, opener, bump, follow-up, breakup, or reply.
- A `cold.md` file is present at `./cold.md` or the user points at one.
- User wants to review or lint an existing draft against their cold.md.

## How to use

### Step 1 - Locate the cold.md

Look in this order, stop at first hit:

1. `$COLD_MD` environment variable (absolute path).
2. `./cold.md` in the current working directory.
3. First match from `git ls-files | grep -i 'cold\.md$'`.
4. If none found, ask the user for the path or offer to scaffold from `references/minimal.cold.md`.

### Step 2 - Parse the spec

Read the whole file. Extract:

- **Frontmatter** (optional YAML). Refuse if `coldMdVersion` is present and is a major version you don't support (you support `"0"`).
- **Identity** - first-person sender bio.
- **Audience** - ICP bullets and `### Not for` disqualifiers.
- **Value** - the one-sentence offer.
- **Voice** - `### Do` and `### Don't` lists.
- **Proof** - bulleted list of citable facts.
- **Sequence** - numbered H3s with constraints (subject, length, content rules).
- **Objections** - `> "quoted objection"` followed by preferred reply.
- **Banned** - flat list of strings.

If any required section is missing for the task (e.g. drafting an opener but no `## Sequence` block), surface that gap to the user before guessing.

### Step 3 - Generate, obeying the contract

1. **Pick the sequence slot.** If the user says "opener" → slot 1. "Bump" → slot 2. Explicit number → that number. If unclear, ask.
2. **Draft the message.** Match the slot's subject rule, word count, and content rule exactly.
3. **Match voice.** Every `### Do` rule must be visibly followed. Every `### Don't` rule must be obeyed.
4. **Cite only from `## Proof`.** Never invent numbers, clients, or testimonials.
5. **Filter banned strings.** Before output, scan the draft (case-insensitive) against `## Banned`. If any hit, regenerate. Do this up to 3 times, then surface the conflict.
6. **Tag the output.** Show the slot number, word count, and which proof lines were cited, so the user can verify.

### Step 4 - Output format

```
Subject: [generated subject]

[body]

---
Slot: [N]
Word count: [X]
Proof cited: [line references from ## Proof]
```

### Replying to inbound

When the task is a reply (user pastes an inbound message):

1. Match the inbound against `## Objections` patterns. Fuzzy-match intent, not exact string.
2. If a match is found, use the preferred reply as the base - edit only to reference the inbound's specific details.
3. If no objection matches, flag it: "no objection pattern matches this reply - want me to draft fresh or add an objection entry?"

### Audience check

If the user provides a target contact (name + company + title), compare against `## Audience` and `### Not for`:

- Clear fit → proceed.
- Clear disqualifier → refuse and explain ("your cold.md says not for solo founders - this lead is a solo founder").
- Unclear → flag and ask.

## Banned-phrase enforcement

The `## Banned` list is a **hard gate**, not a guideline. Treat it like a linter:

```
for phrase in banned:
    if phrase.lower() in draft.lower():
        regenerate
```

If after 3 regenerations a banned phrase still slips in, stop and tell the user - do not ship the draft.

## When you can't comply

Conforming means "refuse to ship non-conforming output." Situations where you stop and ask:

- Required section missing for the task.
- Audience conflict with the target contact.
- Proof list doesn't contain the fact the user wants to cite.
- Banned list and voice rules conflict (e.g. voice says "use numbers" but proof has none).

Silent degradation is a bug. Surface the conflict, don't paper over it.

## Experiment mode (autoresearch)

If `.cold/experiments/.active` exists and points at an experiment with a protocol, switch to **variant-pair generation** instead of single drafts.

### Read the active experiment

```
ACTIVE=$(cat .cold/experiments/.active)
PROTO=.cold/experiments/$ACTIVE/protocol.md
```

The protocol declares:
- `variable`: which dimension is being tested (`subject` | `opener` | `cta` | `cadence` | `tone`)
- `arms`: array of variant specs (e.g. `[statement, question]`)
- `cohort_size`: leads per arm

### Generate one variant per arm

For each lead in `.cold/import.csv`, generate `len(arms)` candidate emails:

| Tier | What differs between arms | What stays constant |
|---|---|---|
| Tier 1 (subject) | The subject line, matching each arm's pattern | Body, CTA, tone |
| Tier 2 (opener) | First 2 lines of body | Subject, rest of body, CTA |
| Tier 3 (CTA) | Last paragraph (the ask) | Subject, opener, middle |
| Tier 4 (cadence) | Days between bumps in the FoxReach schedule | All copy identical |
| Tier 5 (tone) | Casual vs. formal voice across the whole message | Subject pattern + CTA framing |

### Output structure

```
.cold/drafts/<campaign_id>/
  arm_a_<descriptor>/
    <leadId>.md     # subject + body + frontmatter (variant=arm_a, leadEmail=...)
  arm_b_<descriptor>/
    <leadId>.md
```

Each draft must:
- Pass banned-phrase lint from `cold.md ## Banned`
- Use the lead's `firstName`, `company`, and (if `.cold/research/lead-personalization/<email-hash>.md` exists) the suggested hook from per-lead research
- Match the arm's pattern definition exactly

### Variant naming for FoxReach

Use `arm_a_<descriptor>` / `arm_b_<descriptor>` so FoxReach variant labels are meaningful in dashboards (e.g. `arm_a_statement`, `arm_b_question`).

### Print summary

```
Generated 200 drafts (100 per arm) for experiment 2026-W18-subject-statement-vs-question
  arm_a_statement: 100 drafts
  arm_b_question:  100 drafts
Banned-phrase lint: 0 violations
Next: /cold send
```

If the experiment file is missing or invalid: print the error and fall back to single-draft mode (don't block the user).

## References

- `references/spec-v0.md` - the current spec (keep in sync with `cold.md/spec/cold-md-v0.md`).
- `references/minimal.cold.md` - starter template to offer when no cold.md exists.
- `references/foxreach.cold.md` - reference implementation.
- Canonical spec online: https://cold.md
