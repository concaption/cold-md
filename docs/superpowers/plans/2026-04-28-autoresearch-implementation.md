# cold.md Autoresearch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the autoresearch loop per `spec/2026-04-28-autoresearch-design.md` — 10 skills, a `foxreach` CLI, three small FoxReach API additions, and the diff-based trust-ladder approval flow.

**Architecture:** Skills live in `skills/<name>/SKILL.md`. Each skill is a markdown file the agent reads and executes. State lives in `.cold/` (per project). FoxReach access goes through `foxreach` CLI primarily; raw curl + cached OpenAPI is the fallback. Web research uses Claude Code's `WebSearch` and `WebFetch` directly.

**Tech Stack:** Markdown skills, Bash, Node.js (for the CLI), FoxReach REST API, OpenAI (already integrated in FoxReach).

**Working directory:** all paths relative to `/Users/usama/Documents/Obsidian/buildberg/07-products/cold-md/` unless noted. The FoxReach repo is at `../foxreach/` (sibling).

---

## Phase summary

| Phase | Scope | Shippable? |
|---|---|---|
| 0 | FoxReach API additions (3 endpoints) | yes — backend deploys independently |
| 1 | `foxreach` CLI v1 (covers all hot endpoints) | yes — installable separately |
| 2 | `/cold init` + `.cold/` scaffold + config + OpenAPI cache | yes |
| 3 | `cold-icp` + `cold-offer` (web research, policy-level) | yes |
| 4 | `cold-leads` + `cold-draft` + `cold-send` (full sender path) | yes |
| 5 | `cold-experiment` + `cold-learn` (autoresearch loop core) | yes — main feature |
| 6 | `cold-triage` + `cold-status` + `cold-report` | yes |
| 7 | End-to-end smoke test on a real small campaign | shippable v0 |

Each phase ends with: type-check (where applicable) → manual verify against acceptance criteria → commit → push.

---

## File structure (created/modified)

**New skills (4):**
- `skills/cold-offer/SKILL.md`
- `skills/cold-experiment/SKILL.md`
- `skills/cold-learn/SKILL.md`
- `skills/cold-status/SKILL.md`

**Extended skills (3):**
- `skills/cold-icp/SKILL.md` — add web research validation step
- `skills/cold-draft/SKILL.md` — add experiment-aware variant generation
- `skills/cold-report/SKILL.md` — add experiment outcomes section

**Stubs → real (3):**
- `skills/cold-leads/SKILL.md` — wire to FoxReach + enrichment + ICP scoring
- `skills/cold-send/SKILL.md` — wire to FoxReach campaigns + sequences + variants
- `skills/cold-triage/SKILL.md` — wire to FoxReach inbox

**Init command (new):**
- `plugin/cold-md/commands/init.md` — `/cold init` scaffolding

**Plugin manifest update:**
- `plugin/cold-md/cold.md` — register new skills + commands
- Mirror all of `skills/` into `plugin/cold-md/skills/` so the installer picks them up

**`foxreach` CLI (new repo subfolder):**
- `cli/package.json`
- `cli/bin/foxreach.js`
- `cli/src/client.js` — axios wrapper
- `cli/src/commands/*.js` — one file per resource
- `cli/README.md`
- `cli/install.sh` — npm-installable

**FoxReach backend additions:**
- `../foxreach/backend/app/routers/inbox.py` — add `categorize_stats` endpoint
- `../foxreach/backend/app/main.py` — confirm `/openapi.json` is exposed + CORS-allowed for `cold.md` domain
- `../foxreach/backend/app/routers/leads.py` — add optional `score-fit` endpoint

---

# Phase 0 — FoxReach API additions

### Task 0.1: Add `/openapi-public.json` (filtered to /api/v1 only)

**Files:** `../foxreach/backend/app/main.py`

The default `/openapi.json` exposes the entire app (including internal
`/api/auth`, `/api/admin`, `/api/billing`, etc.) and is gated behind
`debug` mode. We add a separate **`/openapi-public.json`** that:

1. Always serves regardless of debug mode
2. Filters paths to `/api/v1/*` only — the publicly contracted, API-key-
   authenticated surface
3. Adds `Access-Control-Allow-Origin: *` so any origin can fetch it

- [ ] **Step 1: Add the route** above the existing `@app.get("/")` block in `main.py`:

```python
@app.get("/openapi-public.json", include_in_schema=False)
async def public_openapi():
    """
    Public OpenAPI spec — ONLY the /api/v1/* surface (API-key authenticated).
    """
    from fastapi.responses import JSONResponse

    full = app.openapi()
    filtered_paths = {
        path: spec
        for path, spec in full.get("paths", {}).items()
        if path.startswith("/api/v1/")
    }
    public = {
        **full,
        "info": {
            **full.get("info", {}),
            "title": "FoxReach Public API",
            "description": (
                "Public REST API for FoxReach. Authenticate with "
                "`Authorization: Bearer <FOXREACH_API_KEY>`. "
                "Full docs: https://docs.foxreach.io/api-reference"
            ),
        },
        "paths": filtered_paths,
    }
    return JSONResponse(
        content=public,
        headers={"Access-Control-Allow-Origin": "*"},
    )
```

- [ ] **Step 2: Syntax check**

Run: `cd ../foxreach && python -m py_compile backend/app/main.py`
Expected: no errors.

- [ ] **Step 3: Smoke test after deploy**

```
curl -s https://api.foxreach.io/openapi-public.json | jq '.paths | keys[]' | head -10
```

Expected: only paths under `/api/v1/*`. No `/api/auth`, `/api/admin`, `/api/billing`.

- [ ] **Step 4: Commit**

```bash
cd ../foxreach && git add backend/app/main.py && git commit -m "feat(api): add filtered public OpenAPI for cold.md agent"
```

---

### Task 0.2: Add `categorize_stats` endpoint

**Files:** `../foxreach/backend/app/routers/inbox.py`

- [ ] **Step 1: Add endpoint**

Append before the existing `@router.get("/stats")` block:

