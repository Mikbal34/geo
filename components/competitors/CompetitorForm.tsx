'use client'

import { useState, type FormEvent } from 'react'

type Theme = 'light' | 'dark'

interface CompetitorFormProps {
  brandId: string
  onAdded: () => void
  theme?: Theme
}

export default function CompetitorForm({ brandId, onAdded, theme = 'dark' }: CompetitorFormProps) {
  const [formData, setFormData] = useState({
    competitor_name: '',
    competitor_domain: '',
    region: '',
  })
  const [loading, setLoading] = useState(false)
  const isDark = theme === 'dark'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, brand_id: brandId }),
      })
      setFormData({ competitor_name: '', competitor_domain: '', region: '' })
      onAdded()
    } finally {
      setLoading(false)
    }
  }

  const inputClass = [
    'w-full rounded-xl border px-4 py-3 transition-colors shadow-sm focus:outline-none focus:ring-2',
    isDark
      ? 'border-[#2a2a2a] bg-[#0a0a0a] text-white placeholder-slate-500 focus:border-slate-500 focus:ring-slate-600/50'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:ring-slate-200',
  ].join(' ')

  const buttonClass = [
    'w-full rounded-xl px-5 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
    isDark
      ? 'bg-white text-black hover:bg-slate-100 focus:ring-white/70 focus:ring-offset-slate-900'
      : 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900 focus:ring-offset-white',
  ].join(' ')

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={formData.competitor_name}
        onChange={(e) => setFormData({ ...formData, competitor_name: e.target.value })}
        placeholder="Competitor Name"
        className={inputClass}
        required
      />
      <input
        type="text"
        value={formData.competitor_domain}
        onChange={(e) => setFormData({ ...formData, competitor_domain: e.target.value })}
        placeholder="competitor.com"
        className={inputClass}
        required
      />
      <input
        type="text"
        value={formData.region}
        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
        placeholder="Region"
        className={inputClass}
        required
      />
      <button
        type="submit"
        disabled={loading}
        className={buttonClass}
      >
        Add Competitor
      </button>
    </form>
  )
}
