'use client'

import { useState, useEffect } from 'react'
import { Clock, Settings, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AutoAnalysisSettingsProps {
  brandId: string
}

const PRESET_INTERVALS = [
  { label: '5 minutes', minutes: 5 },
  { label: '4 hours', minutes: 240 },
  { label: '8 hours', minutes: 480 },
  { label: '12 hours', minutes: 720 },
  { label: '24 hours', minutes: 1440 },
]

export default function AutoAnalysisSettings({ brandId }: AutoAnalysisSettingsProps) {
  const [enabled, setEnabled] = useState(true)
  const [interval, setInterval] = useState(1440)
  const [customMode, setCustomMode] = useState(false)
  const [customValue, setCustomValue] = useState(1)
  const [customUnit, setCustomUnit] = useState<'minutes' | 'hours' | 'days'>('hours')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [nextRun, setNextRun] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Fetch current settings
  useEffect(() => {
    fetchSettings()
  }, [brandId])

  // Update countdown timer every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 10000) as any

    return () => clearInterval(timer)
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/brands/${brandId}/auto-analysis-settings`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      const data = await res.json()

      setEnabled(data.auto_analysis_enabled ?? true)
      setInterval(data.auto_analysis_interval ?? 1440)
      setNextRun(data.next_analysis_at)

      // Check if interval is a preset value
      const isPreset = PRESET_INTERVALS.some(p => p.minutes === data.auto_analysis_interval)
      setCustomMode(!isPreset && data.auto_analysis_interval !== 1440)

      if (!isPreset) {
        // Convert to best unit
        const minutes = data.auto_analysis_interval || 1440
        if (minutes % 1440 === 0) {
          setCustomValue(minutes / 1440)
          setCustomUnit('days')
        } else if (minutes % 60 === 0) {
          setCustomValue(minutes / 60)
          setCustomUnit('hours')
        } else {
          setCustomValue(minutes)
          setCustomUnit('minutes')
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const finalInterval = customMode
        ? customValue * (customUnit === 'days' ? 1440 : customUnit === 'hours' ? 60 : 1)
        : interval

      const res = await fetch(`/api/brands/${brandId}/auto-analysis-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auto_analysis_enabled: enabled,
          auto_analysis_interval: finalInterval,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save settings')
      }

      console.log('Saved settings response:', data)
      alert('✅ Auto-analysis settings saved successfully!')
      await fetchSettings()
    } catch (error) {
      console.error('Error saving settings:', error)
      alert(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const getNextRunTime = () => {
    if (!enabled) return 'Disabled'
    if (!nextRun) return 'Not scheduled'

    const nextRunDate = new Date(nextRun)
    if (nextRunDate <= currentTime) return 'Soon'

    const diffMs = nextRunDate.getTime() - currentTime.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h ${diffMins % 60}m`
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`
    return `${diffMins}m`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-md border border-slate-200 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-10 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-md border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-600" />
          Auto-Analysis Settings
        </h3>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-700">Enable automatic analysis</span>
        </label>
      </div>

      {enabled && (
        <>
          {/* Preset Intervals */}
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-600 mb-2 block">Quick Select</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_INTERVALS.map((preset) => (
                <button
                  key={preset.minutes}
                  onClick={() => {
                    setInterval(preset.minutes)
                    setCustomMode(false)
                  }}
                  className={`px-3 py-2 text-xs font-medium rounded border transition-colors ${
                    !customMode && interval === preset.minutes
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <button
                onClick={() => setCustomMode(true)}
                className={`px-3 py-2 text-xs font-medium rounded border transition-colors ${
                  customMode
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Custom Interval Input */}
          {customMode && (
            <div className="mb-4">
              <label className="text-xs font-medium text-slate-600 mb-2 block">Custom Interval</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={customValue}
                  onChange={(e) => setCustomValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Value"
                />
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value as 'minutes' | 'hours' | 'days')}
                  className="px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
              {customMode && customValue * (customUnit === 'days' ? 1440 : customUnit === 'hours' ? 60 : 1) < 5 && (
                <p className="text-xs text-red-600 mt-1">Minimum interval is 5 minutes</p>
              )}
              {customMode && customValue * (customUnit === 'days' ? 1440 : customUnit === 'hours' ? 60 : 1) > 10080 && (
                <p className="text-xs text-red-600 mt-1">Maximum interval is 7 days</p>
              )}
            </div>
          )}

          {/* Status */}
          <div className="mb-4 p-3 bg-slate-50 rounded border border-slate-200">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-indigo-600" />
              <span className="text-xs text-slate-600">Next Auto-Analysis:</span>
              <span className="text-xs font-semibold text-indigo-600">{getNextRunTime()}</span>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving || (customMode && (
              customValue * (customUnit === 'days' ? 1440 : customUnit === 'hours' ? 60 : 1) < 5 ||
              customValue * (customUnit === 'days' ? 1440 : customUnit === 'hours' ? 60 : 1) > 10080
            ))}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            size="sm"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </>
      )}

      {!enabled && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded">
          <p className="text-xs text-amber-800">
            Automatic analysis is currently disabled. Enable it to schedule regular brand analysis.
          </p>
        </div>
      )}
    </div>
  )
}