```python
@router.get("/threads/categorize-stats")
async def categorize_stats(
    campaignId: Optional[str] = None,
    sequenceId: Optional[str] = None,
    variantId: Optional[str] = None,
    groupBy: Optional[str] = Query(None, regex="^(variant|sequence|day)$"),
    fromDate: Optional[str] = None,
    toDate: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    workspace: Workspace = Depends(get_current_workspace),
):
    """
    Categorize-stats per variant/sequence/day for the autoresearch loop.

    Joins Reply.category against EmailLog.variantId/sequenceId via
    originalEmailLogId — every Reply with category in
    {interested, not_interested, out_of_office, bounce, uncategorized}
    contributes to the count for its source variant.

    Returns:
      { groups: [{ key: variantId|sequenceId|YYYY-MM-DD,
                   sent: int, replied: int,
                   interested: int, not_interested: int,
                   out_of_office: int, bounce: int }] }
    """
    account_ids = await _get_workspace_account_ids(session, workspace.id)
    if not account_ids:
        return {"groups": []}

    # Build conditions for Reply join
    reply_conds = [Reply.accountId.in_(account_ids)]
    if campaignId:
        reply_conds.append(Reply.campaignId == campaignId)
    if fromDate:
        try:
            reply_conds.append(Reply.receivedAt >= datetime.fromisoformat(fromDate.replace('Z', '+00:00')))
        except ValueError:
            pass
    if toDate:
        try:
            reply_conds.append(Reply.receivedAt <= datetime.fromisoformat(toDate.replace('Z', '+00:00')))
        except ValueError:
            pass

    # Build conditions for EmailLog (sent counts)
    log_conds = [EmailLog.accountId.in_(account_ids), EmailLog.status == 'sent']
    if campaignId:
        log_conds.append(EmailLog.campaignId == campaignId)
    if sequenceId:
        log_conds.append(EmailLog.sequenceId == sequenceId)
    if variantId:
        log_conds.append(EmailLog.variantId == variantId)
    if fromDate:
        try:
            log_conds.append(EmailLog.createdAt >= datetime.fromisoformat(fromDate.replace('Z', '+00:00')))
        except ValueError:
            pass
    if toDate:
        try:
            log_conds.append(EmailLog.createdAt <= datetime.fromisoformat(toDate.replace('Z', '+00:00')))
        except ValueError:
            pass

    # Determine grouping key
    if groupBy == 'variant':
        sent_group_col = EmailLog.variantId.label('key')
        reply_group_col = EmailLog.variantId.label('key')
    elif groupBy == 'sequence':
        sent_group_col = EmailLog.sequenceId.label('key')
        reply_group_col = EmailLog.sequenceId.label('key')
    elif groupBy == 'day':
        sent_group_col = func.date(EmailLog.createdAt).label('key')
        reply_group_col = func.date(EmailLog.createdAt).label('key')
    else:
        sent_group_col = literal_column("'all'").label('key')
        reply_group_col = literal_column("'all'").label('key')

    # Sent counts grouped
    sent_q = (
        select(sent_group_col, func.count(EmailLog.id).label('sent'))
        .where(*log_conds)
        .group_by(sent_group_col)
    )
    sent_rows = (await session.execute(sent_q)).all()
    sent_map = {row.key: row.sent for row in sent_rows}

    # Reply counts grouped via join EmailLog → Reply.originalEmailLogId
    reply_q = (
        select(
            reply_group_col,
            Reply.category.label('category'),
            func.count(Reply.id).label('count'),
        )
        .select_from(Reply)
        .join(EmailLog, EmailLog.id == Reply.originalEmailLogId)
        .where(*reply_conds, *log_conds)
        .group_by(reply_group_col, Reply.category)
    )
    reply_rows = (await session.execute(reply_q)).all()

    # Aggregate per key
    by_key: dict = {}
    for row in reply_rows:
        bucket = by_key.setdefault(row.key, {
            'sent': sent_map.get(row.key, 0),
            'replied': 0,
            'interested': 0,
            'not_interested': 0,
            'out_of_office': 0,
            'bounce': 0,
            'uncategorized': 0,
        })
        bucket['replied'] += row.count
        if row.category in bucket:
            bucket[row.category] += row.count

    # Include keys with sends but no replies
    for key, sent in sent_map.items():
        if key not in by_key:
            by_key[key] = {
                'sent': sent, 'replied': 0,
                'interested': 0, 'not_interested': 0,
                'out_of_office': 0, 'bounce': 0, 'uncategorized': 0,
            }

    groups = [{'key': k, **v} for k, v in by_key.items()]
    return {'groups': groups}
```

- [ ] **Step 2: Verify imports at top of file**

Need: `from sqlalchemy import literal_column`. Check if already imported; add if missing.

- [ ] **Step 3: Syntax check**

Run: `cd ../foxreach && python -m py_compile backend/app/routers/inbox.py`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd ../foxreach && git add backend/app/routers/inbox.py && git commit -m "feat(inbox): add categorize-stats endpoint for autoresearch loop"
```

---

### Task 0.3: (Optional) Add `score-fit` endpoint

**Files:** `../foxreach/backend/app/routers/leads.py`

Skipping for v0. Skills do ICP-fit scoring client-side via Claude. Can revisit if it becomes a hot path.

- [ ] **Step 1: Mark deferred**

No changes. Note in `.cold/notes.md` (created in phase 2): "score-fit endpoint deferred to v0.2 — client-side scoring used in v0".

---

# Phase 1 — `foxreach` CLI

### Task 1.1: Bootstrap CLI package

**Files:**
- Create: `cli/package.json`
- Create: `cli/bin/foxreach.js`
- Create: `cli/src/client.js`
- Create: `cli/README.md`

- [ ] **Step 1: Create `cli/package.json`**

```json
{
  "name": "@cold-md/foxreach-cli",
  "version": "0.1.0",
  "description": "Thin CLI wrapper around the FoxReach API. Used by the cold.md autoresearch plugin; works standalone too.",
  "bin": {
    "foxreach": "./bin/foxreach.js"
  },
  "main": "./src/client.js",
  "type": "module",
  "engines": { "node": ">=18" },
  "dependencies": {
    "axios": "^1.6.0",
    "commander": "^11.0.0"
  },
  "license": "MIT",
  "repository": "concaption/cold-md"
}
```

- [ ] **Step 2: Create `cli/src/client.js`**

```javascript
import axios from 'axios'

