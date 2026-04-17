import Image from 'next/image'
import Link from 'next/link'

const SKILLS = [
  { num: '01', name: 'cold-icp',    desc: 'Build your ICP from a URL (scrape homepage, case studies) or interactive Q&A. Writes icp.md.',               status: 'live', needsKey: false },
  { num: '02', name: 'cold-leads',  desc: 'Source leads matching icp.md. Enriches, scores, dedupes, writes leads.csv.',                                   status: 'v0.2', needsKey: true  },
  { num: '03', name: 'cold-draft',  desc: 'Draft openers, bumps, breakups from cold.md. Refuses banned phrases, cites only from ## Proof.',                status: 'live', needsKey: false },
  { num: '04', name: 'cold-send',   desc: 'Queue a FoxReach campaign with pre-flight safety: lint, audience check, warmup, sending-limit math.',           status: 'v0.2', needsKey: true  },
  { num: '05', name: 'cold-triage', desc: 'Sort replies into interested / not-now / OOO / bounced. Drafts responses against ## Objections.',               status: 'v0.2', needsKey: true  },
  { num: '06', name: 'cold-report', desc: 'Daily or weekly digest: deliverability, replies, booked calls. Runs on cron. Posts to Slack or terminal.',      status: 'live', needsKey: true  },
] as const

const SPEC_SNIPPET = `# My Product - cold.md

## Identity    - who's sending
## Audience    - ICP + disqualifiers
## Value       - the offer, in one sentence
## Voice       - dos and don'ts, obeyed verbatim
## Proof       - facts the agent may cite
## Sequence    - opener, bump, breakup slots
## Objections  - preferred replies to pushbacks
## Banned      - phrases that never appear`

