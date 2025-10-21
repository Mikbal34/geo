'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import CompetitorList from '@/components/competitors/CompetitorList'
import CompetitorForm from '@/components/competitors/CompetitorForm'
import SuggestCompetitorsButton from '@/components/competitors/SuggestCompetitorsButton'
import { Competitor } from '@/types/competitor'
import { Users, Sparkles, ArrowRight } from 'lucide-react'

export default function CompetitorsPage() {
  const params = useParams()
  const router = useRouter()
  const brandId = params.id as string
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCompetitors = async () => {
    const res = await fetch(`/api/competitors/${brandId}`)
    const data = await res.json()
    setCompetitors(data.competitors)
    setLoading(false)
  }

  useEffect(() => {
    fetchCompetitors()
  }, [brandId])

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-black py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-6 h-6 bg-slate-800 flex items-center justify-center text-white text-xs font-bold">
                ✓
              </div>
              <span className="text-xs text-slate-400">Brand Info</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-700" />
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-6 h-6 bg-slate-800 flex items-center justify-center text-white text-xs font-bold">
                ✓
              </div>
              <span className="text-xs text-slate-400">Prompts</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-700" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white flex items-center justify-center text-black text-xs font-bold">
                3
              </div>
              <span className="text-xs font-medium text-white">Competitors</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-700" />
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-6 h-6 bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold">
                4
              </div>
              <span className="text-xs text-slate-400">Analysis</span>
            </div>
          </div>

          {/* Add Competitors Section */}
          <div className="bg-[#171717] shadow-xl border border-slate-800 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-4 h-4 text-white" />
              <h2 className="text-xl font-bold text-white">Add Competitors</h2>
            </div>
            <div className="space-y-6">
              <CompetitorForm brandId={brandId} onAdded={fetchCompetitors} />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#171717] px-4 text-sm text-slate-400">OR</span>
                </div>
              </div>
              <SuggestCompetitorsButton brandId={brandId} onSuggested={fetchCompetitors} />
            </div>
          </div>

          {/* Competitors List */}
          <div className="bg-[#171717] shadow-xl border border-slate-800 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                Your Competitors ({competitors.length})
              </h2>
              {competitors.length >= 2 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-900/20 border border-green-800">
                  <div className="w-2 h-2 bg-green-500" />
                  <span className="text-sm font-medium text-green-400">Ready</span>
                </div>
              )}
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="inline-block animate-spin h-10 w-10 border-4 border-slate-700 border-t-white" />
              </div>
            ) : competitors.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">No competitors yet</h3>
                <p className="text-slate-400">Add your first competitor above to get started!</p>
              </div>
            ) : (
              <CompetitorList competitors={competitors} onDelete={fetchCompetitors} />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={() => router.push(`/brands/${brandId}/analyze`)}
              className="group flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium bg-white text-black hover:bg-slate-100 transition-colors"
            >
              Next: Run Analysis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
