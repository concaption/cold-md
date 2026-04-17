import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://cold.md'),
  title: 'cold.md - One markdown file that runs your cold outreach',
  description:
    'An opinionated, executable spec for AI-driven cold outreach. One file, eight sections. Any conforming agent reads it and produces outreach that matches.',
  keywords: [
    'cold.md',
    'cold email spec',
    'AI cold outreach',
    'cold outreach spec',
    'agents markdown',
    'llms.txt cold email',
    'FoxReach',
    'Claude Code skill',
  ],
  openGraph: {
    title: 'cold.md - Your cold outreach, in one file',
    description:
      'Open spec + free Claude Code skill. The portable, executable, vendor-neutral source of truth for your outbound.',
    url: 'https://cold.md',
    siteName: 'cold.md',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'cold.md',
    description: 'One markdown file that runs your cold outreach.',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://cold.md' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="grain font-sans">{children}</body>
    </html>
  )
}
