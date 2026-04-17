import Link from 'next/link'

const SPEC_SNIPPET = `# My Product - cold.md

## Identity    - who's sending
## Audience    - ICP + disqualifiers
## Value       - the offer, in one sentence
## Voice       - dos and don'ts, obeyed verbatim
## Proof       - facts the agent may cite
## Sequence    - opener, bump, breakup slots
## Objections  - preferred replies to pushbacks
## Banned      - phrases that never appear`

const CONFORMING_AGENT = [
  'Reads cold.md before generating any outreach.',
  'Refuses to emit any string in ## Banned (case-insensitive).',
  'Matches ## Voice rules verbatim - obeyed, not "inspired by."',
  'Cites only from ## Proof - no invented numbers, names, or testimonials.',
  'Respects ## Sequence slot constraints (subject, length, content).',
  'Maps inbound replies to ## Objections before generating new content.',
  'Refuses to contact anyone who fails ## Audience (including ### Not for).',
]

const EXAMPLE_OPENER = `# FoxReach - cold.md
## Identity
I'm Usama, founder of FoxReach. We build cold email
infrastructure that doesn't torch your domain.
## Audience
- B2B SaaS, 5-50 employees, post-seed
- Title: Head of Growth, Demand Gen, VP Marketing
- Currently running outbound (Instantly, Smartlead, Apollo)
## Voice
### Do
- Short sentences. One idea each.
- Name a specific tool or number in the first line.
### Don't
- Start with "I hope this email finds you well"
- Use em dashes
## Banned
- circle back
- touch base
- synergy`

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
        <Link href="/" className="font-mono text-sm font-medium tracking-tight">
          cold.md
        </Link>
        <div className="flex items-center gap-6 text-sm text-muted">
          <Link href="#spec" className="hover:text-ink transition-colors">spec</Link>
          <Link href="#install" className="hover:text-ink transition-colors">install</Link>
          <Link href="#implementations" className="hover:text-ink transition-colors">implementations</Link>
          <a
            href="https://github.com/concaption/cold-md"
            className="hover:text-ink transition-colors"
            target="_blank"
            rel="noreferrer"
          >
            github
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-16 sm:pt-24 pb-20">
        <div className="flex items-center gap-2 text-xs font-mono text-fox mb-8">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-fox" />
          v0 spec - public domain, vendor-neutral
        </div>

        <h1 className="font-display text-hero text-ink">
          One markdown file that<br />
          runs your <span className="italic text-fox">cold outreach</span>.
        </h1>

        <p className="mt-8 max-w-2xl text-lg sm:text-xl leading-relaxed text-ink/75">
          An opinionated, executable spec for AI-driven cold outreach. Your ICP, voice,
          value prop, proof, sequences, objections, and banned phrases - in one file,
          in your repo. Any conforming agent reads it and produces outreach that matches.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="#install"
            className="group inline-flex items-center gap-2 bg-ink text-paper px-5 py-3 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors"
          >
            Install in 30 seconds
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <Link
            href="#spec"
            className="inline-flex items-center gap-2 text-sm text-ink/70 hover:text-ink px-5 py-3 rounded-lg border border-line hover:border-ink/30 transition-colors"
          >
            Read the spec
          </Link>
          <a
            href="https://github.com/concaption/cold-md"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-ink/70 hover:text-ink px-5 py-3"
          >
            <GitHubGlyph />
            GitHub
          </a>
        </div>

        {/* Hero spec preview */}
        <div className="mt-16 rounded-xl border border-line bg-white shadow-[0_1px_0_rgba(26,21,18,0.03),0_24px_48px_-24px_rgba(26,21,18,0.12)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-line bg-paper/60">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-line" />
              <span className="w-2.5 h-2.5 rounded-full bg-line" />
              <span className="w-2.5 h-2.5 rounded-full bg-line" />
            </div>
            <span className="font-mono text-xs text-muted ml-2">./cold.md</span>
          </div>
          <pre className="p-5 sm:p-7 text-sm font-mono leading-relaxed overflow-x-auto no-scrollbar">
            <code className="text-ink">
              {SPEC_SNIPPET.split('\n').map((line, i) => (
                <div key={i} className={line.startsWith('#') ? 'text-fox' : ''}>
                  {line || '\u00A0'}
                </div>
              ))}
            </code>
          </pre>
        </div>
      </section>

      {/* Why */}
      <section className="border-y border-line bg-white/60">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <div className="grid sm:grid-cols-12 gap-10">
            <div className="sm:col-span-4">
              <div className="text-xs font-mono text-muted uppercase tracking-wider mb-3">why</div>
              <h2 className="font-display text-3xl sm:text-4xl leading-tight">
                The inputs don't travel.
              </h2>
            </div>
            <div className="sm:col-span-8 text-ink/75 leading-relaxed space-y-4">
              <p>
                Every AI cold-outreach tool today reinvents the same inputs - ICP, voice, value prop,
                objections, banned words - inside its own UI, database, or prompt template.
              </p>
              <p>
                You can't <code className="font-mono text-sm px-1.5 py-0.5 bg-fox-tint text-fox rounded">git diff</code> them.
                You can't version them. You can't hand them to a different agent next month.
              </p>
              <p className="text-ink font-medium">
                cold.md is one file, committed to a repo, that any conforming agent reads
                before it writes a single email.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The spec sections */}
      <section id="spec" className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <div className="text-xs font-mono text-muted uppercase tracking-wider mb-3">spec</div>
        <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-10">
          Eight sections. In order.
        </h2>

        <div className="grid sm:grid-cols-2 gap-px bg-line rounded-xl overflow-hidden border border-line">
          {SECTIONS.map((s) => (
            <div key={s.name} className="bg-white p-6 sm:p-7 hover:bg-fox-tint/30 transition-colors">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-mono text-xs text-muted">{s.num}</span>
                <h3 className="font-mono text-base font-medium text-fox">## {s.name}</h3>
              </div>
              <p className="text-sm text-ink/75 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted">
          Sections are optional but must appear in this order when present.
          Read the{' '}
          <a
            href="https://github.com/concaption/cold-md/blob/main/spec/cold-md-v0.md"
            className="underline decoration-fox/40 underline-offset-4 hover:decoration-fox"
            target="_blank"
            rel="noreferrer"
          >
            full v0 spec on GitHub
          </a>.
        </p>
      </section>

      {/* What a conforming agent does */}
      <section className="border-y border-line bg-ink text-paper">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <div className="text-xs font-mono text-fox-light uppercase tracking-wider mb-3">the contract</div>
          <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-12 max-w-3xl">
            What a conforming agent does.
          </h2>
          <ol className="space-y-5 max-w-3xl">
            {CONFORMING_AGENT.map((item, i) => (
              <li key={i} className="flex gap-5 items-start">
                <span className="font-mono text-sm text-fox-light pt-1 tabular-nums shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-lg text-paper/85 leading-relaxed">{item}</p>
              </li>
            ))}
          </ol>
          <p className="mt-12 text-sm text-paper/50 max-w-3xl">
            Silent degradation is a bug. If a spec rule would be violated, the agent stops
            and surfaces the conflict instead of papering over it.
          </p>
        </div>
      </section>

      {/* Install */}
      <section id="install" className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <div className="text-xs font-mono text-muted uppercase tracking-wider mb-3">install</div>
        <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-10">
          One command. Skill installed.
        </h2>

        <div className="rounded-xl border border-line bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-line bg-paper/60 flex items-center justify-between">
            <span className="font-mono text-xs text-muted">terminal</span>
            <span className="font-mono text-xs text-fox">copy</span>
          </div>
          <pre className="p-6 text-sm sm:text-base font-mono overflow-x-auto no-scrollbar">
            <code>
              <span className="text-muted">$ </span>
              <span className="text-ink">curl -fsSL </span>
              <span className="text-fox">https://cold.md/install</span>
              <span className="text-ink"> | bash</span>
            </code>
          </pre>
        </div>

        <div className="mt-10 grid sm:grid-cols-3 gap-8">
          {[
            ['01', 'Installs the cold-outreach skill', 'Copies skill/cold-outreach into ~/.claude/skills/'],
            ['02', 'Scaffolds cold.md', 'If your repo has no cold.md, starts from the minimal template'],
            ['03', 'Ready to draft', 'Ask Claude: "draft an opener for [Name] at [Company]"'],
          ].map(([num, title, desc]) => (
            <div key={num}>
              <div className="font-mono text-xs text-fox mb-3 tabular-nums">{num}</div>
              <div className="font-medium text-ink mb-1">{title}</div>
              <div className="text-sm text-ink/70 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Example */}
      <section className="border-y border-line bg-white/60">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <div className="text-xs font-mono text-muted uppercase tracking-wider mb-3">example</div>
          <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-10">
            FoxReach's real cold.md.
          </h2>
          <p className="text-ink/75 max-w-2xl mb-8 leading-relaxed">
            Lifted straight from production. If you want a reference implementation of this spec,
            this is it.
          </p>
          <div className="rounded-xl border border-line bg-ink text-paper/90 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-paper/10 bg-paper/5">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-paper/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-paper/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-paper/20" />
              </div>
              <span className="font-mono text-xs text-paper/50 ml-2">foxreach.cold.md</span>
            </div>
            <pre className="p-5 sm:p-7 text-sm font-mono leading-relaxed overflow-x-auto no-scrollbar">
              <code>
                {EXAMPLE_OPENER.split('\n').map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.startsWith('#')
                        ? 'text-fox-light'
                        : line.startsWith('-')
                        ? 'text-paper/70'
                        : 'text-paper/90'
                    }
                  >
                    {line || '\u00A0'}
                  </div>
                ))}
              </code>
            </pre>
          </div>
          <div className="mt-6">
            <a
              href="https://github.com/concaption/cold-md/blob/main/examples/foxreach.cold.md"
              target="_blank"
              rel="noreferrer"
              className="text-sm underline decoration-fox/40 underline-offset-4 hover:decoration-fox"
            >
              See the full file on GitHub →
            </a>
          </div>
        </div>
      </section>

      {/* Implementations */}
      <section id="implementations" className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <div className="text-xs font-mono text-muted uppercase tracking-wider mb-3">implementations</div>
        <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-10">
          Who's built against the spec.
        </h2>

        <div className="space-y-6">
          {/* Free Claude Code skill */}
          <div className="rounded-xl border border-line bg-white p-7 sm:p-9">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="max-w-xl">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-display text-2xl">cold-outreach skill</h3>
                  <span className="font-mono text-xs bg-fox-tint text-fox px-2 py-0.5 rounded-full">free</span>
                </div>
                <p className="text-ink/75 leading-relaxed mb-5">
                  Reference implementation. A Claude Code skill that reads your cold.md, drafts
                  messages obeying the spec, and refuses to ship output that violates it.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['reads cold.md', 'banned-phrase linter', 'proof-only citations', 'sequence-aware'].map((t) => (
                    <span key={t} className="font-mono px-2.5 py-1 rounded-md bg-paper border border-line text-ink/70">{t}</span>
                  ))}
                </div>
              </div>
              <a
                href="https://github.com/concaption/cold-md/tree/main/skill/cold-outreach"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-ink/70 hover:text-ink px-4 py-2 rounded-lg border border-line hover:border-ink/30 transition-colors shrink-0"
              >
                View skill →
              </a>
            </div>
          </div>

          {/* FoxReach plugin */}
          <div className="rounded-xl border border-fox/20 bg-gradient-to-br from-fox-tint to-white p-7 sm:p-9 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-fox/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="relative flex items-start justify-between gap-6 flex-wrap">
              <div className="max-w-xl">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-display text-2xl">FoxReach plugin</h3>
                  <span className="font-mono text-xs bg-fox text-paper px-2 py-0.5 rounded-full">commercial</span>
                </div>
                <p className="text-ink/80 leading-relaxed mb-5">
                  Run your cold.md at scale. Multi-inbox warmup, reply triage, booked-calls
                  dashboard. The plugin bundles the open skill plus FoxReach API commands so
                  Claude can send, monitor, and triage directly.
                </p>
                <div className="flex flex-wrap gap-2 text-xs mb-5">
                  {['warmup engine', 'reply triage', 'multi-domain orchestration', 'booked-calls view'].map((t) => (
                    <span key={t} className="font-mono px-2.5 py-1 rounded-md bg-white border border-fox/20 text-ink/80">{t}</span>
                  ))}
                </div>
              </div>
              <a
                href="https://foxreach.io"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm bg-fox text-paper hover:bg-fox-hover px-5 py-2.5 rounded-lg font-medium transition-colors shrink-0"
              >
                Visit FoxReach →
              </a>
            </div>
          </div>
        </div>

        <p className="mt-8 text-sm text-muted">
          Build one?{' '}
          <a
            href="https://github.com/concaption/cold-md/pulls"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-fox/40 underline-offset-4 hover:decoration-fox"
          >
            Open a PR
          </a>{' '}
          and add yourself.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto max-w-5xl px-6 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="font-mono text-sm font-medium mb-1">cold.md</div>
            <p className="text-sm text-muted max-w-md">
              Open spec, MIT + CC-BY-4.0. Built and maintained by the team at{' '}
              <a href="https://foxreach.io" target="_blank" rel="noreferrer" className="text-ink hover:text-fox">
                FoxReach
              </a>.
            </p>
          </div>
          <div className="flex items-center gap-5 text-sm text-muted">
            <a href="https://github.com/concaption/cold-md" target="_blank" rel="noreferrer" className="hover:text-ink">GitHub</a>
            <a href="https://github.com/concaption/cold-md/blob/main/spec/cold-md-v0.md" target="_blank" rel="noreferrer" className="hover:text-ink">Spec v0</a>
            <a href="https://foxreach.io" target="_blank" rel="noreferrer" className="hover:text-ink">FoxReach</a>
          </div>
        </div>
      </footer>
    </main>
  )
}

const SECTIONS = [
  { num: '01', name: 'Identity', desc: 'Who is sending. One paragraph. First person. Name, role, company, one credibility line.' },
  { num: '02', name: 'Audience', desc: 'Who receives. ICP bullets observable from name + company + title. Disqualifiers go under ### Not for.' },
  { num: '03', name: 'Value', desc: "One sentence. If it doesn't fit in one, the offer isn't clear enough to send cold." },
  { num: '04', name: 'Voice', desc: '### Do and ### Don\'t lists. Enforced verbatim. "No em dashes" means the agent refuses to emit them.' },
  { num: '05', name: 'Proof', desc: 'Bulleted facts the agent may cite. No hallucinated numbers, no invented testimonials.' },
  { num: '06', name: 'Sequence', desc: 'Numbered H3 slots (opener, bump, breakup). Each defines purpose + constraint, not literal copy.' },
  { num: '07', name: 'Objections', desc: '> "quoted objection" + preferred reply. Agents map inbound to these before generating new content.' },
  { num: '08', name: 'Banned', desc: 'Flat list of strings. Hard filter, not a guideline. If a draft contains one, the agent regenerates.' },
]

function GitHubGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  )
}
