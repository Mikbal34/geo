'use client'

import { useState } from 'react'
import { Sparkles, Check, X, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CompetitorSuggestion {
  name: string
  domain: string
  region: string
}

export default function SuggestCompetitorsButton({ brandId, onSuggested }: { brandId: string, onSuggested: () => void }) {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [suggestions, setSuggestions] = useState<CompetitorSuggestion[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [adding, setAdding] = useState(false)

  const handleSuggest = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/competitors/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: brandId, count: 3 }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get suggestions')
      }

      const validSuggestions = (data.suggestions || []).filter(
        (s: CompetitorSuggestion) => s.name && s.domain
      )

      setSuggestions(validSuggestions)
      setSelected(new Set(validSuggestions.map((_: CompetitorSuggestion, i: number) => i))) // Select all by default
      setShowModal(true)
    } catch (error) {
      console.error('Error getting suggestions:', error)
      alert(`Failed to get suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selected)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelected(newSelected)
  }

  const handleAdd = async () => {
    setAdding(true)
    try {
      const selectedCompetitors = suggestions.filter((_, i) => selected.has(i))
      console.log('Adding competitors:', selectedCompetitors)

      let successCount = 0
      let duplicateCount = 0
      let errorCount = 0

      const results = await Promise.allSettled(
        selectedCompetitors.map(async (comp) => {
          const res = await fetch('/api/competitors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              brand_id: brandId,
              competitor_name: comp.name,
              competitor_domain: comp.domain,
              region: comp.region,
            }),
          })
          const data = await res.json()
          console.log('Competitor add response:', res.status, data)

          if (res.status === 409) {
            // Duplicate - skip silently
            duplicateCount++
            return { skipped: true, reason: 'duplicate' }
          } else if (!res.ok) {
            errorCount++
            throw new Error(data.error || 'Failed to add competitor')
          } else {
            successCount++
            return data
          }
        })
      )

      console.log('Results:', { successCount, duplicateCount, errorCount })

      // Close modal and refresh
      setShowModal(false)
      setSuggestions([])
      setSelected(new Set())
      onSuggested()

      // Show summary
      if (successCount > 0) {
        const message = `✅ Added ${successCount} competitor${successCount !== 1 ? 's' : ''}${
          duplicateCount > 0 ? `\n⚠️ ${duplicateCount} already existed` : ''
        }`
        alert(message)
      } else if (duplicateCount > 0) {
        alert('⚠️ All selected competitors already exist')
      }

      if (errorCount > 0) {
        alert(`❌ ${errorCount} competitor${errorCount !== 1 ? 's' : ''} failed to add`)
      }
    } catch (error) {
      console.error('Error adding competitors:', error)
      alert(`Failed to add competitors: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setAdding(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSuggestions([])
    setSelected(new Set())
  }

  return (
    <>
      <Button
        onClick={handleSuggest}
        disabled={loading}
        size="lg"
        className="w-full bg-slate-900 hover:bg-slate-800"
      >
        <Sparkles className="w-5 h-5" />
        {loading ? 'Finding Competitors...' : 'AI Suggest Competitors'}
      </Button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-slate-900 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-white" />
                  <h2 className="text-2xl font-bold text-white">AI Suggested Competitors</h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-slate-200 mt-2">Select the competitors you want to add</p>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => toggleSelection(index)}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      selected.has(index)
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          selected.has(index)
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {selected.has(index) && <Check className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <h3 className="font-bold text-slate-900">{suggestion.name}</h3>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-600">
                            <span className="font-medium">Domain:</span> {suggestion.domain}
                          </p>
                          <p className="text-slate-600">
                            <span className="font-medium">Region:</span> {suggestion.region}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 p-6 bg-slate-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {selected.size} of {suggestions.length} selected
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCloseModal}
                    disabled={adding}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAdd}
                    disabled={selected.size === 0 || adding}
                    className="bg-slate-900 hover:bg-slate-800"
                  >
                    {adding ? 'Adding...' : `Add ${selected.size} Competitor${selected.size !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
