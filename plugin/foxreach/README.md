# FoxReach - Claude Code plugin

Run your [cold.md](https://cold.md) at scale, from inside Claude Code.

## What you get

| Skill | Purpose | Requires |
|---|---|---|
| `cold-outreach` | Drafts messages that conform to your cold.md spec (same as the free standalone skill). | Nothing |
| `foxreach-ops` | Sends sequences, checks reply triage, runs deliverability audits via the FoxReach API. | `FOXREACH_API_KEY` |

Plus one slash command: `/cold draft | bump | breakup | lint | send | triage | audit`.

## Install

```bash
curl -fsSL https://cold.md/install | bash -s -- --with-foxreach
```

Or manually:

```bash
git clone https://github.com/concaption/cold-md ~/.claude/plugins/cold-md
# Point Claude Code at ~/.claude/plugins/cold-md/plugin/foxreach
```

## Configure

```bash
export FOXREACH_API_KEY=fr_...
```

Get a free key at https://foxreach.io/signup.

## Usage

```
/cold draft Jane Smith, Head of Growth at Acme SaaS
```

Drafts a spec-conformant opener from the `cold.md` in your current repo. Refuses to ship if it would violate your banned list, voice rules, or audience filter.

```
/cold send ./leads.csv
```

Queues a campaign via FoxReach. Previews the draft, lead count, sending inboxes, and asks for a `yes/send` confirmation before anything goes out.

## Why a plugin?

The open [cold-outreach skill](../../skill/cold-outreach/) drafts. This plugin drafts AND operates - it connects the `cold.md` spec to a real sending infrastructure. If you want the same spec to go from file to booked calls without leaving Claude Code, this is the layer.

## License

MIT. The bundled `cold-outreach` skill and spec remain MIT/CC-BY-4.0.
