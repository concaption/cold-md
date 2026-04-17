'use client'

import { useState } from 'react'

type Props = {
  text: string
  label?: string
  className?: string
  variant?: 'light' | 'dark'
}

export default function CopyButton({ text, label = 'copy', className = '', variant = 'dark' }: Props) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        ta.remove()
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* swallow - user can select manually */
    }
  }

  const base =
    variant === 'light'
      ? 'text-fox hover:text-fox-hover'
      : 'text-fox-light hover:text-paper'

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={copied ? 'Copied' : `Copy ${label}`}
      className={`font-mono text-xs cursor-pointer transition-colors inline-flex items-center gap-1.5 ${base} ${className}`}
    >
      {copied ? (
        <>
          <CheckIcon />
          <span>copied</span>
        </>
      ) : (
        <>
          <CopyIcon />
          <span>{label}</span>
        </>
      )}
    </button>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" aria-hidden>
      <path d="M10 2H4a1 1 0 0 0-1 1v9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <rect x="6" y="5" width="8" height="9" rx="1.25" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" aria-hidden>
      <path d="M3 8.5l3.2 3.2L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
