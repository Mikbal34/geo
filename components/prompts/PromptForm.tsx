'use client'

import { useState } from 'react'

export default function PromptForm({ brandId, onAdded }: { brandId: string, onAdded: () => void }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a prompt..."
        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:border-slate-900 focus:ring-2 focus:ring-slate-200 outline-none"
        minLength={10}
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50"
      >
        Add
      </button>
    </form>
  )
}
