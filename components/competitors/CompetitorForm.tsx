'use client'

import { useState } from 'react'

export default function CompetitorForm({ brandId, onAdded }: { brandId: string, onAdded: () => void }) {
  const [formData, setFormData] = useState({
    competitor_name: '',
    competitor_domain: '',
    region: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={formData.competitor_name}
        onChange={(e) => setFormData({ ...formData, competitor_name: e.target.value })}
        placeholder="Competitor Name"
        className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-slate-500 focus:border-slate-600 focus:ring-1 focus:ring-slate-600 outline-none"
        required
      />
      <input
        type="text"
        value={formData.competitor_domain}
        onChange={(e) => setFormData({ ...formData, competitor_domain: e.target.value })}
        placeholder="competitor.com"
        className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-slate-500 focus:border-slate-600 focus:ring-1 focus:ring-slate-600 outline-none"
        required
      />
      <input
        type="text"
        value={formData.region}
        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
        placeholder="Region"
        className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-slate-500 focus:border-slate-600 focus:ring-1 focus:ring-slate-600 outline-none"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black px-4 py-3 hover:bg-slate-100 disabled:opacity-50 transition-colors"
      >
        Add Competitor
      </button>
    </form>
  )
}