const BASE_URL = process.env.FOXREACH_BASE_URL || 'https://api.foxreach.io'
const API_KEY = process.env.FOXREACH_API_KEY

if (!API_KEY) {
  console.error('FOXREACH_API_KEY is not set. Get one at https://foxreach.io/app/settings?tab=api')
  process.exit(1)
}

export const client = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 60_000,
})

// Print as JSON for downstream consumption (skills pipe to jq)
export function output(data) {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n')
}

export function fail(err) {
  if (err.response) {
    process.stderr.write(`HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}\n`)
  } else {
    process.stderr.write(`${err.message}\n`)
  }
  process.exit(1)
}
```

- [ ] **Step 3: Create `cli/bin/foxreach.js`**

```javascript
#!/usr/bin/env node
import { Command } from 'commander'
import { registerCampaigns } from '../src/commands/campaigns.js'
import { registerSequences } from '../src/commands/sequences.js'
import { registerVariants } from '../src/commands/variants.js'
import { registerLeads } from '../src/commands/leads.js'
import { registerInbox } from '../src/commands/inbox.js'
import { registerAccounts } from '../src/commands/accounts.js'
import { registerTemplates } from '../src/commands/templates.js'
import { registerAnalytics } from '../src/commands/analytics.js'
import { registerOpenapi } from '../src/commands/openapi.js'
import { registerDocs } from '../src/commands/docs.js'

const program = new Command()
program
  .name('foxreach')
  .description('Thin CLI wrapper around the FoxReach API')
  .version('0.1.0')

registerOpenapi(program)
registerDocs(program)
registerAccounts(program)
registerCampaigns(program)
registerSequences(program)
registerVariants(program)
registerLeads(program)
registerInbox(program)
registerTemplates(program)
registerAnalytics(program)

program.parse()
```

Make executable: `chmod +x cli/bin/foxreach.js`.

- [ ] **Step 4: Commit**

```bash
git add cli/package.json cli/bin/foxreach.js cli/src/client.js && git commit -m "feat(cli): bootstrap foxreach CLI package"
```

---

### Task 1.2: Implement command modules

**Files:**
- Create one file per resource in `cli/src/commands/`

For each resource, follow this template (showing campaigns; replicate for sequences, variants, leads, inbox, accounts, templates, analytics):

- [ ] **Step 1: Create `cli/src/commands/campaigns.js`**

```javascript
import { client, output, fail } from '../client.js'
import fs from 'fs'

export function registerCampaigns(program) {
  const cmd = program.command('campaigns').description('FoxReach campaigns')

  cmd.command('list')
    .option('--status <s>', 'filter by status')
    .action(async (opts) => {
      try {
        const { data } = await client.get('/campaigns', { params: opts })
        output(data)
      } catch (e) { fail(e) }
    })

  cmd.command('get <id>')
    .action(async (id) => {
      try {
        const { data } = await client.get(`/campaigns/${id}`)
        output(data)
      } catch (e) { fail(e) }
    })

  cmd.command('create')
    .requiredOption('--json <file>', 'JSON body file (use @- for stdin)')
    .action(async ({ json }) => {
      try {
        const body = json === '@-'
          ? JSON.parse(fs.readFileSync(0, 'utf-8'))
          : JSON.parse(fs.readFileSync(json.replace(/^@/, ''), 'utf-8'))
        const { data } = await client.post('/campaigns', body)
        output(data)
      } catch (e) { fail(e) }
    })

  cmd.command('start <id>')
    .action(async (id) => {
      try {
        const { data } = await client.post(`/campaigns/${id}/start`)
        output(data)
      } catch (e) { fail(e) }
    })

  cmd.command('pause <id>')
    .action(async (id) => {
      try {
        const { data } = await client.post(`/campaigns/${id}/pause`)
        output(data)
      } catch (e) { fail(e) }
    })

  cmd.command('delete <id>')
    .action(async (id) => {
      try {
        await client.delete(`/campaigns/${id}`)
        output({ deleted: true, id })
      } catch (e) { fail(e) }
    })
}
```

- [ ] **Step 2: Create the other command modules**

Apply the same pattern. Each needs ~6-10 subcommands matching the FoxReach endpoints. Reference: `../foxreach/frontend/lib/api.ts` for the full surface. Specifically:

- `sequences.js` — list, add, update, delete (per campaign)
- `variants.js` — list, add, update, delete, stats (per campaign+sequence)
- `leads.js` — list, get, create, update, delete, import (CSV upload), bulk-tag, bulk-untag, list-ids
- `inbox.js` — threads (list), get, mark-read, categorize-stats (new endpoint), bulk-update, send-reply
- `accounts.js` — list, get, create, update, delete, test
- `templates.js` — list, get, create, update, delete
- `analytics.js` — campaign-stats, account-stats, workspace-stats
- `openapi.js` — fetches `/openapi.json` and prints (used by skills as fallback)
- `docs.js` — opens `https://docs.foxreach.io/api-reference/<topic>` in default browser; or `--print` to fetch HTML and print

> Important: every command output is JSON to stdout, errors to stderr. This makes piping to `jq` and parsing in skills trivial.

- [ ] **Step 3: Test against staging or local FoxReach**

```bash
cd cli && npm install
FOXREACH_API_KEY=otr_test_... node bin/foxreach.js campaigns list
```

Expected: JSON list of campaigns or empty array.

- [ ] **Step 4: Commit**

```bash
git add cli/src/commands/ && git commit -m "feat(cli): implement all command modules"
```

---

### Task 1.3: Distribution (npm publish or local install)

**Files:** `cli/install.sh` (optional)

- [ ] **Step 1: Create install script**

Create `cli/install.sh`:

```bash
#!/usr/bin/env bash
set -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"
npm install --production
npm link  # symlinks `foxreach` to PATH
echo "foxreach CLI installed. Try: foxreach campaigns list"
```

- [ ] **Step 2: Smoke test from outside the cli dir**

```bash
chmod +x cli/install.sh
./cli/install.sh
foxreach --help
```

Expected: help output with all commands.

- [ ] **Step 3: Document in CLI README**

