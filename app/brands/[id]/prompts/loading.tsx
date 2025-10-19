import LoadingSpinner from '@/components/shared/LoadingSpinner'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-8" />

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            <div className="h-24 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 bg-gray-100 rounded animate-pulse w-48" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
          <LoadingSpinner text="Loading prompts..." />
        </div>
      </div>
    </div>
  )
}
