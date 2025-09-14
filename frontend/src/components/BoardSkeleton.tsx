import { SkeletonLoader } from './SkeletonLoader'

export function BoardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <SkeletonLoader variant="circular" width={32} height={32} />
              <div>
                <SkeletonLoader width="200px" height="1.5rem" className="mb-1" />
                <SkeletonLoader width="300px" height="1rem" />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <SkeletonLoader variant="circular" width={32} height={32} />
              <SkeletonLoader variant="circular" width={32} height={32} />
              <SkeletonLoader variant="circular" width={32} height={32} />
              <SkeletonLoader variant="circular" width={32} height={32} />
              <div className="flex items-center space-x-1">
                <SkeletonLoader variant="circular" width={32} height={32} />
                <SkeletonLoader variant="circular" width={32} height={32} />
                <SkeletonLoader variant="circular" width={32} height={32} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-x-auto">
          <div className="p-4 sm:p-6">
            <div className="flex space-x-6 min-h-96">
              {/* List Skeletons */}
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex-shrink-0 w-72">
                  <div className="bg-gray-100 rounded-lg p-3">
                    {/* List Header */}
                    <div className="flex items-center justify-between mb-3">
                      <SkeletonLoader width="120px" height="1.25rem" />
                      <SkeletonLoader variant="circular" width={20} height={20} />
                    </div>

                    {/* Card Skeletons */}
                    <div className="space-y-2">
                      {Array.from({ length: 3 + Math.floor(Math.random() * 3) }).map((_, cardIndex) => (
                        <div key={cardIndex} className="bg-white rounded-md p-3 shadow-sm">
                          <SkeletonLoader width="100%" height="1rem" className="mb-2" />
                          <SkeletonLoader width="80%" height="0.875rem" className="mb-3" />
                          
                          <div className="flex items-center justify-between">
                            <div className="flex space-x-1">
                              <SkeletonLoader width={16} height={16} variant="circular" />
                              <SkeletonLoader width={16} height={16} variant="circular" />
                            </div>
                            <SkeletonLoader variant="circular" width={24} height={24} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Card Button */}
                    <div className="mt-2">
                      <SkeletonLoader width="100%" height="2rem" />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add List Button Skeleton */}
              <div className="flex-shrink-0 w-72">
                <SkeletonLoader width="100%" height="3rem" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export function ListSkeleton() {
  return (
    <div className="bg-gray-100 rounded-lg p-3 w-72">
      <div className="flex items-center justify-between mb-3">
        <SkeletonLoader width="120px" height="1.25rem" />
        <SkeletonLoader variant="circular" width={20} height={20} />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-white rounded-md p-3 shadow-sm">
            <SkeletonLoader width="100%" height="1rem" className="mb-2" />
            <SkeletonLoader width="80%" height="0.875rem" />
          </div>
        ))}
      </div>

      <div className="mt-2">
        <SkeletonLoader width="100%" height="2rem" />
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-md p-3 shadow-sm">
      <SkeletonLoader width="100%" height="1rem" className="mb-2" />
      <SkeletonLoader width="80%" height="0.875rem" className="mb-3" />
      
      <div className="flex items-center justify-between">
        <div className="flex space-x-1">
          <SkeletonLoader width={16} height={16} variant="circular" />
          <SkeletonLoader width={16} height={16} variant="circular" />
        </div>
        <SkeletonLoader variant="circular" width={24} height={24} />
      </div>
    </div>
  )
}