Quick `cli/README.md`:

```markdown
# foxreach CLI

Thin wrapper around the FoxReach API. Used by the cold.md autoresearch plugin; works standalone.

## Install
\`\`\`
bash <(curl -fsSL https://cold.md/cli/install)
\`\`\`

Or local: `./cli/install.sh`.

## Auth
Set `FOXREACH_API_KEY=otr_...` in your env.

## Commands
\`\`\`
foxreach openapi
foxreach docs <topic>
foxreach campaigns list
foxreach sequences add --campaign <id> --json @file
...
\`\`\`

Run `foxreach <resource> --help` for full subcommand list.
```

- [ ] **Step 4: Commit**

```bash
git add cli/install.sh cli/README.md && git commit -m "feat(cli): install script + README"
```

---

# Phase 2 — `/cold init` + `.cold/` scaffold

### Task 2.1: Create `/cold init` command

**Files:**
- Create: `plugin/cold-md/commands/init.md`
- Modify: `plugin/cold-md/cold.md` (register command)

- [ ] **Step 1: Write init command**

Create `plugin/cold-md/commands/init.md`:

```markdown
---
name: init
description: Bootstrap a cold.md project — scaffolds .cold/ folder, writes config from a 6-question wizard, fetches and caches the FoxReach OpenAPI spec, and verifies the foxreach CLI is installed. Use as the very first step before any other /cold command.
---

# /cold init

Bootstraps a cold.md autoresearch project in the current directory.

## Steps

1. **Check prerequisites:**
   - `foxreach` CLI on PATH? (run `which foxreach`)
   - `FOXREACH_API_KEY` env var set?
   - If either is missing: print install instructions and stop.

2. **Confirm directory:** "Initialize cold.md in `<cwd>`? (Y/n)"

3. **Run the 6-question wizard:**

   1. "Per-lead personalization? (search the web for each prospect's recent news, posts) [y/N]"
   2. "Policy-level web research? (refine ICP/offer with competitor + market scans) [Y/n]"
   3. "Min sample size per variant before declaring a winner? [default: 100]"
   4. "Min days before reading experiment results? [default: 7]"
   5. "Bounce-rate guard threshold? [default: 0.05 = 5%]"
   6. "Auto-commit cold.md diffs after 3 approved in a row? [Y/n]"

4. **Write `.cold/config.json`** with answers (full schema in spec at `spec/2026-04-28-autoresearch-design.md`).

5. **Write `.cold/trust.json`:**
   ```json
   { "approvedDiffStreak": 0, "autoCommit": false }
   ```

6. **Fetch + cache OpenAPI:**
   - Run `foxreach openapi > .cold/docs-cache/foxreach-openapi.json`
   - On failure, fallback to `curl -fsSL https://api.foxreach.io/openapi.json -o .cold/docs-cache/foxreach-openapi.json`

7. **Scaffold empty stubs** if missing:
   - `cold.md` — copy from `spec/cold-md-v0.md` template section
   - `icp.md` — empty with placeholder header
   - `offer.md` — empty with placeholder header

8. **Initialize empty state files:**
   - `.cold/beliefs.md` — `# Beliefs\n\n_No experiments concluded yet._`
   - `.cold/decisions.md` — `# Decisions Changelog\n\n_No diffs applied yet._`
   - `.cold/experiments/.gitkeep`
   - `.cold/research/.gitkeep`

9. **Verify by running:**
   - `foxreach campaigns list` — must succeed (proves API key works).

10. **Print next steps:**
    > Initialized. Run `/cold icp <your-website-url>` next.
```

- [ ] **Step 2: Register in plugin manifest**

Open `plugin/cold-md/cold.md`. Find the commands list. Add `init`.

- [ ] **Step 3: Mirror to `plugin/cold-md/skills/` if needed**

The plugin install path is `plugin/cold-md/`. If skills are also expected to live there, copy `skills/cold-icp/SKILL.md` style files into `plugin/cold-md/skills/<name>/SKILL.md`.

- [ ] **Step 4: Commit**

```bash
git add plugin/cold-md/commands/init.md plugin/cold-md/cold.md && git commit -m "feat(cold): add /cold init command and config schema"
```

---

# Phase 3 — `cold-icp` + `cold-offer` (web research)

### Task 3.1: Extend `cold-icp` with web research

**Files:** `skills/cold-icp/SKILL.md`

- [ ] **Step 1: Read current SKILL.md**

Note current structure (URL mode + Q&A mode).

- [ ] **Step 2: Add a "Web research validation" section**

Append after the existing Q&A section:

```markdown
## Step 3 — Web research validation (always-on for v0.2+)

Read `.cold/config.json`. If `research.policyLevelEnabled` is true (default), run up to `maxQueriesPerInvocation` (default 5) WebSearch queries to validate the drafted ICP:

1. Search for **competitor companies** in the target vertical:
   `"<vertical> SaaS companies <region>"` — does the niche have a real cluster of competitors? If only 1-2 results, niche may be too narrow.

2. Search for **target-title job postings**:
   `"<title>" jobs <vertical>` — confirms the role exists at scale in the niche.

3. Search for **forum / reddit pain signals**:
   `"<vertical> <pain>" reddit OR forum site:reddit.com` — surfaces real complaints to ground the offer in.

4. Search for **case study patterns**:
   `case study <vertical> <pain> <year>` — finds proof points the user can borrow.

5. Search for **disqualifier validation**:
   `"<disqualifier-trait>" <vertical>` — confirms the disqualifier is meaningful.

Save findings to `.cold/research/icp-validation-<YYYY-MM-DD>.md` with sections per query.

Surface a summary: "I validated your ICP. Here's what I found: ...". Ask if the user wants to revise icp.md based on findings.
```

- [ ] **Step 3: Commit**

```bash
git add skills/cold-icp/SKILL.md && git commit -m "feat(cold-icp): add web research validation step"
```

---

### Task 3.2: Create `cold-offer`

**Files:** `skills/cold-offer/SKILL.md`

- [ ] **Step 1: Create the skill file**

```markdown
---
name: cold-offer
description: Refine your value proposition (the "## Value" section of cold.md) using competitor pricing, market trends, and case studies. Searches the web for what comparable products charge, what pain points the target market is talking about, and what proof patterns work. Writes findings to .cold/research/ and proposes a tightened one-sentence value statement to commit to offer.md and cold.md. Use when starting a new project after /cold icp, or when the user says "tighten my offer", "refine my value prop", "what should I be charging", "validate my offer".
---

