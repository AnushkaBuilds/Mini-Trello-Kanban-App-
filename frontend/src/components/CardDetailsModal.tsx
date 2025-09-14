import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { 
  X, 
  Calendar, 
  MessageCircle, 
  Plus,
  Edit3,
  Trash2
} from 'lucide-react'
import { format, isBefore, isToday, isTomorrow } from 'date-fns'

interface Card {
  id: string
  title: string
  description?: string
  position: number
  dueDate?: string
  listId: string
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
  comments: Array<{
    id: string
    text: string
    createdAt: string
    author: {
      id: string
      name: string
    }
  }>
  attachments?: Array<{
    id: string
    name: string
    size: number
    type: string
    url: string
    uploadedAt: string
  }>
}

interface CardDetailsModalProps {
  card: Card
  isOpen: boolean
  onClose: () => void
  boardId: string
}

export default function CardDetailsModal({ card, isOpen, onClose, boardId }: CardDetailsModalProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editTitle, setEditTitle] = useState(card.title)
  const [editDescription, setEditDescription] = useState(card.description || '')
  const [newComment, setNewComment] = useState('')
  const [showAddAssignee, setShowAddAssignee] = useState(false)
  const [showAddLabel, setShowAddLabel] = useState(false)
  const [searchUser, setSearchUser] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const updateCardMutation = useMutation({
    mutationFn: async (data: { title?: string; description?: string; dueDate?: string }) => {
      const response = await api.put(`/cards/${card.id}`, data)
      return response.data.data.card
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      toast.success('Card updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update card')
    }
  })

  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await api.post('/comments', { text, cardId: card.id })
      return response.data.data.comment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      setNewComment('')
      toast.success('Comment added!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add comment')
    }
  })

  const addAssigneeMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/cards/${card.id}/assignments`, { userId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      setShowAddAssignee(false)
      setSearchUser('')
      setSearchResults([])
      toast.success('User assigned to card!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to assign user')
    }
  })

  const removeAssigneeMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/cards/${card.id}/assignments/${userId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      toast.success('User removed from card!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove user')
    }
  })

  const deleteCardMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/cards/${card.id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      onClose()
      toast.success('Card deleted successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete card')
    }
  })

  // Search users
  useEffect(() => {
    if (searchUser.length >= 2) {
      const timeoutId = setTimeout(async () => {
        try {
          const response = await api.get(`/users/search?q=${searchUser}`)
          setSearchResults(response.data.data.users)
        } catch (error) {
          console.error('Search users error:', error)
        }
      }, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
    }
  }, [searchUser])

  const handleTitleSubmit = () => {
    if (editTitle.trim() && editTitle !== card.title) {
      updateCardMutation.mutate({ title: editTitle.trim() })
    } else {
      setEditTitle(card.title)
    }
    setIsEditingTitle(false)
  }

  const handleDescriptionSubmit = () => {
    if (editDescription !== card.description) {
      updateCardMutation.mutate({ description: editDescription })
    }
    setIsEditingDescription(false)
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim())
    }
  }

  const handleAddAssignee = (userId: string) => {
    addAssigneeMutation.mutate(userId)
  }

  const handleRemoveAssignee = (userId: string) => {
    removeAssigneeMutation.mutate(userId)
  }

  const handleDeleteCard = () => {
    if (window.confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
      deleteCardMutation.mutate()
    }
  }

  const getDueDateStatus = (dueDate: string) => {
    const date = new Date(dueDate)
    const now = new Date()
    
    if (isBefore(date, now)) {
      return { status: 'overdue', color: 'text-red-600 bg-red-50 border-red-200' }
    } else if (isToday(date)) {
      return { status: 'today', color: 'text-orange-600 bg-orange-50 border-orange-200' }
    } else if (isTomorrow(date)) {
      return { status: 'tomorrow', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' }
    } else {
      return { status: 'upcoming', color: 'text-gray-600 bg-gray-50 border-gray-200' }
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b">
            <div className="flex-1">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                  className="text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1 -ml-2"
                  autoFocus
                />
              ) : (
                <h2 
                  className="text-xl font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded -ml-2"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {card.title}
                </h2>
              )}
              <p className="text-sm text-gray-500 mt-1">in List Name</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDeleteCard}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete card"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">Description</h3>
                    {!isEditingDescription && (
                      <button
                        onClick={() => setIsEditingDescription(true)}
                        className="btn btn-ghost btn-sm"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {isEditingDescription ? (
                    <div>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        onBlur={handleDescriptionSubmit}
                        onKeyDown={(e) => e.key === 'Escape' && setIsEditingDescription(false)}
                        className="input w-full resize-none"
                        rows={4}
                        autoFocus
                      />
                      <div className="flex justify-end space-x-2 mt-2">
                        <button
                          onClick={() => setIsEditingDescription(false)}
                          className="btn btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDescriptionSubmit}
                          className="btn btn-primary btn-sm"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="min-h-[60px] p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                      onClick={() => setIsEditingDescription(true)}
                    >
                      {card.description || (
                        <span className="text-gray-500">Add a description...</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Comments */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Comments ({card.comments.length})
                  </h3>
                  
                  <div className="space-y-3 mb-4">
                    {card.comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {comment.author.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {comment.author.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleCommentSubmit} className="flex space-x-3">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="input w-full"
                        disabled={addCommentMutation.isPending}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newComment.trim() || addCommentMutation.isPending}
                      className="btn btn-primary btn-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Due Date */}
                {card.dueDate && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Due Date</h3>
                    <div className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium ${getDueDateStatus(card.dueDate).color}`}>
                      <Calendar className="w-4 h-4 mr-2" />
                      {format(new Date(card.dueDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                )}

                {/* Assignees */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">Assignees</h3>
                    <button
                      onClick={() => setShowAddAssignee(!showAddAssignee)}
                      className="btn btn-ghost btn-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {card.assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {assignment.user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-900">{assignment.user.name}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveAssignee(assignment.user.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {showAddAssignee && (
                      <div className="border rounded-lg p-3">
                        <input
                          type="text"
                          value={searchUser}
                          onChange={(e) => setSearchUser(e.target.value)}
                          placeholder="Search users..."
                          className="input w-full mb-2"
                        />
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {searchResults.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => handleAddAssignee(user.id)}
                              className="w-full text-left p-2 hover:bg-gray-100 rounded text-sm"
                            >
                              {user.name} ({user.email})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Labels */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">Labels</h3>
                    <button
                      onClick={() => setShowAddLabel(!showAddLabel)}
                      className="btn btn-ghost btn-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
