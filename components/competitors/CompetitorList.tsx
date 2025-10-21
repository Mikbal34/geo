'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Competitor } from '@/types/competitor'

export default function CompetitorList({ competitors, onDelete }: { competitors: Competitor[], onDelete: () => void }) {
  const [deleting, setDeleting] = useState<string | null>(null)

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

  return (
    <div className="space-y-2">
      {competitors.map((comp) => (
        <div key={comp.id} className="border border-slate-700 p-3 flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-white font-medium">{comp.competitor_name}</p>
            <p className="text-sm text-slate-400">{comp.competitor_domain}</p>
            <p className="text-sm text-slate-500">{comp.region}</p>
            {comp.is_ai_generated && (
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 mt-2 inline-block">
                AI Generated
              </span>
            )}
          </div>
          <button
            onClick={() => handleDelete(comp.id)}
            disabled={deleting === comp.id}
            className="text-white hover:text-red-400 disabled:opacity-50 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  )
}
