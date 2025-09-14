import React, { Suspense } from 'react'
import { SkeletonLoader } from './SkeletonLoader'

// Lazy load heavy components
const NotificationCenter = React.lazy(() => import('./NotificationCenter'))
const AdvancedFilters = React.lazy(() => import('./AdvancedFilters'))
const ActivityFeed = React.lazy(() => import('./ActivityFeed'))
const CardDetailsModal = React.lazy(() => import('./CardDetailsModal'))
const SearchModal = React.lazy(() => import('./SearchModal'))

// Loading fallbacks
const NotificationSkeleton = () => (
  <div className="fixed inset-0 z-50 overflow-hidden">
    <div className="absolute inset-0 bg-black bg-opacity-50" />
    <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl p-4">
      <SkeletonLoader width="200px" height="1.5rem" className="mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-3 border rounded">
            <SkeletonLoader width="100%" height="1rem" className="mb-2" />
            <SkeletonLoader width="80%" height="0.875rem" />
          </div>
        ))}
      </div>
    </div>
  </div>
)

const FiltersSkeleton = () => (
  <div className="fixed inset-0 z-50 overflow-hidden">
    <div className="absolute inset-0 bg-black bg-opacity-50" />
    <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl p-4">
      <SkeletonLoader width="200px" height="1.5rem" className="mb-4" />
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <SkeletonLoader width="100px" height="1rem" className="mb-2" />
            <SkeletonLoader width="100%" height="2.5rem" />
          </div>
        ))}
      </div>
    </div>
  </div>
)

const ActivityFeedSkeleton = () => (
  <div className="w-96 bg-white border-l border-gray-200 p-4">
    <SkeletonLoader width="150px" height="1.5rem" className="mb-4" />
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-start space-x-3">
          <SkeletonLoader variant="circular" width={32} height={32} />
          <div className="flex-1">
            <SkeletonLoader width="100%" height="1rem" className="mb-1" />
            <SkeletonLoader width="70%" height="0.875rem" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

const ModalSkeleton = () => (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <SkeletonLoader width="300px" height="2rem" className="mb-4" />
          <div className="space-y-4">
            <SkeletonLoader width="100%" height="6rem" />
            <SkeletonLoader width="100%" height="3rem" />
            <SkeletonLoader width="100%" height="4rem" />
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Optimized lazy wrapper components
export const LazyNotificationCenter = (props: any) => (
  <Suspense fallback={<NotificationSkeleton />}>
    <NotificationCenter {...props} />
  </Suspense>
)

export const LazyAdvancedFilters = (props: any) => (
  <Suspense fallback={<FiltersSkeleton />}>
    <AdvancedFilters {...props} />
  </Suspense>
)

export const LazyActivityFeed = (props: any) => (
  <Suspense fallback={<ActivityFeedSkeleton />}>
    <ActivityFeed {...props} />
  </Suspense>
)

export const LazyCardDetailsModal = (props: any) => (
  <Suspense fallback={<ModalSkeleton />}>
    <CardDetailsModal {...props} />
  </Suspense>
)

export const LazySearchModal = (props: any) => (
  <Suspense fallback={<ModalSkeleton />}>
    <SearchModal {...props} />
  </Suspense>
)
