'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Prompt } from '@/types/prompt'

export default function PromptList({ prompts, onDelete }: { prompts: Prompt[], onDelete: () => void }) {
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return

    setDeleting(promptId)
    try {
      await fetch(`/api/prompts/delete/${promptId}`, {
        method: 'DELETE',
      })
      onDelete()
    } catch (error) {
      console.error('Error deleting prompt:', error)
      alert('Failed to delete prompt')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-2">
      {prompts.map((prompt) => (
        <div key={prompt.id} className="border border-slate-700 p-3 flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-white">{prompt.prompt_text}</p>
            {prompt.is_ai_generated && (
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 mt-2 inline-block">
                AI Generated
              </span>
            )}
          </div>
          <button
            onClick={() => handleDelete(prompt.id)}
            disabled={deleting === prompt.id}
            className="text-white hover:text-red-400 disabled:opacity-50 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  )
}
