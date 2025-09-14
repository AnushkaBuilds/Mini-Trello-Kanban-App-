import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'

interface CreateListModalProps {
  isOpen: boolean
  onClose: () => void
  boardId: string
}

interface ListForm {
  title: string
}

export default function CreateListModal({ isOpen, onClose, boardId }: CreateListModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ListForm>({
    defaultValues: {
      title: ''
    }
  })

  const createListMutation = useMutation({
    mutationFn: async (data: ListForm) => {
      const response = await api.post('/lists', {
        ...data,
        boardId
      })
      return response.data.data.list
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      reset()
      onClose()
      toast.success('List created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create list')
    }
  })

  const onSubmit = async (data: ListForm) => {
    setIsSubmitting(true)
    try {
      await createListMutation.mutateAsync(data)
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
              Create New List
            </h3>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                List Title *
              </label>
              <input
                {...register('title', {
                  required: 'List title is required',
                  minLength: {
                    value: 1,
                    message: 'Title must not be empty'
                  }
                })}
                type="text"
                className="input w-full"
                placeholder="Enter list title"
                disabled={isSubmitting}
                autoFocus
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
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
                {isSubmitting ? 'Creating...' : 'Create List'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
