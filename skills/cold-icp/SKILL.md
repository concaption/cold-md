---
name: cold-icp
description: Build your Ideal Customer Profile (ICP) and write it to icp.md for the rest of the cold.md suite to consume. Use when the user says "build my ICP", "define my target audience", "who should I sell to", "analyze my website for ICP", or when starting a new cold outreach project. Can bootstrap from a URL (scrape homepage, about, pricing, case studies) or run an interactive Q&A. Writes a structured icp.md that cold-leads, cold-draft, and cold-send all read.
---

# cold-icp

Step 1 of the cold.md suite. Builds the `icp.md` file that every other skill reads.

## When to use

- User says "build my ICP", "define my audience", "who should I sell to"
- User is starting a new cold outreach project and has no `icp.md` yet
- User wants to re-derive ICP from their website, case studies, or past wins
- User asks "does [lead] fit my ICP?"

## Two input modes

### Mode 1 - From a URL

If the user gives a URL (their company site, a case study library, or a portfolio):

1. Fetch the homepage, `/about`, `/pricing`, `/customers`, `/case-studies` (whichever exist).
2. Extract:
   - Industry / vertical (from hero copy, testimonial logos, case studies)
   - Typical customer size (SMB / mid-market / enterprise - infer from case study names + pricing tiers)
   - Geography (from team + testimonial locations)
   - Titles / roles mentioned in testimonials
   - Pain signals (the problems the company talks about solving)
   - Pricing tier (so we can rule out misaligned prospects later)
3. Draft the `icp.md` from the extracted data.
4. Surface any gaps ("I couldn't find your geography - is it US-only, global, EU-focused?") and fill via Q&A.

### Mode 2 - Interactive Q&A

If the user has no URL or wants to build from scratch, ask these 7 questions in order:

1. **Company size band** (employees): 1-10 / 11-50 / 51-200 / 201-1000 / 1000+
2. **Industry / vertical(s)**: list 1-3
3. **Stage / funding**: bootstrapped / seed / A-C / public / doesn't matter
4. **Titles you sell to**: list top 3
5. **Observable pain signals**: what does a prospect *do* or *not do* that signals they have this problem? (tool stack, job posts, public statements, GitHub commits, hiring patterns)
6. **Geography / language**: US, UK, EU, APAC, global, English-only, multilingual
7. **Hard disqualifiers**: who would you refuse to sell to even if they offered money? (list 2-5)

Each answer goes into the corresponding section of `icp.md`.

## Output format - `icp.md`

Write to `./icp.md` in the current directory (not `cold.md`). The cold.md suite uses two files: `icp.md` (who) and `cold.md` (voice/message). They are separate so you can iterate on either independently.

```markdown
---
coldMdVersion: "0"
updated: YYYY-MM-DD
source: [url or interactive]
---

# ICP - [Product or Company Name]

## Company signals

- Size: [X-Y employees]
- Stage: [funding / revenue band]
- Industry: [vertical 1], [vertical 2]
- Geography: [countries / regions]
- Tech stack signals: [tools they must use / must not use]

## Title signals

- Primary: [job title 1], [job title 2]
- Secondary: [job title 3]
- Not: [decision-makers who are wrong for us]

## Pain signals (observable)

- [Signal 1 - something public you can verify]
- [Signal 2 - tool they use, job posting, GitHub activity, etc.]
- [Signal 3]

## Disqualifiers

- [Hard no 1]
- [Hard no 2]

## Qualification checklist

A lead passes if:
- [ ] Matches company size band
- [ ] Title is in primary or secondary list
- [ ] At least one pain signal is observable
- [ ] Does NOT match any disqualifier
- [ ] Geography/language aligned

## Notes

[Any context, reasoning, edge cases]
```

## Validation

After writing `icp.md`:

1. Check each section is filled (not `[placeholder]`).
2. Verify Titles list has at least one entry.
3. Verify Pain signals contains at least 2 *observable* signals (not vibes).
4. Run the qualification checklist against 1 known good customer (ask the user) - it should pass. If it fails, the ICP is too tight.
5. Run against 1 known bad-fit prospect - it should fail. If it passes, the ICP is too loose.

## Gotchas

- **Observable != vague.** "They care about deliverability" is not observable. "They use Instantly or Smartlead" is.
- **Disqualifiers are sharper than qualifiers.** Sometimes you only know the ICP by knowing who it's *not*.
- **Don't ship `icp.md` without running the qualification checklist against real leads.** Garbage in, garbage out for every downstream skill.

## References

- Full cold.md suite: https://cold.md
- The separate `cold.md` file defines *how* you talk; this `icp.md` defines *who* you talk to.
- Example: https://github.com/concaption/cold-md/blob/main/examples/foxreach.icp.md (coming soon)
