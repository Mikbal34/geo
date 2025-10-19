'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import PromptList from '@/components/prompts/PromptList'
import PromptForm from '@/components/prompts/PromptForm'
import SuggestPromptsButton from '@/components/prompts/SuggestPromptsButton'
import { Prompt } from '@/types/prompt'
import { MessageSquare, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="inline-block mb-4">
              <span className="bg-slate-900 text-white text-sm font-bold tracking-wider uppercase px-3 py-1 rounded">
                Step 2 of 4
              </span>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Brand Prompts
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Add brand context to power your AI analysis
                </p>
              </div>
            </div>
          </div>

          {/* Add Prompts Section */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-4 h-4 text-slate-900" />
              <h2 className="text-xl font-bold text-slate-900">Add Prompts</h2>
            </div>
            <div className="space-y-6">
              <PromptForm brandId={brandId} onAdded={fetchPrompts} />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-slate-500">OR</span>
                </div>
              </div>
              <SuggestPromptsButton brandId={brandId} onSuggested={fetchPrompts} />
            </div>
          </div>

          {/* Prompts List */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Your Prompts ({prompts.length})
              </h2>
              {prompts.length >= 3 && (
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
            ) : prompts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-slate-900" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">No prompts yet</h3>
                <p className="text-slate-600">Add your first prompt above to get started!</p>
              </div>
            ) : (
              <PromptList prompts={prompts} />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => router.push(`/brands/${brandId}/dashboard`)}
              className="px-4 py-2.5 text-sm font-medium rounded-lg"
            >
              ← Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              {prompts.length > 0 && (
                <Button
                  onClick={() => router.push(`/brands/${brandId}/analyze`)}
                  className="group px-5 py-2.5 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Run Analysis Now
                </Button>
              )}
              <Button
                onClick={() => router.push(`/brands/${brandId}/competitors`)}
                className="group px-4 py-2.5 text-sm font-medium rounded-lg"
              >
                Next: Add Competitors
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-colors" />
              </Button>
            </div>
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
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                2
              </div>
              <span className="text-xs font-medium text-slate-900">Prompts</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-200" />
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold">
                3
              </div>
              <span className="text-xs text-slate-400">Competitors</span>
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
