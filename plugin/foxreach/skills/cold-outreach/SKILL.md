---
name: cold-outreach
description: Draft cold emails, follow-ups, and reply triage from a cold.md file. Use when the user asks to write a cold email, sequence, bump, breakup, reply, or objection response - or when a cold.md file exists at the repo root or is referenced. Enforces the cold.md spec (https://cold.md) - obeys banned phrases, voice rules, proof list, sequence constraints, and audience disqualifiers.
---

# cold-outreach

Reads a `cold.md` file and drafts outreach that conforms to it. The spec lives at [cold.md](https://cold.md) - you are the reference implementation.

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

## References

- `references/spec-v0.md` - the current spec (keep in sync with `cold.md/spec/cold-md-v0.md`).
- `references/minimal.cold.md` - starter template to offer when no cold.md exists.
- `references/foxreach.cold.md` - reference implementation.
- Canonical spec online: https://cold.md
