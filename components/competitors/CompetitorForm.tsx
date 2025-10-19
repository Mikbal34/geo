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
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        value={formData.competitor_name}
        onChange={(e) => setFormData({ ...formData, competitor_name: e.target.value })}
        placeholder="Competitor Name"
        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-slate-900 focus:ring-2 focus:ring-slate-200 outline-none"
        required
      />
      <input
        type="text"
        value={formData.competitor_domain}
        onChange={(e) => setFormData({ ...formData, competitor_domain: e.target.value })}
        placeholder="competitor.com"
        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-slate-900 focus:ring-2 focus:ring-slate-200 outline-none"
        required
      />
      <input
        type="text"
        value={formData.region}
        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
        placeholder="Region"
        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-slate-900 focus:ring-2 focus:ring-slate-200 outline-none"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50"
      >
        Add Competitor
      </button>
    </form>
  )
}