# cold-offer

Step 1.5 of the cold.md autoresearch suite. After ICP, refines the offer.

## When to use

- User has run `/cold icp` and wants to nail the offer before sending
- User says "refine my value prop", "tighten my offer", "what's my pitch"
- Existing `offer.md` is missing or stale (last edit > 30 days)

## Inputs

- `./icp.md` (must exist — run `/cold icp` first if missing)
- `./cold.md` (optional — uses `## Value` if present)
- `.cold/config.json` (`research.maxQueriesPerInvocation`)

## Process

1. **Read current state:**
   - Pull the audience + niche from `icp.md`
   - Pull the current `## Value` line from `cold.md` if it exists

2. **Web research (capped at maxQueriesPerInvocation, default 5):**

   1. **Competitor pricing:**
      `"<niche>" pricing OR cost OR plans` — gather what comparable products charge.

   2. **Recent funding / acquisitions:**
      `"<niche>" funding 2026` — surface market dynamics.

   3. **Pain language:**
      `"<niche> <main pain>" reddit OR g2 OR capterra reviews` — capture how users describe the problem in their own words.

   4. **Case study format:**
      `<niche> case study <pain>` — find proof formats that work.

   5. **Differentiation gaps:**
      `"why <competitor>" OR "alternative to <competitor>"` — find unmet needs.

3. **Save findings** to `.cold/research/offer-research-<YYYY-MM-DD>.md` with sections per query and a quick "Insights" summary at the top.

4. **Synthesize:**
   - Draft 3 candidate one-sentence value statements (different angles: pain, gain, mechanism)
   - Show the user the candidates + a "why this works" line each
   - User picks one or asks for variations

5. **Write `offer.md`** with:
   - The chosen one-sentence value
   - 3-5 supporting proof points (drawn from research)
   - The 2-3 most concise "pain language" quotes from research

6. **Update `cold.md`:**
   - Replace `## Value` with the chosen one-sentence value
   - Append/merge proof points to `## Proof`
   - Diff this change as `.cold/proposed-diff.patch` for human approval (do NOT auto-commit unless `trust.autoCommit` is true)

## Output

- `offer.md` (new or updated)
- `.cold/research/offer-research-<YYYY-MM-DD>.md` (research log)
- `.cold/proposed-diff.patch` (cold.md changes)

## Constraints

- Never invent pricing or facts; only cite from research with the source URL
- Reject value statements that exceed one sentence
- Reject value statements that include banned phrases from `cold.md`'s `## Banned`

## Next step

Once `offer.md` is committed and `cold.md` reflects the new value:
- `/cold leads` to import prospects
- or `/cold experiment` to start the autoresearch loop
```

- [ ] **Step 2: Commit**

```bash
git add skills/cold-offer/SKILL.md && git commit -m "feat(cold-offer): NEW skill — refine value prop via competitor + market research"
```

---

# Phase 4 — `cold-leads` + `cold-draft` + `cold-send`

### Task 4.1: Wire `cold-leads` to FoxReach

**Files:** `skills/cold-leads/SKILL.md`

- [ ] **Step 1: Replace stub with full skill**

Rewrite the file. Key sections:

```markdown
---
name: cold-leads
description: Source, enrich, and score leads against icp.md. Imports a CSV via FoxReach (or builds one from a list of companies/people), then runs ICP-fit scoring to drop misaligned prospects. Optionally per-lead personalization via web search if enabled in .cold/config.json. Use when the user says "find leads", "import leads", "score these prospects", "filter to my ICP". Replaces the v0 stub.
---

# cold-leads

## Inputs

- `./icp.md` (required)
- `.cold/config.json` (`personalization.perLead`)
- One of:
  - `--csv <path>` — local CSV file
  - `--from-companies <file>` — list of company names; uses Hunter/Clearbit-style enrichment via FoxReach (deferred to v0.2)
- `--campaign-name "..."` — name for the FoxReach campaign

## Process

1. **Validate inputs:** ICP must exist; CSV must have at least `email` column.

2. **Score each row against ICP:**
   - Read `icp.md`
   - For each row, build a Claude prompt: "Given this ICP and this lead, output {fit: 0-1, reason: '...'}"
   - Drop rows with fit < 0.5 (configurable)
   - Write surviving rows to `.cold/scored-leads.csv` with added `fit_score` column

3. **(Optional) Per-lead personalization** — only if `personalization.perLead = true`:
   For each surviving lead, run 1-2 WebSearch queries:
   - `"<firstName> <lastName>" "<company>" recent`
   - `"<company>" hire OR launch OR funding 2026`
   Save findings to `.cold/research/lead-personalization/<leadId>.md`. Cap budget per `config.personalization.perLeadBudget`.

4. **Import to FoxReach:**
   - `foxreach campaigns create --json @campaign.json` (creates the campaign)
   - `foxreach leads import --csv @.cold/scored-leads.csv --campaign <id>`
   - Capture campaign id and leadIds in `.cold/last-import.json`

5. **Print summary:**
   ```
   Imported: 87 leads (scored 142, dropped 55 below threshold).
   Campaign: cmd_abc123 ("Q2 SaaS founders").
   Per-lead research: enabled, 87 queries used.
   Next: /cold experiment
   ```

## CLI fallback

If `foxreach` CLI fails, fall back to:
- `cat .cold/docs-cache/foxreach-openapi.json | jq '.paths."/leads/import"'` to find the right endpoint
- `curl -X POST $FOXREACH_BASE_URL/api/v1/leads/import -H "Authorization: Bearer $FOXREACH_API_KEY" -F file=@scored-leads.csv -F campaignId=...`
- If still stuck: `WebFetch https://docs.foxreach.io/api-reference/leads/list-leads` (or the matching action page) and read the doc.
```

- [ ] **Step 2: Commit**

```bash
git add skills/cold-leads/SKILL.md && git commit -m "feat(cold-leads): wire to FoxReach CLI with ICP scoring + optional per-lead research"
```

---

### Task 4.2: Extend `cold-draft` with experiment-aware variant generation

**Files:** `skills/cold-draft/SKILL.md`

- [ ] **Step 1: Add experiment-mode section**

After existing draft logic, append:

```markdown
## Experiment mode (autoresearch)

