import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'cold.md - One markdown file that runs your cold outreach'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#faf7f2',
          padding: 72,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 22, color: '#C2410C' }}>
          <span style={{ width: 10, height: 10, background: '#C2410C', borderRadius: 999 }} />
          cold.md / v0 spec
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 96, color: '#1a1512', lineHeight: 1.02, letterSpacing: '-0.03em', fontWeight: 600 }}>
            One markdown file
          </div>
          <div style={{ fontSize: 96, color: '#1a1512', lineHeight: 1.02, letterSpacing: '-0.03em', fontWeight: 600 }}>
            that runs your{' '}
            <span style={{ color: '#C2410C', fontStyle: 'italic' }}>cold outreach</span>.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 22, color: '#8a8178' }}>
          <div style={{ display: 'flex', gap: 32 }}>
            <span>## Identity</span>
            <span>## Voice</span>
            <span>## Proof</span>
            <span>## Sequence</span>
            <span>## Banned</span>
          </div>
          <div style={{ color: '#1a1512' }}>cold.md</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
