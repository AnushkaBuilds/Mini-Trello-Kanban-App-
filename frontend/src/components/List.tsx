import React from 'react'
import { Draggable, Droppable } from 'react-beautiful-dnd'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import Card from './Card'
import CreateCardModal from './CreateCardModal'

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

interface ListProps {
  list: List
  index: number
  onCardClick: (card: Card) => void
}

function List({ list, index, onCardClick }: ListProps) {
  const [showCreateCard, setShowCreateCard] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(list.title)
  const queryClient = useQueryClient()

  const updateListMutation = useMutation({
    mutationFn: async ({ title }: { title: string }) => {
      const response = await api.put(`/lists/${list.id}`, { title })
      return response.data.data.list
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] })
      setIsEditing(false)
      toast.success('List updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update list')
      setEditTitle(list.title) // Reset on error
    }
  })

  const deleteListMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/lists/${list.id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] })
      toast.success('List deleted successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete list')
    }
  })

  const handleTitleSubmit = () => {
    if (editTitle.trim() && editTitle !== list.title) {
      updateListMutation.mutate({ title: editTitle.trim() })
    } else {
      setEditTitle(list.title)
      setIsEditing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit()
    } else if (e.key === 'Escape') {
      setEditTitle(list.title)
      setIsEditing(false)
    }
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this list? This action cannot be undone.')) {
      deleteListMutation.mutate()
    }
  }

  return (
    <Draggable draggableId={list.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex-shrink-0 w-72 ${snapshot.isDragging ? 'rotate-2' : ''}`}
        >
          <div className="bg-gray-100 rounded-lg p-4 h-fit">
            {/* List Header */}
            <div
              {...provided.dragHandleProps}
              className="flex items-center justify-between mb-4"
            >
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={handleKeyPress}
                  className="flex-1 px-2 py-1 text-sm font-semibold bg-white rounded border-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              ) : (
                <h3 
                  className="flex-1 text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-200 px-2 py-1 rounded -ml-2"
                  onClick={() => setIsEditing(true)}
                >
                  {list.title}
                </h3>
              )}
              
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                  {list.cards.length}
                </span>
                <button
                  onClick={handleDelete}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete list"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cards */}
            <Droppable droppableId={list.id} type="card">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-2 min-h-4 ${
                    snapshot.isDraggingOver ? 'bg-blue-50 rounded' : ''
                  }`}
                >
                  {list.cards.map((card, cardIndex) => (
                    <Card
                      key={card.id}
                      card={card}
                      index={cardIndex}
                      onClick={() => onCardClick(card)}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Add Card Button */}
            <button
              onClick={() => setShowCreateCard(true)}
              className="w-full mt-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded text-sm transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add a card
            </button>
          </div>

          {/* Create Card Modal */}
          {showCreateCard && (
            <CreateCardModal
              isOpen={showCreateCard}
              onClose={() => setShowCreateCard(false)}
              listId={list.id}
            />
          )}
        </div>
      )}
    </Draggable>
  )
}

export default React.memo(List)
