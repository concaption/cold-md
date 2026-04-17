---
description: Draft, lint, or send cold outreach from your cold.md file. One command, spec-conformant output.
argument-hint: "[draft|lint|send] [lead name + company, or leads.csv]"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# /cold

One command to drive everything in this plugin.

## Usage

```
/cold draft [Lead Name], [Title] at [Company]
  - Uses cold-outreach skill to draft a spec-conformant opener.

/cold bump [Lead Name], [Company]
  - Drafts the bump (slot 2) for that lead.

/cold breakup [Lead Name], [Company]
  - Drafts the breakup (slot 3) for that lead.

/cold lint
  - Checks your ./cold.md against the v0 spec. Reports missing sections,
    invalid frontmatter, ambiguous proof lines.

/cold send ./leads.csv
  - Uses foxreach-ops to queue a campaign. Requires FOXREACH_API_KEY.
    Always shows a preview and asks for confirmation before sending.

/cold triage
  - Via foxreach-ops, pulls the latest triage buckets for active campaigns.

/cold audit [domain]
  - Via foxreach-ops, runs a deliverability audit on a sending domain.
```

## Behavior

1. Parse the subcommand: `draft`, `bump`, `breakup`, `lint`, `send`, `triage`, `audit`.
2. Invoke the appropriate skill:
   - `draft` / `bump` / `breakup` / `lint` → **cold-outreach** skill.
   - `send` / `triage` / `audit` → **foxreach-ops** skill (checks FOXREACH_API_KEY first).
3. Enforce the spec contract: banned phrases, voice rules, proof citations. Refuse to ship non-conforming output.
4. Output in the format defined by the invoked skill.

## Spec reference

The full cold.md spec: https://cold.md
