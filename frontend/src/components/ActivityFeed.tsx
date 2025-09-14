import { useState, useEffect } from 'react'
import { Clock, User, Move, Plus, Edit, Trash2, MessageCircle, Paperclip, CalendarDays, Tag, Filter, RefreshCw } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  type: 'card_created' | 'card_moved' | 'card_updated' | 'comment_added' | 'file_attached' | 'due_date_set' | 'label_added' | 'member_assigned'
  user: {
    id: string
    name: string
    email: string
  }
  card?: {
    id: string
    title: string
  }
  details: string
  metadata?: any
  createdAt: string
}

interface ActivityFeedProps {
  boardId?: string
  cardId?: string
  limit?: number
  showFilters?: boolean
  className?: string
}

const ACTIVITY_TYPES = [
  { value: '', label: 'All Activities' },
  { value: 'card_created', label: 'Card Created' },
  { value: 'card_moved', label: 'Card Moved' },
  { value: 'card_updated', label: 'Card Updated' },
  { value: 'comment_added', label: 'Comments' },
  { value: 'file_attached', label: 'File Attachments' },
  { value: 'due_date_set', label: 'Due Dates' },
  { value: 'label_added', label: 'Labels' },
  { value: 'member_assigned', label: 'Assignments' }
]

export default function ActivityFeed({ 
  boardId, 
  cardId, 
  limit = 50, 
  showFilters = true,
  className = '' 
}: ActivityFeedProps) {
  const [filter, setFilter] = useState('')
  const [timeFilter, setTimeFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('')
  const queryClient = useQueryClient()

  // Fetch activities
  const { data: activities, isLoading, error, refetch } = useQuery({
    queryKey: ['activities', boardId, cardId, filter, timeFilter, userFilter],
    queryFn: async () => {
      const endpoint = cardId 
        ? `/cards/${cardId}/activities`
        : `/boards/${boardId}/activities`
      
      const params = new URLSearchParams()
      if (filter) params.append('type', filter)
      if (timeFilter !== 'all') params.append('timeFilter', timeFilter)
      if (userFilter) params.append('userId', userFilter)
      params.append('limit', limit.toString())

      const response = await api.get(`${endpoint}?${params.toString()}`)
      return response.data.data.activities || []
    },
    enabled: !!(boardId || cardId)
  })

  // Fetch unique users for filter
  const { data: users } = useQuery({
    queryKey: ['activities-users', boardId],
    queryFn: async () => {
      const response = await api.get(`/boards/${boardId}/members`)
      return response.data.data.members || []
    },
    enabled: !!boardId && showFilters
  })

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'card_created':
        return <Plus className="w-4 h-4 text-green-500" />
      case 'card_moved':
        return <Move className="w-4 h-4 text-blue-500" />
      case 'card_updated':
        return <Edit className="w-4 h-4 text-yellow-500" />
      case 'comment_added':
        return <MessageCircle className="w-4 h-4 text-purple-500" />
      case 'file_attached':
        return <Paperclip className="w-4 h-4 text-orange-500" />
      case 'due_date_set':
        return <CalendarDays className="w-4 h-4 text-red-500" />
      case 'label_added':
        return <Tag className="w-4 h-4 text-pink-500" />
      case 'member_assigned':
        return <User className="w-4 h-4 text-indigo-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const formatActivityText = (activity: Activity) => {
    const cardTitle = activity.card?.title ? `"${activity.card.title}"` : 'a card'
    
    switch (activity.type) {
      case 'card_created':
        return `created ${cardTitle}`
      case 'card_moved':
        return `moved ${cardTitle} ${activity.details}`
      case 'card_updated':
        return `updated ${cardTitle}`
      case 'comment_added':
        return `commented on ${cardTitle}`
      case 'file_attached':
        return `attached a file to ${cardTitle}`
      case 'due_date_set':
        return `set due date for ${cardTitle}`
      case 'label_added':
        return `added label to ${cardTitle}`
      case 'member_assigned':
        return `assigned member to ${cardTitle}`
      default:
        return activity.details || 'performed an action'
    }
  }

  const handleRefresh = () => {
    refetch()
    queryClient.invalidateQueries({ queryKey: ['activities'] })
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="text-center text-red-500">
          <p>Failed to load activities</p>
          <button 
            onClick={handleRefresh}
            className="mt-2 text-sm text-blue-500 hover:text-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Activity Feed
          </h3>
          <button
            onClick={handleRefresh}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Refresh activities"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Activity Type Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {ACTIVITY_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              {/* Time Filter */}
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This week</option>
                <option value="this_month">This month</option>
              </select>

              {/* User Filter */}
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All users</option>
                {users?.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Activities List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No activities found</p>
            <p className="text-sm">Activities will appear here as team members work on this board</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activities?.map((activity: Activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  {/* Activity Icon */}
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {activity.user.name}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {formatActivityText(activity)}
                      </span>
                    </div>

                    {/* Additional Details */}
                    {activity.metadata && (
                      <div className="text-sm text-gray-600 mt-1">
                        {activity.metadata.comment && (
                          <div className="bg-gray-50 rounded p-2 italic">
                            "{activity.metadata.comment}"
                          </div>
                        )}
                        {activity.metadata.fileName && (
                          <div className="flex items-center space-x-1">
                            <Paperclip className="w-3 h-3" />
                            <span>{activity.metadata.fileName}</span>
                          </div>
                        )}
                        {activity.metadata.dueDate && (
                          <div className="flex items-center space-x-1">
                            <CalendarDays className="w-3 h-3" />
                            <span>Due: {new Date(activity.metadata.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More */}
      {activities && activities.length >= limit && (
        <div className="p-4 border-t text-center">
          <button className="text-sm text-blue-500 hover:text-blue-700 font-medium">
            Load more activities
          </button>
        </div>
      )}
    </div>
  )
}
