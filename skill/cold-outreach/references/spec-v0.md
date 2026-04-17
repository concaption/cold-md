# cold.md - v0

> A single markdown file that tells an AI agent how to do your cold outreach.

## Why this exists

Every AI cold-outreach tool today reinvents the same inputs - ICP, voice, value prop, objections, banned words - inside its own UI, database, or prompt template. The inputs don't travel. You can't `git diff` them. You can't version them. You can't hand them to a different agent next month.

`cold.md` is one file, committed to a repo, that any conforming agent reads before it writes a single email.

## File location

A project's cold.md lives at `./cold.md` (repo root). Agents look there first. A path override is optional via `COLD_MD=path/to/file`.

## Structure

A cold.md file has **eight sections**, in order. Sections are H2 (`##`). Sections are optional but must appear in this order when present.

```
# [Your product or campaign name]

## Identity
## Audience
## Value
## Voice
## Proof
## Sequence
## Objections
## Banned
```

Anything above the first H2 is a free-form intro (description, links, license). Anything after `## Banned` is ignored by conforming agents.

---

## Section contracts

### `## Identity` - who is sending

One paragraph. Name, role, company, one-line bio. Written in first person. Example:

```
I'm Usama, founder of FoxReach. I build cold email infrastructure that
doesn't torch your domain. Previously ran outbound for 40+ Upwork clients.
```

### `## Audience` - who receives

A bulleted list of ICP signals. Each bullet must be **observable from a name + company + title** - no vibes. Example:

```
- B2B SaaS, 5-50 employees, post-seed
- Title: Head of Growth, Head of Demand Gen, VP Marketing
- Currently running outbound (uses Instantly, Smartlead, or Apollo)
- English-speaking markets (US, UK, CA, AU)
```

Disqualifiers go under a `### Not for` subheading:

```
### Not for
- Agencies (wrong price point)
- Solo founders without an outbound motion yet
```

### `## Value` - the offer

**One sentence.** Not a paragraph. If it doesn't fit in one sentence, the offer isn't clear enough to send cold.

```
We warm up your inboxes, route replies through AI triage, and hand you a
booked-calls dashboard - for agencies managing 5+ client domains.
```

### `## Voice` - how the writing sounds

Dos and don'ts, each a single short line. Example:

```
### Do
- Short sentences. One idea each.
- Name a specific tool or number in the first line
- Close with a single yes/no question

### Don't
- Start with "I hope this email finds you well"
- Use em dashes
- Name-drop unless it's relevant to their problem
```

Voice rules are **enforced verbatim**. If you say "no em dashes," the agent refuses to emit them.

### `## Proof` - what's real

A bulleted list of facts the agent may cite. Each line should stand alone as a claim. Example:

```
- 40+ B2B SaaS clients in 2024-2026
- Average 8.4% reply rate across warmed domains
- Built the warmup engine that Plastix Marketing uses across 12 client domains
- Featured in [case study on domain reputation](https://foxreach.io/blog/deliverability)
```

Agents must only cite from this list. No hallucinated numbers, no invented testimonials.

### `## Sequence` - the messages

Numbered H3s (`### 1. ...`, `### 2. ...`). Each slot defines **purpose + constraint**, not the literal copy. Example:

```
### 1. Opener (Day 0)
- Subject: 5 words max, lowercase, no buzzwords
- Body: 40-60 words
- Reference one observable fact about their company
- Ask one yes/no question

### 2. Bump (Day 3)
- Subject: "Re: " + original
- Body: 20 words max
- Offer one new piece of value (case study, teardown, benchmark)
- No question

### 3. Breakup (Day 7)
- Subject: "Last one"
- Body: 15 words max
- Soft goodbye, door-open, no CTA
```

Agents generate actual copy that fits the slot constraints.

### `## Objections` - how to respond

A list of `> objection` followed by the preferred reply. Example:

```
> "We already use Instantly."

Great - most of our best clients came from Instantly. We're the next
layer: reply triage, booked-calls dashboard, multi-domain warmup. Want a
5-minute teardown of your current sequences?

> "Not interested."

No problem. If you change your mind, the deliverability audit is free and
takes 10 minutes - https://foxreach.io/audit. Best of luck.
```

When replying to inbound, agents match the objection first before generating new content.

### `## Banned` - phrases that never appear

Flat list of strings. Agents **must never emit** these, case-insensitive. Example:

```
- I hope this email finds you well
- circle back
- touch base
- synergy
- move the needle
- just checking in
- —  (em dash)
```

Banned strings are a hard filter, not a suggestion. If a generated message contains one, the agent regenerates.

---

## What a conforming agent does

1. **Reads `cold.md`** before generating any outreach.
2. **Refuses** to emit any string listed in `## Banned`, case-insensitive.
3. **Matches voice rules verbatim.** Not "style inspired by" - obeyed.
4. **Only cites facts from `## Proof`.** No numbers, names, or testimonials invented.
5. **Respects sequence slots.** A message tagged `sequence: 2` must satisfy the constraints of `### 2.`.
6. **Maps inbound to `## Objections` first** before generating a new reply. If no objection matches, flags and asks.
7. **Never contacts anyone who fails `## Audience`** - including the `### Not for` list.

If a spec rule would be violated, the agent stops and surfaces the conflict. Silent degradation is a bug.

---

## Frontmatter (optional)

YAML frontmatter at the top of the file for machine metadata:

```yaml
---
coldMdVersion: "0"
owner: "Usama Navid <usama@foxreach.io>"
updated: 2026-04-17
license: CC-BY-4.0
---
```

`coldMdVersion` is required if frontmatter is present. Agents refuse unknown major versions.

---

## Versioning

This spec is **v0**. Breaking changes allowed until v1. After v1, breaking changes bump the major. Agents declare which versions they support.

## License

This spec is CC-BY-4.0 - use it, fork it, ship it. Attribution appreciated, not enforced.
