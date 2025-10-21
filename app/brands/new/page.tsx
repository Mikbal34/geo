import BrandForm from '@/components/brand/BrandForm'
import Navigation from '@/components/layout/Navigation'
import Link from 'next/link'

export default function NewBrandPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 group transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>

          {/* Progress Steps */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-white flex items-center justify-center text-black text-xs font-bold">
                1
              </div>
              <span className="text-xs font-medium text-white">Brand Info</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold">
                2
              </div>
              <span className="text-xs text-slate-400">Prompts</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold">
                3
              </div>
              <span className="text-xs text-slate-400">Competitors</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold">
                4
              </div>
              <span className="text-xs text-slate-400">Analysis</span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-6">
            <div className="inline-block mb-2">
              <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">
                Step 1 of 4
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Create Your Brand Profile
            </h1>
            <p className="text-sm text-slate-400">
              Let's start by setting up your brand's basic information. This will help us provide more accurate analysis.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-[#171717] shadow-xl border border-slate-800 overflow-hidden">
            <div className="p-8 md:p-10">
              <BrandForm />
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
