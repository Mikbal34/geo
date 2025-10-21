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
        className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-slate-500 focus:border-slate-600 focus:ring-1 focus:ring-slate-600 outline-none"
        minLength={10}
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-white text-black px-4 py-3 hover:bg-slate-100 disabled:opacity-50 transition-colors"
      >
        Add
      </button>
    </form>
  )
}
