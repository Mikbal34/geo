'use client'

import { useState, type FormEvent } from 'react'

type Theme = 'light' | 'dark'

interface PromptFormProps {
  brandId: string
  onAdded: () => void
  theme?: Theme
}

export default function PromptForm({ brandId, onAdded, theme = 'dark' }: PromptFormProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const isDark = theme === 'dark'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: brandId, prompt_text: text }),
      })
      setText('')
      onAdded()
    } finally {
      setLoading(false)
    }
  }

  const inputClass = [
    'flex-1 rounded-xl border px-4 py-3 transition-colors shadow-sm focus:outline-none focus:ring-2',
    isDark
      ? 'border-[#2a2a2a] bg-[#0a0a0a] text-white placeholder-slate-500 focus:border-slate-500 focus:ring-slate-600/50'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:ring-slate-200',
  ].join(' ')

  const buttonClass = [
    'rounded-xl px-5 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
    isDark
      ? 'bg-white text-black hover:bg-slate-100 focus:ring-white/70 focus:ring-offset-slate-900'
      : 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900 focus:ring-offset-white',
  ].join(' ')

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a prompt..."
        className={inputClass}
        minLength={10}
        required
      />
      <button
        type="submit"
        disabled={loading}
        className={buttonClass}
      >
        Add
      </button>
    </form>
  )
}
