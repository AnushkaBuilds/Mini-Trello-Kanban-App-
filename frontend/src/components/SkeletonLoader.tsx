interface SkeletonLoaderProps {
  className?: string
  variant?: 'rectangular' | 'circular' | 'text'
  width?: string | number
  height?: string | number
  count?: number
}

export function SkeletonLoader({ 
  className = '', 
  variant = 'rectangular',
  width = '100%',
  height = '1rem',
  count = 1
}: SkeletonLoaderProps) {
  const baseClasses = "animate-shimmer bg-gray-200 rounded"
  
  const variantClasses = {
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    text: 'rounded h-4'
  }

  const skeletonStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  if (count === 1) {
    return (
      <div 
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        style={skeletonStyle}
      />
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index}
          className={`${baseClasses} ${variantClasses[variant]}`}
          style={skeletonStyle}
        />
      ))}
    </div>
  )
}

export function BoardCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <SkeletonLoader width="60%" height="1.5rem" />
        <SkeletonLoader variant="circular" width={20} height={20} />
      </div>
      
      <SkeletonLoader count={2} height="1rem" className="mb-4" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <SkeletonLoader variant="circular" width={16} height={16} />
            <SkeletonLoader width="2rem" height="1rem" />
          </div>
          <div className="flex items-center space-x-1">
            <SkeletonLoader variant="circular" width={16} height={16} />
            <SkeletonLoader width="2rem" height="1rem" />
          </div>
        </div>
        <div className="flex -space-x-2">
          <SkeletonLoader variant="circular" width={32} height={32} />
          <SkeletonLoader variant="circular" width={32} height={32} />
        </div>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <SkeletonLoader width="150px" height="1.5rem" />
            </div>
            <div className="flex items-center space-x-4">
              <SkeletonLoader width="200px" height="2.5rem" />
              <SkeletonLoader variant="circular" width={40} height={40} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <SkeletonLoader width="200px" height="2rem" className="mb-2" />
          <SkeletonLoader width="300px" height="1rem" />
        </div>

        {/* Boards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <BoardCardSkeleton key={index} />
          ))}
        </div>
      </main>
    </div>
  )
}
