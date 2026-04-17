# cold.md - CLAUDE.md

## What is this
An opinionated, executable spec for AI-driven cold outreach. A `cold.md` file defines a sender's identity, audience, voice, proof, sequences, and banned phrases. Any conforming agent (Claude Code skill, FoxReach, custom tooling) reads it and produces outreach that matches.

Domain: [cold.md](https://cold.md)
Repo: github.com/concaption/cold-md
Commercial home: [foxreach.io](https://foxreach.io) (reference implementation - runs your cold.md at scale)

## Layout

```
spec/            The canonical spec. Versioned. spec/cold-md-v0.md is current.
examples/        Real cold.md files. Eat our own food - foxreach.cold.md is live.
skill/           Claude Code skill that reads a cold.md and drafts outreach.
memory/          Architecture decisions, discovery, changelog (don't commit private stuff).
```

## Rules for working in this repo

- **The spec is the product.** Every change to `spec/` is a commercial decision. Discuss in `memory/decisions/` before editing.
- **Small before complete.** The spec must fit on one screen. If a section grows past ~15 lines, split or cut.
- **Executable over descriptive.** Every spec rule must answer "what does a conforming agent do differently?" If it doesn't, delete it.
- **Vendor-neutral in the spec.** FoxReach lives in README + site, not inside the spec.
- **Public from day one.** Assume the world reads every commit. No pricing, no client names inside cold.md files unless the client approved.

## Pre-commit checks
- Spec file under 200 lines
- No broken links in README
- Examples parse as valid cold.md against the spec

## Memory system
- `memory/architecture/` - how pieces fit together
- `memory/decisions/` - why we chose X over Y (append-only, dated)
- `memory/discovery/` - findings not yet acted on
- `memory/changelog/` - per-session summary of what changed

Before any non-trivial change, grep `memory/decisions/` for prior constraints.