If `.cold/experiments/<active>/protocol.md` exists, generate VARIANT PAIRS instead of single drafts.

### Read protocol

The protocol file declares:
- `variable`: which dimension is being tested (subject | opener | cta | cadence | tone)
- `arms`: array of variant specs (e.g. ["statement", "question"])
- `cohort_size`: how many leads per arm

### For Tier 1 (subject) — example

For each lead in the campaign, generate `len(arms)` candidate emails with the SAME body but DIFFERENT subjects matching each arm's pattern. Tag the output with the arm name.

Output structure:
```
.cold/drafts/
   <campaign_id>/
      arm_a_statement/
         <leadId>.md         # subject + body
      arm_b_question/
         <leadId>.md
```

Each draft must:
- Pass banned-phrase lint from `cold.md ## Banned`
- Use the lead's `firstName`, `company`, and (if available) personalization from `.cold/research/lead-personalization/`
- Match the arm's pattern definition

### For Tier 2 (opener)

Same structure, but the FIRST 2 LINES of the body differ between arms; subject is held constant from the current cold.md template.

### Variant naming

Use `arm_a_<descriptor>` / `arm_b_<descriptor>` so FoxReach variant labels are meaningful in dashboards.
```

- [ ] **Step 2: Commit**

```bash
git add skills/cold-draft/SKILL.md && git commit -m "feat(cold-draft): add experiment-aware variant pair generation"
```

---

### Task 4.3: Wire `cold-send` to FoxReach

**Files:** `skills/cold-send/SKILL.md`

- [ ] **Step 1: Replace stub with full skill**

```markdown
---
name: cold-send
description: Push the active campaign to FoxReach — creates sequences, registers variants from cold-draft output, runs pre-flight checks (banned-phrase lint, audience check, plan-limit math, bounce-rate guard), and starts the campaign. Use after /cold leads + /cold draft. Replaces v0 stub.
---

# cold-send

## Inputs

- `.cold/last-import.json` (campaign id from cold-leads)
- `.cold/drafts/<campaignId>/arm_*/` (variant drafts from cold-draft in experiment mode, OR a single set of drafts if no experiment)
- `cold.md` (`## Sequence` for cadence)
- `.cold/experiments/<active>/protocol.md` (if running an experiment)

## Pre-flight checks (ALL must pass — stop on first failure)

1. **Banned-phrase lint** — every draft scanned against `cold.md ## Banned`
2. **Audience check** — every lead in the campaign passes the qualification checklist in `icp.md`
3. **Plan limits** — `foxreach analytics workspace-stats` confirms remaining `monthlyEmails` >= total sends planned
4. **Bounce-rate guard** — `foxreach analytics account-stats` for each sender confirms 7-day bounce <5%
5. **Domain warmup** — sender accounts must have `warmupScore >= 70`
6. **Duplicate check** — leads not already contacted in last 90 days (foxreach leads list --filter ...)

## Process (after pre-flight)

1. **Create FoxReach sequences** matching `cold.md ## Sequence`:
   ```
   foxreach sequences add --campaign <id> --step 1 --json @opener.json
   foxreach sequences add --campaign <id> --step 2 --json @bump.json
   foxreach sequences add --campaign <id> --step 3 --json @breakup.json
   ```

2. **Register variants per sequence step:**
   For each `arm_<x>_<descriptor>` directory:
   ```
   foxreach variants add --campaign <id> --sequence <stepId> --json @arm.json
   ```
   The arm.json includes `{label, subject, body, weight}`.

3. **Verify** with `foxreach sequences list --campaign <id>` — confirm steps + variants registered.

4. **Start campaign:**
   ```
   foxreach campaigns start <id>
   ```

5. **Save state to `.cold/last-send.json`:**
   ```json
   {
     "campaignId": "...",
     "experimentId": "...",
     "variantIds": { "arm_a_statement": "var_...", "arm_b_question": "var_..." },
     "sentAt": "2026-04-29T..."
   }
   ```

## CLI fallback (raw curl)

If a CLI command fails:
1. Read `.cold/docs-cache/foxreach-openapi.json` for the correct path/method
2. Construct curl manually with `Authorization: Bearer $FOXREACH_API_KEY`
3. If still stuck: `WebFetch https://docs.foxreach.io/api-reference/<resource>/<action>` (e.g. `/api-reference/campaigns/start-campaign`)

## Output

- Campaign live in FoxReach
- `.cold/last-send.json` for the autoresearch loop to read
```

- [ ] **Step 2: Commit**

```bash
git add skills/cold-send/SKILL.md && git commit -m "feat(cold-send): wire to FoxReach CLI with full pre-flight checks"
```

---

# Phase 5 — `cold-experiment` + `cold-learn` (autoresearch core)

### Task 5.1: Create `cold-experiment`

**Files:** `skills/cold-experiment/SKILL.md`

- [ ] **Step 1: Write the skill**

```markdown
---
name: cold-experiment
description: Design the next A/B experiment for the autoresearch loop. Reads the current tier from .cold/config.json, picks the variable to test, drafts arm specs (e.g. statement vs. question subject lines), declares sample size + success criteria, and writes a protocol to .cold/experiments/. Use after /cold offer and before /cold draft. The experiment protocol is what cold-draft reads to generate variant pairs.
---

# cold-experiment

## Inputs

- `.cold/config.json` (`experiments.currentTier`, sample sizes, etc.)
- `.cold/beliefs.md` (current best-known patterns; informs arm choices)
- `cold.md` (current value, voice — informs arm bounds)

## Process

1. **Determine current tier** from `config.json`. Defaults to 1 (subject lines).

2. **Verify tier prerequisites:** previous tier must have a stable winner in `beliefs.md`. If not, refuse to advance and ask user to wait.

