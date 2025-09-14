import React from 'react'
import { Draggable } from 'react-beautiful-dnd'
import { format, isBefore, isToday, isTomorrow, isYesterday } from 'date-fns'
import { Calendar, MessageCircle, User } from 'lucide-react'

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

interface CardProps {
  card: Card
  index: number
  onClick: () => void
}

function Card({ card, index, onClick }: CardProps) {
  const getDueDateStatus = (dueDate: string) => {
    const date = new Date(dueDate)
    const now = new Date()
    
    if (isBefore(date, now)) {
      return { status: 'overdue', color: 'text-red-600 bg-red-50' }
    } else if (isToday(date)) {
      return { status: 'today', color: 'text-orange-600 bg-orange-50' }
    } else if (isTomorrow(date)) {
      return { status: 'tomorrow', color: 'text-yellow-600 bg-yellow-50' }
    } else {
      return { status: 'upcoming', color: 'text-gray-600 bg-gray-50' }
    }
  }

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate)
    
    if (isToday(date)) {
      return 'Today'
    } else if (isTomorrow(date)) {
      return 'Tomorrow'
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'MMM d')
    }
  }

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow ${
            snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
          }`}
        >
          {/* Labels */}
          {card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
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
          )}

          {/* Title */}
          <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
            {card.title}
          </h4>

          {/* Description preview */}
          {card.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {card.description}
            </p>
          )}

          {/* Due Date */}
          {card.dueDate && (
            <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium mb-2 ${getDueDateStatus(card.dueDate).color}`}>
              <Calendar className="w-3 h-3 mr-1" />
              {formatDueDate(card.dueDate)}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              {/* Comments count */}
              {card.comments.length > 0 && (
                <div className="flex items-center">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  {card.comments.length}
                </div>
              )}

              {/* Assignments count */}
              {card.assignments.length > 0 && (
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  {card.assignments.length}
                </div>
              )}
            </div>

            {/* Assignee avatars */}
            {card.assignments.length > 0 && (
              <div className="flex -space-x-1">
                {card.assignments.slice(0, 3).map((assignment) => (
                  <div
                    key={assignment.id}
                    className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                    title={assignment.user.name}
                  >
                    {assignment.user.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {card.assignments.length > 3 && (
                  <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                    +{card.assignments.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}

export default React.memo(Card)
