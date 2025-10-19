'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import CompetitorList from '@/components/competitors/CompetitorList'
import CompetitorForm from '@/components/competitors/CompetitorForm'
import SuggestCompetitorsButton from '@/components/competitors/SuggestCompetitorsButton'
import { Competitor } from '@/types/competitor'
import { Users, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="inline-block mb-4">
              <span className="bg-slate-900 text-white text-sm font-bold tracking-wider uppercase px-3 py-1 rounded">
                Step 3 of 4
              </span>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Competitors
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Define your competitive landscape
                </p>
              </div>
            </div>
          </div>

          {/* Add Competitors Section */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-4 h-4 text-slate-900" />
              <h2 className="text-xl font-bold text-slate-900">Add Competitors</h2>
            </div>
            <div className="space-y-6">
              <CompetitorForm brandId={brandId} onAdded={fetchCompetitors} />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-slate-500">OR</span>
                </div>
              </div>
              <SuggestCompetitorsButton brandId={brandId} onSuggested={fetchCompetitors} />
            </div>
          </div>

          {/* Competitors List */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Your Competitors ({competitors.length})
              </h2>
              {competitors.length >= 2 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-green-700">Ready</span>
                </div>
              )}
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-slate-900" />
              </div>
            ) : competitors.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-slate-900" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">No competitors yet</h3>
                <p className="text-slate-600">Add your first competitor above to get started!</p>
              </div>
            ) : (
              <CompetitorList competitors={competitors} />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => router.push(`/brands/${brandId}/prompts`)}
              className="px-4 py-2.5 text-sm font-medium rounded-lg"
            >
              ← Back to Prompts
            </Button>
            <Button
              onClick={() => router.push(`/brands/${brandId}/analyze`)}
              className="group px-4 py-2.5 text-sm font-medium rounded-lg"
            >
              Next: Run Analysis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-colors" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                ✓
              </div>
              <span className="text-xs text-slate-400">Brand Info</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-900" />
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                ✓
              </div>
              <span className="text-xs text-slate-400">Prompts</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-900" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                3
              </div>
              <span className="text-xs font-medium text-slate-900">Competitors</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-200" />
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold">
                4
              </div>
              <span className="text-xs text-slate-400">Analysis</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
