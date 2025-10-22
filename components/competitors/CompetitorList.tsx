'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Competitor } from '@/types/competitor'

type Theme = 'light' | 'dark'

interface CompetitorListProps {
  competitors: Competitor[]
  onDelete: () => void
  theme?: Theme
}

export default function CompetitorList({ competitors, onDelete, theme = 'dark' }: CompetitorListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const isDark = theme === 'dark'

  const handleDelete = async (competitorId: string) => {
    if (!confirm('Are you sure you want to delete this competitor?')) return

    setDeleting(competitorId)
    try {
      await fetch(`/api/competitors/delete/${competitorId}`, {
        method: 'DELETE',
      })
      onDelete()
    } catch (error) {
      console.error('Error deleting competitor:', error)
      alert('Failed to delete competitor')
    } finally {
      setDeleting(null)
    }
  }

  const itemClass = [
    'flex items-start justify-between gap-4 rounded-2xl border p-4 transition-colors',
    isDark ? 'border-white/10 bg-white/5 hover:border-white/20' : 'border-slate-200 bg-white hover:border-slate-300',
  ].join(' ')
  const nameClass = ['font-semibold', isDark ? 'text-white' : 'text-slate-900'].join(' ')
  const domainClass = ['text-sm', isDark ? 'text-slate-300' : 'text-slate-600'].join(' ')
  const regionClass = ['text-sm', isDark ? 'text-slate-400' : 'text-slate-500'].join(' ')
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
      {competitors.map((comp) => (
        <div key={comp.id} className={itemClass}>
          <div className="flex-1">
            <p className={nameClass}>{comp.competitor_name}</p>
            <p className={domainClass}>{comp.competitor_domain}</p>
            <p className={regionClass}>{comp.region}</p>
            {comp.is_ai_generated && (
              <span className={badgeClass}>
                AI Generated
              </span>
            )}
          </div>
          <button
            onClick={() => handleDelete(comp.id)}
            disabled={deleting === comp.id}
            className={removeButtonClass}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  )
}
