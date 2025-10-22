'use client'

import { useState } from 'react'
import { Sparkles, Check, X } from 'lucide-react'

type Theme = 'light' | 'dark'

interface SuggestPromptsButtonProps {
  brandId: string
  onSuggested: () => void
  theme?: Theme
}

export default function SuggestPromptsButton({ brandId, onSuggested, theme = 'dark' }: SuggestPromptsButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [adding, setAdding] = useState(false)
  const isDark = theme === 'dark'

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

  const buttonClass = [
    'w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
    isDark
      ? 'bg-white text-black hover:bg-slate-100 focus:ring-white/70 focus:ring-offset-slate-900'
      : 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900 focus:ring-offset-white',
  ].join(' ')

  const overlayClass = 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4'
  const modalClass = [
    'w-full max-w-3xl overflow-hidden rounded-3xl border shadow-2xl transition-colors',
    isDark ? 'border-white/10 bg-[#0d0d10] text-white' : 'border-slate-200 bg-white text-slate-900',
  ].join(' ')
  const modalHeaderClass = [
    'border-b px-6 py-5 transition-colors',
    isDark ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-slate-50',
  ].join(' ')
  const modalBodyClass = 'max-h-[50vh] overflow-y-auto px-6 py-5'
  const modalFooterClass = [
    'border-t px-6 py-5 flex items-center justify-between transition-colors',
    isDark ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-slate-50',
  ].join(' ')
  const cardBaseClass = [
    'cursor-pointer rounded-2xl border-2 p-4 transition-all',
    isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300',
  ]
  const cardSelectedClass = isDark ? 'border-white bg-white/5' : 'border-slate-900 bg-slate-50'
  const cardUnselectedClass = isDark ? 'bg-transparent' : 'bg-white'
  const selectionBadgeClass = (active: boolean) =>
    [
      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors',
      active
        ? isDark
          ? 'bg-white text-black'
          : 'bg-slate-900 text-white'
        : isDark
          ? 'bg-white/10 text-slate-400'
          : 'bg-slate-100 text-slate-500',
    ].join(' ')
  const cancelButtonClass = [
    'rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 disabled:opacity-60',
    isDark
      ? 'border border-white/10 text-slate-200 hover:bg-white/10 focus:ring-white/20'
      : 'border border-slate-200 text-slate-600 hover:bg-slate-100 focus:ring-slate-200',
  ].join(' ')
  const addButtonClass = [
    'rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
    isDark
      ? 'bg-white text-black hover:bg-slate-100 focus:ring-white/70 focus:ring-offset-slate-900'
      : 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900 focus:ring-offset-white',
  ].join(' ')
  const modalDescriptionClass = ['mt-2 text-sm', isDark ? 'text-slate-400' : 'text-slate-500'].join(' ')
  const suggestionTextClass = ['leading-relaxed', isDark ? 'text-slate-200' : 'text-slate-700'].join(' ')
  const footerTextClass = ['text-sm', isDark ? 'text-slate-400' : 'text-slate-500'].join(' ')

  return (
    <>
      <button
        onClick={handleSuggest}
        disabled={loading}
        className={buttonClass}
      >
        <Sparkles className="w-5 h-5" />
        {loading ? 'Generating AI Suggestions...' : 'AI Suggest Prompts'}
      </button>

      {/* Modal */}
      {showModal && (
        <div className={overlayClass}>
          <div className={modalClass}>
            <div className={modalHeaderClass}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6" />
                  <h2 className="text-2xl font-semibold">AI Suggested Prompts</h2>
                </div>
                <button onClick={handleCloseModal} className={isDark ? 'text-slate-300 hover:text-white' : 'text-slate-400 hover:text-slate-600'}>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className={modalDescriptionClass}>Select the prompts you want to add</p>
            </div>

            <div className={modalBodyClass}>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => {
                  const active = selected.has(index)
                  return (
                    <div
                      key={index}
                      onClick={() => toggleSelection(index)}
                      className={[...cardBaseClass, active ? cardSelectedClass : cardUnselectedClass].join(' ')}
                    >
                      <div className="flex items-start gap-3">
                        <div className={selectionBadgeClass(active)}>
                          {active && <Check className="h-4 w-4" />}
                        </div>
                        <p className={suggestionTextClass}>{suggestion}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className={modalFooterClass}>
              <p className={footerTextClass}>
                {selected.size} of {suggestions.length} selected
              </p>
              <div className="flex gap-3">
                <button onClick={handleCloseModal} disabled={adding} className={cancelButtonClass}>
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={selected.size === 0 || adding}
                  className={addButtonClass}
                >
                  {adding ? 'Adding...' : `Add ${selected.size} Prompt${selected.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
