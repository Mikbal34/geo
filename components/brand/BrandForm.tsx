'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BrandForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    brand_name: '',
    domain: '',
    region: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (res.status === 401) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        router.push('/login')
        return
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || data.message || 'Failed to create brand')
      }

      const brand = await res.json()
      router.push(`/brands/${brand.id}/prompts`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Brand Name *
          </label>
          <input
            type="text"
            required
            value={formData.brand_name}
            onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-slate-900 focus:ring-2 focus:ring-slate-200 transition-all outline-none"
            placeholder="e.g., EcoClean"
          />
          <p className="mt-1.5 text-sm text-slate-500">Your brand's official name</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Domain *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <input
              type="text"
              required
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-slate-900 focus:ring-2 focus:ring-slate-200 transition-all outline-none"
              placeholder="ecoclean.com"
            />
          </div>
          <p className="mt-1.5 text-sm text-slate-500">Your brand's website domain</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Target Region & Language *
          </label>
          <select
            required
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-slate-900 focus:ring-2 focus:ring-slate-200 transition-all outline-none bg-white"
          >
            <option value="">Select a region</option>
            <option value="Global">🌍 Global (English)</option>
            <option value="Turkey">🇹🇷 Turkey (Turkish)</option>
            <option value="France">🇫🇷 France (French)</option>
            <option value="Germany">🇩🇪 Germany (German)</option>
            <option value="Spain">🇪🇸 Spain (Spanish)</option>
            <option value="Italy">🇮🇹 Italy (Italian)</option>
            <option value="United Kingdom">🇬🇧 United Kingdom (English)</option>
            <option value="United States">🇺🇸 United States (English)</option>
            <option value="Japan">🇯🇵 Japan (Japanese)</option>
            <option value="China">🇨🇳 China (Chinese)</option>
            <option value="Brazil">🇧🇷 Brazil (Portuguese)</option>
            <option value="Mexico">🇲🇽 Mexico (Spanish)</option>
            <option value="India">🇮🇳 India (English)</option>
            <option value="Russia">🇷🇺 Russia (Russian)</option>
            <option value="South Korea">🇰🇷 South Korea (Korean)</option>
          </select>
          <p className="mt-1.5 text-sm text-slate-500">Analysis language and target market</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-slate-900 text-white py-4 rounded-xl font-semibold hover:bg-slate-800 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 group"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Creating Brand...
          </>
        ) : (
          <>
            Continue to Prompts
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </button>
    </form>
  )
}
