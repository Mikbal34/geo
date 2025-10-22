'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Prompt } from '@/types/prompt'

type Theme = 'light' | 'dark'

interface PromptListProps {
  prompts: Prompt[]
  onDelete: () => void
  theme?: Theme
}

export default function PromptList({ prompts, onDelete, theme = 'dark' }: PromptListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const isDark = theme === 'dark'

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

  const itemClass = [
    'flex items-start justify-between gap-4 rounded-2xl border p-4 transition-colors',
    isDark ? 'border-white/10 bg-white/5 hover:border-white/20' : 'border-slate-200 bg-white hover:border-slate-300',
  ].join(' ')
  const promptTextClass = ['leading-relaxed', isDark ? 'text-white' : 'text-slate-800'].join(' ')
  const badgeClass = [
    'mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium',
    isDark ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-600',
  ].join(' ')
  const removeButtonClass = [
    'flex-shrink-0 rounded-full p-2 transition-colors focus:outline-none focus:ring-2',
    isDark ? 'text-slate-300 hover:text-red-300 focus:ring-red-400/30' : 'text-slate-500 hover:text-red-500 focus:ring-red-500/40',
  ].join(' ')

  return (
    <div className="space-y-3">
      {prompts.map((prompt) => (
        <div key={prompt.id} className={itemClass}>
          <div className="flex-1">
            <p className={promptTextClass}>{prompt.prompt_text}</p>
            {prompt.is_ai_generated && (
              <span className={badgeClass}>
                AI Generated
              </span>
            )}
          </div>
          <button
            onClick={() => handleDelete(prompt.id)}
            disabled={deleting === prompt.id}
            className={removeButtonClass}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  )
}
