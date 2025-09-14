import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'

interface CreateBoardModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateBoard: (data: { title: string; description?: string; visibility: string }) => void
  isLoading: boolean
}

interface BoardForm {
  title: string
  description: string
  visibility: 'private' | 'workspace'
}

export default function CreateBoardModal({ 
  isOpen, 
  onClose, 
  onCreateBoard, 
  isLoading 
}: CreateBoardModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<BoardForm>({
    defaultValues: {
      title: '',
      description: '',
      visibility: 'private'
    }
  })

  const onSubmit = async (data: BoardForm) => {
    setIsSubmitting(true)
    try {
      await onCreateBoard(data)
      reset()
      onClose()
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isLoading && !isSubmitting) {
      reset()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Create New Board
            </h3>
            <button
              onClick={handleClose}
              disabled={isLoading || isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Board Title *
              </label>
              <input
                {...register('title', {
                  required: 'Board title is required',
                  minLength: {
                    value: 1,
                    message: 'Title must not be empty'
                  }
                })}
                type="text"
                className="input w-full"
                placeholder="Enter board title"
                disabled={isLoading || isSubmitting}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="input w-full resize-none"
                placeholder="Enter board description (optional)"
                disabled={isLoading || isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">
                Visibility
              </label>
              <select
                {...register('visibility')}
                className="input w-full"
                disabled={isLoading || isSubmitting}
              >
                <option value="private">Private</option>
                <option value="workspace">Workspace</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Private boards are only visible to you. Workspace boards are visible to workspace members.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading || isSubmitting}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="btn btn-primary"
              >
                {isLoading || isSubmitting ? 'Creating...' : 'Create Board'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