const CMD_STACK = [
  '/cold icp https://your-site.com',
  '/cold leads --count 100',
  '/cold draft Jane, CEO at Acme',
  '/cold send ./leads.csv',
  '/cold triage',
  '/cold report weekly',
]

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
        <Link href="/" className="font-mono text-sm font-medium tracking-tight">cold.md</Link>
        <div className="flex items-center gap-6 text-sm text-muted">
          <Link href="#loop" className="hover:text-ink transition-colors">the loop</Link>
          <Link href="#skills" className="hover:text-ink transition-colors">skills</Link>
          <Link href="#install" className="hover:text-ink transition-colors">install</Link>
          <Link href="#spec" className="hover:text-ink transition-colors">spec</Link>
          <a href="https://github.com/concaption/cold-md" target="_blank" rel="noreferrer" className="hover:text-ink transition-colors">github</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-12 sm:pt-20 pb-16">
        <div className="flex items-center gap-2 text-xs font-mono text-fox mb-8">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-fox" />
          v0 - six skills, one /cold command, FoxReach-backed
        </div>

        <h1 className="font-display text-hero text-ink max-w-5xl">
          Your cold outreach,<br />
          in <span className="italic text-fox">one Claude Code plugin</span>.
        </h1>

        <p className="mt-8 max-w-2xl text-lg sm:text-xl leading-relaxed text-ink/75">
          <strong className="text-ink">Not another cold-email skill.</strong> A full suite:
          ICP builder, lead sourcing, drafter, sender, reply triage, reporter. All wired together.
          Reads a portable <code className="font-mono text-base px-1.5 py-0.5 bg-fox-tint text-fox rounded">cold.md</code> file.
          Runs on <a href="https://foxreach.io" className="underline decoration-fox/40 underline-offset-4 hover:decoration-fox">FoxReach</a> infrastructure.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link href="#install" className="group inline-flex items-center gap-2 bg-ink text-paper px-5 py-3 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors">
            Install the suite
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <Link href="#loop" className="inline-flex items-center gap-2 text-sm text-ink/70 hover:text-ink px-5 py-3 rounded-lg border border-line hover:border-ink/30 transition-colors">
            See the loop
          </Link>
          <a href="https://github.com/concaption/cold-md" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-ink/70 hover:text-ink px-5 py-3">
            <GitHubGlyph />GitHub
          </a>
        </div>

        {/* Cover banner */}
        <div className="mt-14 rounded-xl overflow-hidden border border-line shadow-[0_24px_48px_-24px_rgba(26,21,18,0.25)]">
          <Image
            src="/cover.webp"
            alt="cold.md - One markdown file that runs your cold outreach"
            width={1800}
            height={600}
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="w-full h-auto"
          />
        </div>
      </section>

      {/* The loop */}
      <section id="loop" className="border-y border-line bg-white/60">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="text-xs font-mono text-muted uppercase tracking-wider mb-3">the loop</div>
          <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-4">
            Six steps. One command each.
          </h2>
          <p className="text-ink/70 max-w-2xl mb-12 leading-relaxed">
            Every step reads and writes files your team can review. No black box, no vendor lock-in.
            Swap FoxReach for any backend that implements the contract - the skills keep working.
          </p>

          <div className="rounded-xl border border-line bg-ink text-paper overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-paper/10 bg-paper/5">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-paper/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-paper/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-paper/20" />
              </div>
              <span className="font-mono text-xs text-paper/50 ml-2">terminal</span>
            </div>
            <pre className="p-5 sm:p-8 text-sm sm:text-base font-mono leading-loose overflow-x-auto no-scrollbar">
              <code>
                {CMD_STACK.map((line, i) => (
                  <div key={i} className="flex items-baseline gap-4">
                    <span className="text-fox-light tabular-nums w-8 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-paper/90">{line}</span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Skills grid */}
      <section id="skills" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="text-xs font-mono text-muted uppercase tracking-wider mb-3">the six skills</div>
        <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-10">
          Each skill owns one file.
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line rounded-xl overflow-hidden border border-line">
          {SKILLS.map((s) => (
            <div key={s.name} className="bg-white p-6 sm:p-7 hover:bg-fox-tint/30 transition-colors relative">
              <div className="flex items-baseline justify-between mb-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-muted tabular-nums">{s.num}</span>
                  <h3 className="font-mono text-base font-medium text-fox">{s.name}</h3>
                </div>
                {s.status === 'live' ? (
                  <span className="font-mono text-[10px] tracking-wider uppercase bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">live</span>
                ) : (
                  <span className="font-mono text-[10px] tracking-wider uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">v0.2</span>
                )}
              </div>
              <p className="text-sm text-ink/75 leading-relaxed mb-3">{s.desc}</p>
              {s.needsKey && (
                <div className="text-[11px] font-mono text-muted">requires FOXREACH_API_KEY</div>
              )}
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted">
          Every skill reads <code className="font-mono text-xs px-1 py-0.5 bg-fox-tint text-fox rounded">cold.md</code>{' '}
          or <code className="font-mono text-xs px-1 py-0.5 bg-fox-tint text-fox rounded">icp.md</code>{' '}
          from your repo. Files travel with your team, not with your vendor.
        </p>
      </section>

      {/* Install */}
      <section id="install" className="border-y border-line bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="text-xs font-mono text-fox-light uppercase tracking-wider mb-3">install</div>
          <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-10 max-w-3xl">
            One command. Six skills.<br />One loop.
          </h2>

          <div className="rounded-xl border border-paper/10 bg-paper/5 overflow-hidden max-w-3xl">
            <div className="px-5 py-3 border-b border-paper/10 flex items-center justify-between">
              <span className="font-mono text-xs text-paper/50">terminal</span>
              <span className="font-mono text-xs text-fox-light">copy</span>
            </div>
            <pre className="p-6 text-sm sm:text-base font-mono overflow-x-auto no-scrollbar">
              <code>
                <span className="text-paper/40">$ </span>
                <span className="text-paper">curl -fsSL </span>
                <span className="text-fox-light">https://cold.md/install</span>
                <span className="text-paper"> | bash</span>
              </code>
            </pre>
          </div>

          <div className="mt-10 grid sm:grid-cols-3 gap-8 max-w-4xl">
            {[
              ['01', 'Installs the full plugin', 'All six skills, the /cold router, into ~/.claude/plugins/cold-md/'],
              ['02', 'Scaffolds cold.md + icp.md', 'Pass --scaffold to drop starter templates in your current repo'],
              ['03', 'Ready to draft', 'In Claude Code: /cold icp https://your-site.com - then iterate'],
            ].map(([num, title, desc]) => (
              <div key={num}>
                <div className="font-mono text-xs text-fox-light mb-3 tabular-nums">{num}</div>
                <div className="font-medium text-paper mb-1">{title}</div>
                <div className="text-sm text-paper/70 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-sm text-paper/60 max-w-2xl">
            The FoxReach-backed skills (leads, send, triage, report) activate when you set{' '}
            <code className="font-mono text-xs bg-paper/10 px-1.5 py-0.5 rounded">FOXREACH_API_KEY</code>.{' '}
            <a href="https://foxreach.io/signup" target="_blank" rel="noreferrer" className="text-fox-light hover:text-paper">Free tier signup →</a>
          </div>

          <div className="mt-6 text-xs text-paper/40">
            Prefer skills-only, no plugin? <code className="font-mono bg-paper/10 px-1.5 py-0.5 rounded">curl -fsSL https://cold.md/install | bash -s -- --skills-only</code>
          </div>
        </div>
      </section>

      {/* The cold.md spec */}
      <section id="spec" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="grid lg:grid-cols-2 gap-14 items-start">
          <div>
            <div className="text-xs font-mono text-muted uppercase tracking-wider mb-3">the cold.md file</div>
            <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-6">
              The portable brief every skill reads.
            </h2>
            <p className="text-ink/75 leading-relaxed mb-5">
              One markdown file in your repo. Eight sections. Any conforming agent reads it
              before generating a single email.
            </p>
            <ul className="space-y-3 text-sm text-ink/75">
              <li className="flex gap-3"><span className="font-mono text-fox">→</span>Banned phrases are a <strong>hard filter</strong>, not a guideline.</li>
              <li className="flex gap-3"><span className="font-mono text-fox">→</span>Voice rules are <strong>enforced verbatim</strong> - not "inspired by."</li>
              <li className="flex gap-3"><span className="font-mono text-fox">→</span>Only facts from <code className="font-mono text-xs px-1 py-0.5 bg-fox-tint text-fox rounded">## Proof</code> can be cited. No fabricated numbers.</li>
              <li className="flex gap-3"><span className="font-mono text-fox">→</span>Audience disqualifiers are respected - won't contact leads who fail your ICP.</li>
            </ul>
            <div className="mt-8 flex gap-3">
              <a href="https://github.com/concaption/cold-md/blob/main/spec/cold-md-v0.md" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-fox">
                Read the v0 spec →
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-white overflow-hidden">
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
        </div>
      </section>

      {/* Why this, not another skill */}
      <section className="border-y border-line bg-white/60">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="text-xs font-mono text-muted uppercase tracking-wider mb-3">why a suite, not a skill</div>
          <h2 className="font-display text-3xl sm:text-4xl leading-tight mb-10 max-w-3xl">
            Other Claude Code cold-email skills draft. That's one step in a six-step loop.
          </h2>
          <div className="grid sm:grid-cols-2 gap-10">
            <div>
              <div className="font-mono text-xs text-muted uppercase tracking-wider mb-3">single skill</div>
              <ul className="space-y-2 text-sm text-ink/70">
                <li>- Writes copy when asked</li>
                <li>- No ICP, no lead sourcing, no sending</li>
                <li>- No reply triage, no reporting</li>
                <li>- Every project starts from scratch</li>
                <li>- Config lives in the prompt, not the repo</li>
              </ul>
            </div>
            <div>
              <div className="font-mono text-xs text-fox uppercase tracking-wider mb-3">cold.md suite</div>
              <ul className="space-y-2 text-sm text-ink/90">
                <li>→ Every step of the loop has its own skill</li>
                <li>→ ICP, voice, proof, sequences committed to your repo</li>
                <li>→ <code className="font-mono text-xs px-1 bg-fox-tint text-fox rounded">/cold report</code> runs on cron - you never open a dashboard</li>
                <li>→ Swap sending infra without rewriting anything</li>
                <li>→ Works for you, your team, your agents</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="font-mono text-sm font-medium mb-1">cold.md</div>
            <p className="text-sm text-muted max-w-md">
              Open spec, MIT + CC-BY-4.0. Built and maintained by the team at{' '}
              <a href="https://foxreach.io" target="_blank" rel="noreferrer" className="text-ink hover:text-fox">FoxReach</a>.
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

function GitHubGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  )
}
