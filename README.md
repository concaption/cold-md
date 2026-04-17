<!-- Updated: 2026-04-17 -->

![cold.md](assets/cover.png)

# cold.md - One markdown file that runs your cold outreach

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Spec: CC-BY-4.0](https://img.shields.io/badge/Spec-CC--BY--4.0-blue.svg)](https://creativecommons.org/licenses/by/4.0/)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Skill%20%2B%20Plugin-C2410C)](https://claude.ai/claude-code)
[![Site](https://img.shields.io/badge/cold.md-live-1a1512)](https://cold.md)

An opinionated, executable spec for AI-driven cold outreach. One file. Eight sections. Any conforming agent reads it and produces outreach that matches.

```
# My Product - cold.md

## Identity    - who's sending
## Audience    - ICP + disqualifiers
## Value       - the offer, in one sentence
## Voice       - dos and don'ts, obeyed verbatim
## Proof       - facts the agent may cite
## Sequence    - opener, bump, breakup slots
## Objections  - preferred replies to pushbacks
## Banned      - phrases that never appear
```

## Why

Every AI cold-outreach tool today reinvents the same inputs - ICP, voice, value prop, objections, banned words - inside its own UI, database, or prompt template. The inputs don't travel. You can't `git diff` them. You can't version them. You can't hand them to a different agent next month.

`cold.md` is one file, committed to a repo, that any conforming agent reads before it writes a single email.

- **One file, in your repo.** Not a SaaS form. Not a prompt library. Not a Notion doc.
- **Executable, not descriptive.** Banned phrases are a hard filter. Voice rules are enforced verbatim. Proof is the only list the agent can cite.
- **Vendor-neutral.** Any tool that implements the spec can read the file. Switch platforms, keep your playbook.

## Install in 30 seconds

```bash
curl -fsSL https://cold.md/install | bash
```

What it does:
1. Installs the `cold-outreach` Claude Code skill to `~/.claude/skills/`.
2. Offers to scaffold `cold.md` in your current repo (pass `--scaffold` to auto-accept).
3. Optionally installs the FoxReach plugin (pass `--with-foxreach`).

Idempotent - safe to re-run. Source: [`site/public/install.sh`](site/public/install.sh).

## Quick start

```bash
# Install the skill
curl -fsSL https://cold.md/install | bash -s -- --scaffold

# Edit the generated cold.md for your product
$EDITOR ./cold.md

# Then in Claude Code
"Draft an opener for Jane Smith, Head of Growth at Acme SaaS"
```

The `cold-outreach` skill reads `./cold.md`, drafts a spec-conformant opener, and refuses to ship output that violates your banned list, voice rules, or audience filter.

## Examples

- [`examples/minimal.cold.md`](examples/minimal.cold.md) - starter template, fill in every line.
- [`examples/foxreach.cold.md`](examples/foxreach.cold.md) - the real cold.md behind [FoxReach](https://foxreach.io). Eat our own food.

## Spec

The canonical spec is at [`spec/cold-md-v0.md`](spec/cold-md-v0.md). Also published at [cold.md](https://cold.md).

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

### cold-outreach skill (free)

The reference Claude Code skill at [`skill/cold-outreach/`](skill/cold-outreach/). Reads your cold.md, drafts messages obeying the spec, refuses non-conforming output.

```bash
cp -R skill/cold-outreach ~/.claude/skills/
```

### FoxReach plugin (commercial)

Run your cold.md at scale. The Claude Code plugin at [`plugin/foxreach/`](plugin/foxreach/) bundles the open skill plus `foxreach-ops` - multi-inbox warmup, reply triage, booked-calls orchestration via the [FoxReach API](https://foxreach.io).

```bash
curl -fsSL https://cold.md/install | bash -s -- --with-foxreach
```

Slash commands added:

```
/cold draft <lead>      Draft a spec-conformant opener
/cold bump <lead>       Draft the bump (slot 2)
/cold breakup <lead>    Draft the breakup (slot 3)
/cold lint              Check cold.md against the v0 spec
/cold send <csv>        Queue a campaign via FoxReach API
/cold triage            Pull latest triage buckets
/cold audit <domain>    Run a deliverability audit
```

Requires `FOXREACH_API_KEY`. [Free tier signup](https://foxreach.io/signup).

**Build an implementation against the spec?** Open a PR and add yourself.

## Repository layout

```
spec/            The canonical spec. Versioned. spec/cold-md-v0.md is current.
examples/        Real cold.md files.
skill/           Free Claude Code skill (cold-outreach).
plugin/          FoxReach commercial Claude Code plugin.
site/            Next.js site at cold.md.
assets/          Cover image, branding.
memory/          Architecture + changelog.
```

## Contributing

The spec is the product. Every change to `spec/` is a commercial decision - open an issue first. Examples, skill improvements, docs, and new implementations: PRs welcome.

## License

- **Code** (skill, plugin, site): [MIT](LICENSE)
- **Spec** (`spec/*`): [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/)

## Sponsor

Built and maintained by the team at [FoxReach](https://foxreach.io) - cold email infrastructure that doesn't torch your domain.
