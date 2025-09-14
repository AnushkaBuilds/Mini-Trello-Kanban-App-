import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd'
import { api } from '../lib/api'
import { useSocket } from '../contexts/SocketContext'
import { useAuth } from '../contexts/AuthContext'
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  Activity, 
  MoreHorizontal,
  Bell
} from 'lucide-react'
import toast from 'react-hot-toast'
import List from '../components/List'
import CreateListModal from '../components/CreateListModal'
import ActivitySidebar from '../components/ActivitySidebar'
import SearchModal from '../components/SearchModal'
import {
  LazyNotificationCenter,
  LazyAdvancedFilters,
  LazyActivityFeed,
  LazyCardDetailsModal
} from '../components/LazyComponents'
import { BoardSkeleton } from '../components/BoardSkeleton'
import { useOptimizedBoard } from '../hooks/useOptimizedQueries'
import { usePerformanceMonitor } from '../hooks/usePerformance'

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
}

interface List {
  id: string
  title: string
  position: number
  cards: Card[]
}

interface Board {
  id: string
  title: string
  description?: string
  visibility: string
  lists: List[]
  members: Array<{
    id: string
    role: string
    user: {
      id: string
      name: string
    }
  }>
}

export default function Board() {
  const { boardId } = useParams<{ boardId: string }>()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [showCreateList, setShowCreateList] = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  
  // New state for enhanced features
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showActivityFeed, setShowActivityFeed] = useState(false)
  const [filters, setFilters] = useState<{
    search: string
    labels: string[]
    assignees: string[]
    dueDate: '' | 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'this_month' | 'no_date'
    dateRange: { start: string; end: string }
    priority: '' | 'high' | 'medium' | 'low'
    status: '' | 'active' | 'archived'
  }>({
    search: '',
    labels: [],
    assignees: [],
    dueDate: '',
    dateRange: { start: '', end: '' },
    priority: '',
    status: ''
  })

  // Performance monitoring
  usePerformanceMonitor('Board')

  const { data: board, isLoading } = useOptimizedBoard(boardId)

  const moveCardMutation = useMutation({
    mutationFn: async ({ cardId, listId, position }: { cardId: string; listId: string; position: number }) => {
      const response = await api.put(`/cards/${cardId}/move`, { listId, position })
      return response.data.data.card
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to move card')
      // Refetch board data to reset optimistic update
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    }
  })

  const reorderListsMutation = useMutation({
    mutationFn: async (listIds: string[]) => {
      const response = await api.put('/lists/reorder', { 
        listIds, 
        boardId 
      })
      return response.data
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to reorder lists')
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    }
  })

  // Socket event handlers
  useEffect(() => {
    if (!socket || !boardId) return

    socket.emit('join-board', boardId)

    const handleCardMoved = (data: any) => {
      if (data.movedBy?.id !== user?.id) {
        queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      }
    }

    const handleCardUpdated = (data: any) => {
      if (data.updatedBy?.id !== user?.id) {
        queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      }
    }

    const handleCommentAdded = (data: any) => {
      if (data.addedBy?.id !== user?.id) {
        queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      }
    }

    const handleListUpdated = (data: any) => {
      if (data.updatedBy?.id !== user?.id) {
        queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      }
    }

    const handleListsReordered = (data: any) => {
      if (data.reorderedBy?.id !== user?.id) {
        queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      }
    }

    socket.on('card-moved', handleCardMoved)
    socket.on('card-updated', handleCardUpdated)
    socket.on('comment-added', handleCommentAdded)
    socket.on('list-updated', handleListUpdated)
    socket.on('lists-reordered', handleListsReordered)

    return () => {
      socket.emit('leave-board', boardId)
      socket.off('card-moved', handleCardMoved)
      socket.off('card-updated', handleCardUpdated)
      socket.off('comment-added', handleCommentAdded)
      socket.off('list-updated', handleListUpdated)
      socket.off('lists-reordered', handleListsReordered)
    }
  }, [socket, boardId, user?.id, queryClient])

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, type } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    if (type === 'list') {
      // Handle list reordering
      const newListOrder = Array.from(board?.lists || [])
      const [reorderedList] = newListOrder.splice(source.index, 1)
      newListOrder.splice(destination.index, 0, reorderedList)
      
      const listIds = newListOrder.map((list: any) => list.id)
      reorderListsMutation.mutate(listIds)
      return
    }

    // Handle card movement
    const sourceList = board?.lists.find((list: any) => list.id === source.droppableId)
    const destList = board?.lists.find((list: any) => list.id === destination.droppableId)

    if (!sourceList || !destList) return

    if (source.droppableId === destination.droppableId) {
      // Moving within the same list
      const newCards = Array.from(sourceList.cards)
      const [movedCard] = newCards.splice(source.index, 1)
      newCards.splice(destination.index, 0, movedCard)

      // Update positions
      const updatedCards = newCards.map((card: any, index: number) => ({
        ...card,
        position: (index + 1) * 1000
      }))

      // Optimistic update
      queryClient.setQueryData(['board', boardId], (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          lists: oldData.lists.map((list: List) =>
            list.id === source.droppableId
              ? { ...list, cards: updatedCards }
              : list
          )
        }
      })

      // Move the card that was actually moved
      const movedCardData = updatedCards[destination.index]
      moveCardMutation.mutate({
        cardId: movedCardData.id,
        listId: source.droppableId,
        position: movedCardData.position
      })
    } else {
      // Moving to a different list
      const sourceCards = Array.from(sourceList.cards)
      const destCards = Array.from(destList.cards)
      const [movedCard] = sourceCards.splice(source.index, 1)
      destCards.splice(destination.index, 0, movedCard)

      // Update positions
      const updatedSourceCards = sourceCards.map((card: any, index: number) => ({
        ...card,
        position: (index + 1) * 1000
      }))

      const updatedDestCards = destCards.map((card: any, index: number) => ({
        ...card,
        position: (index + 1) * 1000
      }))

      // Optimistic update
      queryClient.setQueryData(['board', boardId], (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          lists: oldData.lists.map((list: List) => {
            if (list.id === source.droppableId) {
              return { ...list, cards: updatedSourceCards }
            } else if (list.id === destination.droppableId) {
              return { ...list, cards: updatedDestCards }
            }
            return list
          })
        }
      })

      // Move the card
      const movedCardData = updatedDestCards[destination.index]
      moveCardMutation.mutate({
        cardId: movedCardData.id,
        listId: destination.droppableId,
        position: movedCardData.position
      })
    }
  }

  if (isLoading) {
    return <BoardSkeleton />
  }

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Board not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-ghost btn-sm"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{board.title}</h1>
                {board.description && (
                  <p className="text-sm text-gray-500">{board.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSearch(true)}
                className="btn btn-ghost btn-sm"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setShowAdvancedFilters(true)}
                className={`btn btn-sm ${showAdvancedFilters ? 'btn-primary' : 'btn-ghost'}`}
                title="Advanced Filters"
              >
                <Filter className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setShowNotifications(true)}
                className="btn btn-ghost btn-sm"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setShowActivityFeed(!showActivityFeed)}
                className={`btn btn-sm ${showActivityFeed ? 'btn-primary' : 'btn-ghost'}`}
                title="Activity Feed"
              >
                <Activity className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-1">
                {board.members.slice(0, 3).map((member: any) => (
                  <div
                    key={member.id}
                    className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    title={member.user.name}
                  >
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {board.members.length > 3 && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium">
                    +{board.members.length - 3}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  className="btn btn-ghost btn-sm"
                  title="Board Options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <main className={`flex-1 overflow-x-auto transition-all duration-300 ${showActivityFeed ? 'mr-96' : ''}`}>
          <div className="p-4 sm:p-6">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="board" type="list" direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex space-x-6 min-h-96"
                  >
                    {board.lists.map((list: any, index: number) => (
                      <List
                        key={list.id}
                        list={list}
                        index={index}
                        onCardClick={setSelectedCard}
                      />
                    ))}
                    
                    {provided.placeholder}
                    
                    {/* Add List Button */}
                    <div className="flex-shrink-0 w-72">
                      <button
                        onClick={() => setShowCreateList(true)}
                        className="w-full h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add a list
                      </button>
                    </div>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </main>

        {/* Activity Feed Sidebar */}
        {showActivityFeed && (
          <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
            <LazyActivityFeed 
              boardId={boardId!}
              showFilters={true}
              className="h-full"
            />
          </div>
        )}
      </div>

      {/* Modals and Sidebars */}
      {showCreateList && (
        <CreateListModal
          isOpen={showCreateList}
          onClose={() => setShowCreateList(false)}
          boardId={boardId!}
        />
      )}

      {selectedCard && (
        <LazyCardDetailsModal
          card={selectedCard}
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          boardId={boardId!}
        />
      )}

      {showSearch && (
        <SearchModal
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
          boardId={boardId!}
        />
      )}

      {/* Activity Sidebar */}
      {showActivity && (
        <ActivitySidebar
          isOpen={showActivity}
          onClose={() => setShowActivity(false)}
          boardId={boardId!}
        />
      )}

      {/* Notification Center */}
      {showNotifications && (
        <LazyNotificationCenter
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <LazyAdvancedFilters
          isOpen={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          filters={filters}
          onFiltersChange={(newFilters: typeof filters) => {
            setFilters(newFilters)
            // Apply filters to board data here
            // This would typically involve updating the query or filtering the lists
          }}
          boardId={boardId!}
        />
      )}
    </div>
  )
}
