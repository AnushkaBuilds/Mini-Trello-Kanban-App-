import { useState, useEffect } from 'react'
import { Filter, X, Calendar, User, Tag, Clock, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

interface FilterOptions {
  search: string
  labels: string[]
  assignees: string[]
  dueDate: 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'this_month' | 'no_date' | ''
  dateRange: {
    start: string
    end: string
  }
  priority: 'high' | 'medium' | 'low' | ''
  status: 'active' | 'archived' | ''
}

interface AdvancedFiltersProps {
  isOpen: boolean
  onClose: () => void
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  boardId: string
}

export default function AdvancedFilters({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange, 
  boardId 
}: AdvancedFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters)

  // Fetch board data for filter options
  const { data: boardData } = useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const response = await api.get(`/boards/${boardId}`)
      return response.data.data.board
    },
    enabled: isOpen
  })

  // Get unique labels and users from board
  const availableLabels = boardData?.lists?.flatMap((list: any) => 
    list.cards?.flatMap((card: any) => card.labels?.map((l: any) => l.label))
  ).filter((label: any, index: number, self: any[]) => 
    label && self.findIndex(l => l.id === label.id) === index
  ) || []

  const availableUsers = boardData?.lists?.flatMap((list: any) =>
    list.cards?.flatMap((card: any) => card.assignments?.map((a: any) => a.user))
  ).filter((user: any, index: number, self: any[]) =>
    user && self.findIndex(u => u.id === user.id) === index
  ) || []

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    onClose()
  }

  const handleClearFilters = () => {
    const clearedFilters: FilterOptions = {
      search: '',
      labels: [],
      assignees: [],
      dueDate: '',
      dateRange: { start: '', end: '' },
      priority: '',
      status: ''
    }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleArrayFilter = (key: 'labels' | 'assignees', value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Advanced Filters</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Search in titles and descriptions
              </label>
              <input
                type="text"
                value={localFilters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="Enter search terms..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Labels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Labels
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {availableLabels.length > 0 ? (
                  availableLabels.map((label: any) => (
                    <label key={label.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={localFilters.labels.includes(label.id)}
                        onChange={() => toggleArrayFilter('labels', label.id)}
                        className="rounded"
                      />
                      <span
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="text-sm">{label.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No labels available</p>
                )}
              </div>
            </div>

            {/* Assignees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Assigned to
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {availableUsers.length > 0 ? (
                  availableUsers.map((user: any) => (
                    <label key={user.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={localFilters.assignees.includes(user.id)}
                        onChange={() => toggleArrayFilter('assignees', user.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{user.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No assignees available</p>
                )}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Due Date
              </label>
              <select
                value={localFilters.dueDate}
                onChange={(e) => updateFilter('dueDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Any time</option>
                <option value="overdue">Overdue</option>
                <option value="today">Due today</option>
                <option value="tomorrow">Due tomorrow</option>
                <option value="this_week">Due this week</option>
                <option value="this_month">Due this month</option>
                <option value="no_date">No due date</option>
              </select>
            </div>

            {/* Custom Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={localFilters.dateRange.start}
                  onChange={(e) => updateFilter('dateRange', { 
                    ...localFilters.dateRange, 
                    start: e.target.value 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={localFilters.dateRange.end}
                  onChange={(e) => updateFilter('dateRange', { 
                    ...localFilters.dateRange, 
                    end: e.target.value 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="End date"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Priority
              </label>
              <select
                value={localFilters.priority}
                onChange={(e) => updateFilter('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Any priority</option>
                <option value="high">High priority</option>
                <option value="medium">Medium priority</option>
                <option value="low">Low priority</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={localFilters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All cards</option>
                <option value="active">Active cards</option>
                <option value="archived">Archived cards</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t space-y-2">
            <button
              onClick={handleApplyFilters}
              className="w-full btn btn-primary py-2"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="w-full btn btn-secondary py-2"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
