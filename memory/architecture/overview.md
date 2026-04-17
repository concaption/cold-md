# Architecture - cold.md

## The three layers

```
┌─────────────────────────────────────────┐
│  Spec (spec/cold-md-v0.md)              │  ← the product
│  - Eight sections, ordered              │
│  - Defines what a conforming agent does │
└─────────────────────────────────────────┘
              ▲  reads
              │
┌─────────────────────────────────────────┐
│  Agent (skill/cold-outreach/SKILL.md)   │  ← reference implementation
│  - Parses cold.md                       │
│  - Enforces banned list, voice, proof   │
│  - Drafts messages per sequence slots   │
└─────────────────────────────────────────┘
              ▲  consumes
              │
┌─────────────────────────────────────────┐
│  User's cold.md (in their repo)         │  ← the config
│  - Identity, Audience, Value, Voice...  │
│  - Portable, versioned, diffable        │
└─────────────────────────────────────────┘
```

## Data flow

1. User writes `cold.md` in their repo (or copies from `examples/minimal.cold.md`).
2. User invokes the `cold-outreach` skill in Claude Code.
3. Skill locates the cold.md, parses it, extracts sections.
4. Skill drafts a message respecting voice + banned + proof + sequence.
5. Skill outputs the draft with citations (which proof lines it used) and metadata (slot, word count).

## Distribution

- **Spec** - hosted at cold.md (the domain) + GitHub.
- **Skill** - published in the Claude Code skill marketplace and as a copy-paste install from the repo.
- **Commercial** - FoxReach is the reference SaaS implementation; runs cold.md at scale.

## Upstream/downstream

- **Upstream of the spec:** nothing. The spec is the root of truth.
- **Downstream:**
  - The Claude Code skill (this repo).
  - FoxReach's prompt layer (separate repo).
  - Future: open-source Python/TS parsers, third-party tools.
