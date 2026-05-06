---
title: "My Cold Email Writes Itself Now"
slug: cold-email-writes-itself
date: "2026-04-29"
excerpt: "An AI agent that owns my entire outbound — picks who to email, what to test, when to ship, what to learn — and edits its own playbook every week. Here's how it works and how to run it on your own list."
author: "Usama Navid"
authorRole: "Founder, FoxReach + cold.md"
category: "AI"
thumbnail: "./thumbnail.webp"
tags: ["cold-email", "ai-agents", "outbound", "automation", "claude-code", "foxreach"]
status: "published"
---

![A coral pencil hovers in mid-air mid-stroke, underlining "## Sequence" on a cream paper showing cold.md and four section headers, on a warm walnut desk in soft window light.](./thumbnail.webp)

My cold email writes itself now.

Not a draft tool. Not a copilot. The whole thing. It picks who to email, what to say, when to send, what to test next, what to stop doing because it didn't work.

## TL;DR

- Cold email decays. Reply rate drops by week eight even if the audience and offer are the same.
- The fix is a closed loop: an AI agent that runs experiments on your outbound and edits its own playbook based on what wins.
- Your playbook is one markdown file called **cold.md**. Eight short sections. Lives in your repo, version controlled.
- The agent only changes one thing per cycle. Subjects first, then openers, then the call to action. Strict order, never skips.
- Optimizes interested-reply rate, not opens. Open tracking is a spam signal in 2026.
- Trust ladder: the agent proposes a diff, you approve. After three approvals in a row, auto-commit unlocks.
- Free, open source, runs on **FoxReach** for sending. Install in two commands.

## The thing that broke me

Cold email decays. Anyone running outbound at scale knows the pattern. Week one reply rate sits at 4 to 6 percent. By week eight it's under 1 percent. Same audience, same offer, dead campaign.

The textbook fix is "iterate." In practice, real iteration is a part-time job:

- Pick one variable to test
- Run a clean A/B
- Wait long enough for the data to settle
- Run an actual stats test
- Update the playbook
- Repeat every two weeks, forever

Almost nobody does it. I didn't either. So I built something that does.

## How it works

I have one file in my repo called **cold.md**. Plain text. Eight sections:

- Identity — who's sending
- Audience — who I'm reaching
- Value — the offer in one sentence
- Voice — how it sounds
- Proof — facts I'm allowed to cite
- Sequence — opener, bump, breakup, with timing
- Objections — how I handle pushback
- Banned — phrases that never appear

That's the entire playbook. The agent reads this file before every action.

Every week the agent picks one variable to test. Subject pattern first. Openers next. Then the call to action. Then cadence. Voice last, and only with manual permission.

It writes two versions of the email — same body, different subject — and ships them through the sender. After seven days it pulls per-variant interested-reply rate from FoxReach, runs a quick math check (a two-proportion z-test, but you don't need to know that), and decides:

- **Real winner.** Proposes a one-line edit to cold.md.
- **Inconclusive.** Extends the experiment or moves on.
- **Bounce rate too high on either arm.** Pauses immediately.

If a winner is declared, the agent doesn't just edit the file. It writes a small `proposed-diff.patch`. I read it, accept or reject. After three accepts in a row, auto-commit unlocks. The file edits itself from then on, but every change is a git commit with a measured experiment behind it.

## Why this beats every cold email tool I've used

**One file replaces a SaaS stack.** Most outbound runs 6 to 9 tools that mostly do the same thing. The agent uses one sender (FoxReach) and one file. Total stack: 2 things.

**The math runs every cycle.** No vibe checks. Either the difference between two variants is statistically real or it isn't. The agent doesn't pick a winner because I want one.

**The metric is right.** Interested replies, not opens. Open tracking is now a spam signal at Gmail and Outlook. Tools that still optimize for opens are flying on a broken instrument.

**The artifact is yours.** cold.md is plain text in your repo. If you switch senders, the file moves with you. There's no vendor moat.

## What it looks like running

Day 14 of my own colony. The status command prints something like this:

> **Active experiment:** Tier 1 / subject pattern — statement vs question
> **Sample:** 100/100 sent, 7 days elapsed, ready to read
> **Pending:** none
> **Beliefs locked:** none yet (first experiment in flight)
> **Suggested next:** /cold learn

When I run learn, it pulls the data, runs the test, and tells me what to do next. If a winner exists, the proposed diff is one line in my Sequence section. I read it, run `git apply`, the file updates. Streak goes to 1.

After three of these in a row, the agent stops asking.

## How to install and run it

Two commands.

```bash
curl -fsSL https://cold.md/install | bash
pip install foxreach-cli
```

Then in your project directory:

```bash
export FOXREACH_API_KEY=otr_...   # get one free at foxreach.io
mkdir my-outreach && cd my-outreach
claude   # opens Claude Code
```

In Claude Code:

```
/cold init                          # 6-question wizard, scaffolds .cold/
/cold icp https://your-site.com     # who to reach (with web research)
/cold offer                         # refine the value prop
/cold leads --csv ./prospects.csv   # import + ICP-score
/cold experiment                    # design Tier 1 A/B
/cold draft                         # generate variant pairs
/cold send                          # ship via FoxReach
```

Then wait seven days. The agent triages replies daily on a cron.

When the experiment is ready:

```
/cold learn          # pulls stats, runs the test, proposes diff
/cold status         # one-screen dashboard
/cold report weekly  # human-readable digest
```

Free FoxReach plan covers up to 1,000 emails per month. Plenty for a real test.

## What's still wrong with it

The agent makes mistakes. The trust ladder exists for a reason — read every diff for the first three weeks. The math is conservative; you need 100 emails per arm minimum. The variable list is fixed on purpose, so the agent can't go feral. Voice tone changes need manual unlock.

This isn't a finished thing. But the shape is settled. Outbound that gets a little better every week instead of a little worse, with a paper trail you can defend.

## The bigger point

Most "AI agents" you've seen this year are chat windows. You type, they respond. You're the bottleneck.

The cold email thing isn't a chat window. It runs in the background. It has a written playbook. It takes actions. It shows me what it changed at the end of every week. I review it like I'd review a junior employee's work — correct it when it's wrong, let it run when it's right.

The same shape works for any function with a written playbook and measurable outcomes. Customer support. Sales coaching. Content moderation. Code review. Cold email is just the easiest place to demo it because the loop is short and the metric is clean.

We kept calling agents assistants. Some of them just do the job.

## Try it

- Spec + plugin: <https://cold.md>
- FoxReach (sender + free tier): <https://foxreach.io>
- Engineering deep dive: <https://foxreach.io/blog/cold-md-autoresearch>

Both open source. MIT plugin, CC-BY spec. The file is portable across senders. If FoxReach disappears tomorrow, your cold.md still works wherever you take it next.

Two commands to install. Seven days to your first experiment. Most people get a measurable lift inside the first month.

Try it.
