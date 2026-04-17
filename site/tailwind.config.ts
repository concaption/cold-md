import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1a1512',
        paper: '#faf7f2',
        muted: '#8a8178',
        line: '#e8e0d5',
        fox: {
          DEFAULT: '#C2410C',
          hover: '#9a3412',
          light: '#fed7aa',
          tint: '#fff7ed',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['Instrument Serif', 'ui-serif', 'Georgia', 'serif'],
      },
      fontSize: {
        'hero-sm': ['clamp(2.5rem, 8vw, 4rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'hero': ['clamp(3rem, 9vw, 5.5rem)', { lineHeight: '1.02', letterSpacing: '-0.035em' }],
      },
    },
  },
  plugins: [],
}

export default config
