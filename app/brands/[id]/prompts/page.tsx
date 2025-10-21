'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import PromptList from '@/components/prompts/PromptList'
import PromptForm from '@/components/prompts/PromptForm'
import SuggestPromptsButton from '@/components/prompts/SuggestPromptsButton'
import { Prompt } from '@/types/prompt'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function PromptsPage() {
  const params = useParams()
  const router = useRouter()
  const brandId = params.id as string
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPrompts = async () => {
    const res = await fetch(`/api/prompts/${brandId}`)
    const data = await res.json()
    setPrompts(data.prompts)
    setLoading(false)
  }

  useEffect(() => {
    fetchPrompts()
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
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white flex items-center justify-center text-black text-xs font-bold">
                2
              </div>
              <span className="text-xs font-medium text-white">Prompts</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-700" />
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-6 h-6 bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold">
                3
              </div>
              <span className="text-xs text-slate-400">Competitors</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-700" />
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-6 h-6 bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold">
                4
              </div>
              <span className="text-xs text-slate-400">Analysis</span>
            </div>
          </div>

          {/* Add Prompts Section */}
          <div className="bg-[#171717] shadow-xl border border-slate-800 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-4 h-4 text-white" />
              <h2 className="text-xl font-bold text-white">Add Prompts</h2>
            </div>
            <div className="space-y-6">
              <PromptForm brandId={brandId} onAdded={fetchPrompts} />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#171717] px-4 text-sm text-slate-400">OR</span>
                </div>
              </div>
              <SuggestPromptsButton brandId={brandId} onSuggested={fetchPrompts} />
            </div>
          </div>

          {/* Prompts List */}
          <div className="bg-[#171717] shadow-xl border border-slate-800 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                Your Prompts ({prompts.length})
              </h2>
              {prompts.length >= 3 && (
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
            ) : prompts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">No prompts yet</h3>
                <p className="text-slate-400">Add your first prompt above to get started!</p>
              </div>
            ) : (
              <PromptList prompts={prompts} onDelete={fetchPrompts} />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={() => router.push(`/brands/${brandId}/competitors`)}
              className="group flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium bg-white text-black hover:bg-slate-100 transition-colors"
            >
              Next: Add Competitors
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
