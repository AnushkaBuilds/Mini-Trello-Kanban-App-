import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import { X, Calendar } from 'lucide-react'

interface CreateCardModalProps {
  isOpen: boolean
  onClose: () => void
  listId: string
}

interface CardForm {
  title: string
  description: string
  dueDate: string
}

export default function CreateCardModal({ isOpen, onClose, listId }: CreateCardModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CardForm>({
    defaultValues: {
      title: '',
      description: '',
      dueDate: ''
    }
  })

  const createCardMutation = useMutation({
    mutationFn: async (data: CardForm) => {
      const response = await api.post('/cards', {
        ...data,
        listId,
        dueDate: data.dueDate || undefined
      })
      return response.data.data.card
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] })
      reset()
      onClose()
      toast.success('Card created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create card')
    }
  })

  const onSubmit = async (data: CardForm) => {
    setIsSubmitting(true)
    try {
      await createCardMutation.mutateAsync(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
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
              Create New Card
            </h3>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Card Title *
              </label>
              <input
                {...register('title', {
                  required: 'Card title is required',
                  minLength: {
                    value: 1,
                    message: 'Title must not be empty'
                  }
                })}
                type="text"
                className="input w-full"
                placeholder="Enter card title"
                disabled={isSubmitting}
                autoFocus
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
                placeholder="Enter card description (optional)"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('dueDate')}
                  type="datetime-local"
                  className="input w-full pl-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? 'Creating...' : 'Create Card'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
