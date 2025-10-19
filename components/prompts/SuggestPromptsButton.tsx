'use client'

import { useState } from 'react'
import { Sparkles, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
        body: JSON.stringify({ brand_id: brandId, count: 5 }),
      })
      const data = await res.json()
      setSuggestions(data.suggestions || [])
      setSelected(new Set(data.suggestions.map((_: string, i: number) => i))) // Select all by default
      setShowModal(true)
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
      <Button
        onClick={handleSuggest}
        disabled={loading}
        size="lg"
        className="w-full bg-slate-900 hover:bg-slate-800"
      >
        <Sparkles className="w-5 h-5" />
        {loading ? 'Generating AI Suggestions...' : 'AI Suggest Prompts'}
      </Button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-slate-900 p-6">
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
              <p className="text-slate-200 mt-2">Select the prompts you want to add</p>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => toggleSelection(index)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
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
                      <p className="text-slate-700 leading-relaxed">{suggestion}</p>
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
                    {adding ? 'Adding...' : `Add ${selected.size} Prompt${selected.size !== 1 ? 's' : ''}`}
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