3. **Pick the variable** for this tier:
   - Tier 1: subject pattern (statement | question | number-led)
   - Tier 2: opener template (compliment | observation | direct ask)
   - Tier 3: CTA framing (calendar link | reply-to-confirm | low-friction yes/no)
   - Tier 4: cadence (3-day | 5-day | 7-day between bumps)
   - Tier 5: voice tone (casual | formal) — manual unlock only

4. **Draft 2 arm specs** (A and B), e.g. for Tier 1:
   ```yaml
   variable: subject
   arms:
     - id: arm_a_statement
       label: "Statement"
       pattern: "Declarative, < 8 words, ends without punctuation"
       example: "5x your reply rate without burning your domain"
     - id: arm_b_question
       label: "Question"
       pattern: "Question, < 8 words, ends with ?"
       example: "Reply rate stuck under 2 percent?"
   sample_size_per_arm: 100
   min_days_before_read: 7
   success_criteria:
     test: "two-proportion z-test on interested-reply rate"
     alpha: 0.05
     min_delta_pp: 2
     guard:
       bounce_rate_max: 0.05
       not_interested_rate_max: 0.30
   ```

5. **Compute experiment id:** `<YYYY-Wxx>-<variable>-<arm-a-short>-vs-<arm-b-short>` (e.g. `2026-W18-subject-statement-vs-question`).

6. **Write protocol:** `.cold/experiments/<id>/protocol.md` containing the YAML above + a 1-paragraph hypothesis statement.

7. **Mark active:** write `<id>` to `.cold/experiments/.active`.

8. **Print:**
   ```
   Experiment designed: 2026-W18-subject-statement-vs-question
   Variable: subject pattern
   Arms: Statement vs. Question
   Sample size: 100 leads per arm
   Decision in: 7 days minimum
   Next: /cold draft (will generate variant pairs)
   ```

## Output

- `.cold/experiments/<id>/protocol.md`
- `.cold/experiments/.active` (one-line file containing the active experiment id)
```

- [ ] **Step 2: Commit**

```bash
git add skills/cold-experiment/SKILL.md && git commit -m "feat(cold-experiment): NEW skill — design A/B protocol for autoresearch loop"
```

---

### Task 5.2: Create `cold-learn`

**Files:** `skills/cold-learn/SKILL.md`

- [ ] **Step 1: Write the skill**

```markdown
---
name: cold-learn
description: Read the active experiment's results from FoxReach, run the statistical test, and propose a cold.md diff (or auto-commit if trust earned). Computes interested-reply rate per variant via foxreach inbox categorize-stats, applies a two-proportion z-test, checks guards (bounce rate, not-interested rate), and either writes .cold/proposed-diff.patch or applies it directly. Use 7+ days after /cold send when an experiment is active. Updates beliefs.md and decisions.md.
---

# cold-learn

## Inputs

- `.cold/experiments/.active` (active experiment id)
- `.cold/experiments/<id>/protocol.md` (success criteria, arm specs)
- `.cold/last-send.json` (campaign + variant ids)
- `.cold/trust.json` (auto-commit eligibility)
- `cold.md` (file to potentially edit)

## Process

### 1. Verify experiment is ready to read

- Active experiment exists
- `now() - last-send.sentAt >= protocol.min_days_before_read`
- If not ready: print "Experiment needs N more days" and stop

### 2. Pull stats

```
foxreach inbox categorize-stats --campaign <id> --group-by variant > .cold/experiments/<id>/results.json
```

### 3. Verify sample size

For each arm, `sent >= protocol.sample_size_per_arm`. If not:
- Print "Need N more sends in arm_x to read"
- Optionally extend sample (up to 3x cap) and stop

### 4. Compute metric

For each arm:
```
interested_rate = interested / sent
bounce_rate = bounce / sent
not_interested_rate = not_interested / sent
```

### 5. Check guards (HARD STOP if breached)

If `bounce_rate > config.guards.bounceRateThreshold` for either arm:
- Pause variant via `foxreach variants update ... --weight 0`
- Append guard breach to `.cold/decisions.md`
- Print alert and stop — do NOT propose any cold.md changes

If `not_interested_rate > config.guards.notInterestedRateThreshold` — warn but continue.

### 6. Run statistical test

Two-proportion z-test, two-sided, alpha=0.05:
```
p_pool = (interested_a + interested_b) / (sent_a + sent_b)
se = sqrt(p_pool * (1 - p_pool) * (1/sent_a + 1/sent_b))
z = (rate_a - rate_b) / se
p_value = 2 * (1 - Phi(|z|))
ci_95 = (rate_a - rate_b) +/- 1.96 * se
```

### 7. Decide outcome

| Condition | Outcome |
|---|---|
| `\|delta\| < 2pp` | Inconclusive |
| `p > 0.05` | Inconclusive |
| `lower_ci <= 0` | Inconclusive |
| All three pass + winner has higher rate | **Winner declared** |

### 8. If inconclusive

- Append result to `.cold/experiments/<id>/decision.md`
- Optionally extend sample (mark experiment as `extending`); halt if already at 3x.

### 9. If winner

- Write `decision.md` with: hypothesis, raw numbers, test stats, winner, proposed cold.md edit
- Construct cold.md diff based on the variable + winning arm
- Update `.cold/beliefs.md` with the new finding (with confidence interval)

### 10. Apply diff — trust ladder

Read `.cold/trust.json`:
- If `autoCommit: true` (streak >= 3 from config): apply diff with `git apply`, append to `.cold/decisions.md`, increment streak counter (already at max), stop
- Else: write diff to `.cold/proposed-diff.patch`, print:
  ```
  Diff proposed at .cold/proposed-diff.patch
  Review: cat .cold/proposed-diff.patch
  Accept:  git apply .cold/proposed-diff.patch && rm .cold/proposed-diff.patch
  Reject:  rm .cold/proposed-diff.patch
  ```

### 11. Streak bookkeeping

On NEXT `/cold learn` or `/cold status` invocation:
- If `.cold/proposed-diff.patch` exists from previous run: still pending, do nothing to streak
- If patch deleted but cold.md hash unchanged from before: rejected → streak = 0
- If patch deleted and cold.md hash changed (i.e. applied): accepted → streak += 1
- When streak reaches `config.trust.autoCommitAfterApprovedStreak` (default 3): set `autoCommit: true` in trust.json

