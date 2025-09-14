import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { X, Clock, User, MessageCircle, Tag, Move, Plus } from 'lucide-react'
import { format } from 'date-fns'
import LoadingSpinner from './LoadingSpinner'

interface Activity {
  id: string
  type: string
  data: any
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  card?: {
    id: string
    title: string
  }
}

interface ActivitySidebarProps {
  isOpen: boolean
  onClose: () => void
  boardId: string
}

export default function ActivitySidebar({ isOpen, onClose, boardId }: ActivitySidebarProps) {
  const [page, setPage] = useState(0)
  const limit = 20

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['activities', boardId, page],
    queryFn: async () => {
      const response = await api.get(`/activities/board/${boardId}?limit=${limit}&offset=${page * limit}`)
      return response.data.data.activities as Activity[]
    },
    enabled: isOpen
  })

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'card_created':
        return <Plus className="w-4 h-4 text-green-600" />
      case 'card_moved':
        return <Move className="w-4 h-4 text-blue-600" />
      case 'card_updated':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'comment_added':
        return <MessageCircle className="w-4 h-4 text-purple-600" />
      case 'label_added':
      case 'label_removed':
        return <Tag className="w-4 h-4 text-orange-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getActivityText = (activity: Activity) => {
    const { type, data, user } = activity
    const userName = user.name

    switch (type) {
      case 'card_created':
        return `${userName} created card "${data.cardTitle}"`
      case 'card_moved':
        return `${userName} moved "${data.cardTitle}" from "${data.fromListTitle}" to "${data.toListTitle}"`
      case 'card_updated':
        return `${userName} updated "${data.cardTitle}"`
      case 'comment_added':
        return `${userName} commented on "${data.cardTitle}"`
      case 'label_added':
        return `${userName} added label "${data.labelName}" to "${data.cardTitle}"`
      case 'label_removed':
        return `${userName} removed label "${data.labelName}" from "${data.cardTitle}"`
      default:
        return `${userName} performed an action`
    }
  }

  const loadMore = () => {
    setPage(prev => prev + 1)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Activity</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto h-full pb-20">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : data && data.length > 0 ? (
            <div className="p-4 space-y-4">
              {data.map((activity) => (
                <div key={activity.id} className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {getActivityText(activity)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
              
              {isFetching && (
                <div className="flex justify-center p-4">
                  <LoadingSpinner />
                </div>
              )}
              
              <button
                onClick={loadMore}
                disabled={isFetching}
                className="w-full btn btn-secondary btn-sm"
              >
                {isFetching ? 'Loading...' : 'Load More'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
              <p className="text-gray-500">
                Activity will appear here as team members work on the board.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
