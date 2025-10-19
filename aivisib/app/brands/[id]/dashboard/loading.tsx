import LoadingSpinner from '@/components/shared/LoadingSpinner'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="flex gap-8">
              <div className="h-24 w-32 bg-gray-100 rounded animate-pulse" />
              <div className="h-24 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow h-96">
              <LoadingSpinner size="large" text="Loading charts..." />
            </div>
            <div className="bg-white p-6 rounded-lg shadow h-96">
              <div className="h-full bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
