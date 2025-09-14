import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { X, Search, Calendar, User, Tag, Filter } from 'lucide-react'
import { format } from 'date-fns'
import LoadingSpinner from './LoadingSpinner'

interface Card {
  id: string
  title: string
  description?: string
  dueDate?: string
  list: {
    id: string
    title: string
  }
  labels: Array<{
    id: string
    label: {
      id: string
      name: string
      color: string
    }
  }>
  assignments: Array<{
    id: string
    user: {
      id: string
      name: string
    }
  }>
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  boardId: string
}

export default function SearchModal({ isOpen, onClose, boardId }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [labelFilter, setLabelFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [dueDateFilter, setDueDateFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['search', boardId, searchQuery, labelFilter, assigneeFilter, dueDateFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (labelFilter) params.append('label', labelFilter)
      if (assigneeFilter) params.append('assignee', assigneeFilter)
      if (dueDateFilter) params.append('dueDate', dueDateFilter)
      
      const response = await api.get(`/boards/${boardId}/search?${params.toString()}`)
      return response.data.data.cards as Card[]
    },
    enabled: isOpen && (searchQuery.length >= 2 || labelFilter || assigneeFilter || dueDateFilter) as boolean
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is triggered automatically by the query
  }

  const clearFilters = () => {
    setSearchQuery('')
    setLabelFilter('')
    setAssigneeFilter('')
    setDueDateFilter('')
  }

  const getDueDateStatus = (dueDate: string) => {
    const date = new Date(dueDate)
    const now = new Date()
    
    if (date < now) {
      return { status: 'overdue', color: 'text-red-600 bg-red-50' }
    } else if (date.toDateString() === now.toDateString()) {
      return { status: 'today', color: 'text-orange-600 bg-orange-50' }
    } else {
      return { status: 'upcoming', color: 'text-gray-600 bg-gray-50' }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Search Cards</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cards by title or description..."
                  className="input w-full pl-10"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn btn-ghost btn-sm"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                
                {(searchQuery || labelFilter || assigneeFilter || dueDateFilter) && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="btn btn-secondary btn-sm"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={labelFilter}
                      onChange={(e) => setLabelFilter(e.target.value)}
                      placeholder="Filter by label name..."
                      className="input w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assignee
                    </label>
                    <input
                      type="text"
                      value={assigneeFilter}
                      onChange={(e) => setAssigneeFilter(e.target.value)}
                      placeholder="Filter by assignee name..."
                      className="input w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDateFilter}
                      onChange={(e) => setDueDateFilter(e.target.value)}
                      className="input w-full"
                    />
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Results */}
          <div className="overflow-y-auto max-h-96">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <LoadingSpinner />
              </div>
            ) : cards && cards.length > 0 ? (
              <div className="p-6 space-y-4">
                {cards.map((card) => (
                  <div key={card.id} className="card p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{card.title}</h3>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {card.list.title}
                      </span>
                    </div>
                    
                    {card.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {card.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Labels */}
                        {card.labels.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Tag className="w-4 h-4 text-gray-400" />
                            <div className="flex space-x-1">
                              {card.labels.map((label) => (
                                <span
                                  key={label.id}
                                  className="px-2 py-1 text-xs font-medium text-white rounded"
                                  style={{ backgroundColor: label.label.color }}
                                >
                                  {label.label.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Assignees */}
                        {card.assignments.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {card.assignments.map(a => a.user.name).join(', ')}
                            </span>
                          </div>
                        )}

                        {/* Due Date */}
                        {card.dueDate && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm font-medium px-2 py-1 rounded ${getDueDateStatus(card.dueDate).color}`}>
                              {format(new Date(card.dueDate), 'MMM d')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (searchQuery || labelFilter || assigneeFilter || dueDateFilter) ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Search className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No cards found</h3>
                <p className="text-gray-500">
                  Try adjusting your search terms or filters.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Search className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Search Cards</h3>
                <p className="text-gray-500">
                  Enter a search term or use filters to find cards.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