### 12. Mark experiment complete + advance tier

If winner: clear `.cold/experiments/.active`. Bump `config.experiments.currentTier += 1` if `autoAdvanceTier` is true.

## Output

- Updated `.cold/beliefs.md` (if winner)
- Updated `.cold/decisions.md` (always)
- `.cold/proposed-diff.patch` (if winner + not auto-commit)
- `.cold/experiments/<id>/decision.md` (always)
- Optional: applied cold.md diff (if auto-commit)
```

- [ ] **Step 2: Commit**

```bash
git add skills/cold-learn/SKILL.md && git commit -m "feat(cold-learn): NEW skill — autoresearch core, runs z-test + diff trust ladder"
```

---

# Phase 6 — `cold-triage` + `cold-status` + `cold-report`

### Task 6.1: Wire `cold-triage`

**Files:** `skills/cold-triage/SKILL.md`

- [ ] **Step 1: Replace stub with full skill**

Use the FoxReach inbox API:
- List unread threads: `foxreach inbox threads --filter unread`
- Categorize via FoxReach's existing AI: already auto-categorized when reply arrives
- For interested replies: draft a response per cold.md objection-handling
- Update via `foxreach inbox bulk-update`

(See spec for full process; mirror existing v0 stub structure.)

- [ ] **Step 2: Commit**

```bash
git add skills/cold-triage/SKILL.md && git commit -m "feat(cold-triage): wire to FoxReach inbox via CLI"
```

---

### Task 6.2: Create `cold-status`

**Files:** `skills/cold-status/SKILL.md`

- [ ] **Step 1: Write the skill**

Reads everything in `.cold/` and prints a dashboard:
- Current beliefs (from `beliefs.md`)
- Active experiment (id, days remaining, current sample size)
- Pending diff (if any)
- Trust streak
- Last 3 decisions
- Suggested next action

```markdown
---
name: cold-status
description: Print the current state of the autoresearch loop — what we've learned, what we're testing, what's next. Reads .cold/ entirely and gives a one-screen dashboard. Use anytime to orient.
---

# cold-status

(Implementation: read files, format as terminal output.)
```

- [ ] **Step 2: Commit**

```bash
git add skills/cold-status/SKILL.md && git commit -m "feat(cold-status): NEW skill — autoresearch dashboard"
```

---

### Task 6.3: Extend `cold-report`

**Files:** `skills/cold-report/SKILL.md`

- [ ] **Step 1: Add experiment outcomes section**

Append:

```markdown
## Experiment outcomes (autoresearch)

If `.cold/decisions.md` has entries since the last report, include:
- Experiments concluded this period
- cold.md changes applied (with diff summary)
- Current beliefs
- Next experiment in the pipeline
```

- [ ] **Step 2: Commit**

```bash
git add skills/cold-report/SKILL.md && git commit -m "feat(cold-report): enrich with autoresearch experiment outcomes"
```

---

# Phase 7 — End-to-end smoke test

### Task 7.1: Run the loop on a real small campaign

- [ ] **Step 1: Set up test project**

```bash
mkdir -p /tmp/cold-test && cd /tmp/cold-test
export FOXREACH_API_KEY=otr_...
/cold init                    # walks the wizard
/cold icp https://foxreach.io   # builds icp.md from FoxReach's own site (dogfood)
/cold offer                     # refines offer.md
```

Verify `.cold/` populated, `icp.md`, `offer.md` written.

- [ ] **Step 2: Import a small lead set (10 leads)**

Use a test CSV. Verify FoxReach campaign created.

- [ ] **Step 3: Design + ship experiment**

```
/cold experiment    # tier 1, subject lines
/cold draft         # generates variant pairs
/cold send          # ships to FoxReach
```

Verify sequences + variants registered in FoxReach dashboard.

- [ ] **Step 4: Wait OR fast-forward stats**

For real testing, wait 7 days. For smoke testing, manually adjust `min_days_before_read` to 0 in the protocol.

- [ ] **Step 5: Run learn**

```
/cold learn
```

Expected: either inconclusive (likely with n=10) or a proposed diff. Either way, the agent should produce `decision.md`.

- [ ] **Step 6: Run status**

```
/cold status
```

Expected: dashboard prints with beliefs (or "no winner yet"), active experiment, trust streak.

- [ ] **Step 7: Run report**

```
/cold report weekly
```

Expected: digest including experiment outcome.

- [ ] **Step 8: Document the smoke test**

Write `.cold/smoke-test-2026-04-XX.md` documenting what was tested, what worked, what didn't.

- [ ] **Step 9: Final commit + push**

```bash
git add docs/superpowers/plans/2026-04-28-autoresearch-implementation.md
git commit --allow-empty -m "feat(cold): autoresearch v0 — full loop"
git push origin main
```

---

## Self-review notes

### Spec coverage check

| Spec section | Implementing task |
|---|---|
| 10 skills (4 new, 3 extended, 3 wired) | Phases 3-6 |
| `.cold/` file layout | Task 2.1 |
| `.cold/config.json` schema | Task 2.1 |
| Variable tier ladder | Task 5.1 |
| Statistical decision rule (z-test) | Task 5.2 |
| Trust ladder (3 approved → auto-commit) | Task 5.2 |
| `foxreach` CLI | Phase 1 |
| OpenAPI fallback | Tasks 1.2, 4.1, 4.3 |
| WebFetch docs.foxreach.io fallback | Tasks 4.1, 4.3 |
| 3 FoxReach API additions | Phase 0 |
| Acceptance criteria (full loop) | Phase 7 |

No gaps.

### Known risks

- **n=10 won't show statistical significance** — smoke test just validates the wiring; real experiment requires 100+ per arm.
- **OpenAPI CORS** — if Step 0.1 reveals tighter CORS, may need a separate `/openapi-public.json` route as noted.
- **CLI distribution** — `npm link` in install.sh works locally; for v0.2 publish to npm.
- **Per-lead web research cost** — uncapped WebSearch could hit Claude usage limits for large lead sets. Mitigated by `personalization.perLeadBudget` config.
