'use client'

import { useState } from 'react'
import { Sparkles, Check, X } from 'lucide-react'

export default function SuggestPromptsButton({ brandId, onSuggested }: { brandId: string, onSuggested: () => void }) {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [adding, setAdding] = useState(false)

  const handleSuggest = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/prompts/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: brandId, count: 10 }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get suggestions')
      }

      const validSuggestions = data.suggestions || []
      setSuggestions(validSuggestions)
      setSelected(new Set(validSuggestions.map((_: string, i: number) => i))) // Select all by default
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
      const selectedPrompts = suggestions.filter((_, i) => selected.has(i))
      await Promise.all(
        selectedPrompts.map(text =>
          fetch('/api/prompts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brand_id: brandId, prompt_text: text }),
          })
        )
      )
      setShowModal(false)
      setSuggestions([])
      setSelected(new Set())
      onSuggested()
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
      <button
        onClick={handleSuggest}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-white text-black px-6 py-3 hover:bg-slate-100 disabled:opacity-50 transition-colors"
      >
        <Sparkles className="w-5 h-5" />
        {loading ? 'Generating AI Suggestions...' : 'AI Suggest Prompts'}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#171717] shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden border border-slate-800">
            {/* Header */}
            <div className="bg-[#0a0a0a] p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-white" />
                  <h2 className="text-2xl font-bold text-white">AI Suggested Prompts</h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-slate-400 mt-2">Select the prompts you want to add</p>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => toggleSelection(index)}
                    className={`p-4 border-2 cursor-pointer transition-all ${
                      selected.has(index)
                        ? 'border-white bg-[#0a0a0a]'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 flex items-center justify-center flex-shrink-0 transition-colors ${
                          selected.has(index)
                            ? 'bg-white text-black'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {selected.has(index) && <Check className="w-4 h-4" />}
                      </div>
                      <p className="text-white leading-relaxed">{suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800 p-6 bg-[#0a0a0a]">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  {selected.size} of {suggestions.length} selected
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleCloseModal}
                    disabled={adding}
                    className="px-4 py-2 border border-slate-700 text-white hover:bg-[#171717] disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={selected.size === 0 || adding}
                    className="px-4 py-2 bg-white text-black hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    {adding ? 'Adding...' : `Add ${selected.size} Prompt${selected.size !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
