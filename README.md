# cold.md

**One markdown file that tells an AI agent how to do your cold outreach.**

```
# My Product - cold.md

## Identity     - who's sending
## Audience     - ICP + disqualifiers
## Value        - the offer, in one sentence
## Voice        - dos and don'ts, obeyed verbatim
## Proof        - facts the agent may cite
## Sequence     - slots (opener, bump, breakup) with constraints
## Objections   - preferred replies to common pushbacks
## Banned       - phrases that never appear
```

That's it. One file, eight sections, any conforming agent reads it and produces outreach that matches.

## Why

Every AI cold-outreach tool today reinvents the same inputs - inside its own UI, database, or prompt template. The inputs don't travel. You can't `git diff` them. You can't version them. You can't hand them to a different agent next month.

`cold.md` is the portable, executable, vendor-neutral source of truth for your outbound.

- **One file, in your repo.** Not a SaaS form. Not a prompt library. Not a Notion doc.
- **Executable, not descriptive.** Banned phrases are a hard filter. Voice rules are enforced verbatim. Proof is the only list the agent can cite.
- **Vendor-neutral.** Any tool that implements the spec can read the file. Switch platforms, keep your playbook.

## Quick start

1. Copy [`examples/minimal.cold.md`](./examples/minimal.cold.md) to your repo as `cold.md`.
2. Edit every section for your product.
3. Install the [Claude Code skill](./skill/cold-outreach/) (or use any conforming agent).
4. Ask Claude: *"write an opener for [Lead Name] at [Company]"*. The skill reads `cold.md` and drafts it.

## Examples

- [`examples/minimal.cold.md`](./examples/minimal.cold.md) - starter template, fill in every line.
- [`examples/foxreach.cold.md`](./examples/foxreach.cold.md) - the real cold.md behind [FoxReach](https://foxreach.io). Eat our own food.

## Spec

The canonical spec is at [`spec/cold-md-v0.md`](./spec/cold-md-v0.md). Also published at [cold.md](https://cold.md).

## Claude Code skill

The reference agent is a Claude Code skill at [`skill/cold-outreach/`](./skill/cold-outreach/). It reads a `cold.md` file, drafts messages that obey the spec, and refuses to ship output that violates it.

Install:

```bash
# Copy the skill into your Claude Code skills directory
cp -r skill/cold-outreach ~/.claude/skills/
```

Use:

```
/cold-outreach write an opener for Jane Smith, Head of Growth at Acme SaaS
```

## What a conforming agent does

1. Reads `cold.md` before generating any outreach.
2. Refuses to emit any string in `## Banned` (case-insensitive).
3. Matches `## Voice` rules verbatim - not "style inspired by," obeyed.
4. Cites only from `## Proof` - no invented numbers, names, or testimonials.
5. Respects `## Sequence` slot constraints (subject, length, content).
6. Maps inbound replies to `## Objections` before generating new content.
7. Refuses to contact anyone who fails `## Audience` (including `### Not for`).

Silent degradation is a bug. Surface conflicts, don't paper over them.

## Implementations

- **[Claude Code skill](./skill/cold-outreach/)** (this repo) - reference implementation.
- **[FoxReach](https://foxreach.io)** - commercial platform that runs your `cold.md` at scale: warmup, multi-inbox orchestration, reply triage, booked-calls dashboard.

Build one? Open a PR and add yourself.

## Contributing

The spec is the product. Every change to `spec/` is a commercial decision - open an issue first. Examples, skill improvements, and docs: PRs welcome.

## License

Spec: CC-BY-4.0. Code: MIT. Use it, fork it, ship it.

## Sponsor

Built and maintained by the team at [FoxReach](https://foxreach.io) - cold email infrastructure that doesn't torch your domain.
