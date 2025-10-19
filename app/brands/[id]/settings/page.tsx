'use client'

import { useParams } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import AutoAnalysisSettings from '@/components/brands/AutoAnalysisSettings'
import { Settings as SettingsIcon } from 'lucide-react'

export default function SettingsPage() {
  const params = useParams()
  const brandId = params.id as string

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                  <p className="text-sm text-slate-600">Manage your brand settings and preferences</p>
                </div>
              </div>
            </div>

            {/* Settings Sections */}
            <div className="space-y-6">
              {/* Auto-Analysis Settings */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Automatic Analysis</h2>
                <AutoAnalysisSettings brandId={brandId} />
              </div>

              {/* Future Settings Sections */}
              {/*
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Notifications</h2>
                <div className="bg-white rounded-md border border-slate-200 p-4">
                  <p className="text-sm text-slate-600">Notification settings coming soon...</p>
                </div>
              </div>
              */}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
