import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useEffect } from 'react'

export function usePrefetchBoards() {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    // Prefetch boards data in the background
    queryClient.prefetchQuery({
      queryKey: ['boards'],
      queryFn: async () => {
        const response = await api.get('/boards')
        return response.data.data.boards
      },
      staleTime: 1000 * 60 * 2, // 2 minutes
    })
  }, [queryClient])
}

export function usePrefetchBoardDetails(boardId: string | undefined) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    if (!boardId) return
    
    // Prefetch board details when boardId changes
    const timeoutId = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey: ['board', boardId],
        queryFn: async () => {
          const response = await api.get(`/boards/${boardId}`)
          return response.data.data.board
        },
        staleTime: 1000 * 60 * 3, // 3 minutes
      })
    }, 100) // Small delay to avoid unnecessary requests
    
    return () => clearTimeout(timeoutId)
  }, [boardId, queryClient])
}

export function useOptimizedBoard(boardId: string | undefined) {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const response = await api.get(`/boards/${boardId}`)
      return response.data.data.board
    },
    enabled: !!boardId,
    staleTime: 1000 * 60 * 3, // 3 minutes - don't refetch if data is fresh
    gcTime: 1000 * 60 * 10, // 10 minutes - keep in cache
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    retry: (failureCount, error: any) => {
      // Only retry on network errors, not 4xx errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false
      }
      return failureCount < 2
    }
  })
}

export function useOptimizedBoards() {
  return useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const response = await api.get('/boards')
      return response.data.data.boards
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false
      }
      return failureCount < 2
    }
  })
}
