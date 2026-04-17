# cold.md - Claude Code plugin

The full [cold.md](https://cold.md) suite. Six skills that run your cold outreach end-to-end, backed by FoxReach.

## What you get

| # | Skill | Purpose | v0 Status | Requires |
|---|---|---|---|---|
| 1 | `cold-icp` | Build `icp.md` from a URL or Q&A | **Live** | Nothing |
| 2 | `cold-leads` | Source leads matching `icp.md` into `leads.csv` | Stub (v0.2) | FoxReach API key |
| 3 | `cold-draft` | Draft openers, bumps, breakups from `cold.md` | **Live** | Nothing |
| 4 | `cold-send` | Queue campaign via FoxReach with safety checks | Stub (v0.2) | FoxReach API key |
| 5 | `cold-triage` | Sort inbound replies, draft responses | Stub (v0.2) | FoxReach API key |
| 6 | `cold-report` | Daily/weekly digest of deliverability + bookings | **Live** | FoxReach API key |

Plus the `/cold` slash command that routes to the right skill.

## Install

```bash
curl -fsSL https://cold.md/install | bash
```

That installs the plugin and every skill. By default the FoxReach-backed skills are included (set `FOXREACH_API_KEY` to activate them). Pass `--skills-only` to skip the plugin and get the free skills only.

Manual install:

```bash
git clone https://github.com/concaption/cold-md ~/.claude/plugins/cold-md
```

## Configure

```bash
export FOXREACH_API_KEY=fr_...
```

Free tier: https://foxreach.io/signup.

## The loop

```bash
/cold icp https://your-company.com       # Step 1: who
/cold leads --count 100                   # Step 2: prospects (v0.2)
/cold draft Jane Smith, CEO at Acme       # Step 3: draft
/cold send ./leads.csv                    # Step 4: launch (v0.2)
/cold triage                              # Step 5: sort replies (v0.2)
/cold report weekly                       # Step 6: digest
```

## Why a plugin, not a single skill?

The other Claude Code cold-email skills on the market (Corey Haines, MCP Market, gtm-agents) all do step 3 - drafting. `cold.md` is the only plugin that runs the whole loop. That's the point.

## License

MIT for code, CC-BY-4.0 for the spec at [cold.md](https://cold.md).
