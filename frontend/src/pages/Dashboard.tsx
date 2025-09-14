import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { Plus, Search, Grid, List, LogOut, User, Star, Clock, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import CreateBoardModal from '../components/CreateBoardModal'
import { DashboardSkeleton } from '../components/SkeletonLoader'
import { useOptimizedBoards } from '../hooks/useOptimizedQueries'
import { usePerformanceMonitor } from '../hooks/usePerformance'

interface Board {
  id: string
  title: string
  description?: string
  visibility: string
  updatedAt?: string
  workspace?: {
    id: string
    name: string
  }
  lists: Array<{
    id: string
    title: string
    cards: Array<{
      id: string
      title: string
    }>
  }>
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()

  // Performance monitoring
  usePerformanceMonitor('Dashboard')

  const { data: boards, isLoading } = useOptimizedBoards()

  const createBoardMutation = useMutation({
    mutationFn: async (boardData: { title: string; description?: string; visibility: string }) => {
      const response = await api.post('/boards', boardData)
      return response.data.data.board
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      setShowCreateModal(false)
      toast.success('Board created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create board')
    }
  })

  const filteredBoards = boards?.filter((board: Board) =>
    board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    board.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully!')
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Mini Trello</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-sm"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Board
            </button>
          </div>
        </div>

        {/* Boards Grid/List */}
        {filteredBoards.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Grid className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No boards found' : 'No boards yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Get started by creating your first board'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Board
              </button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {filteredBoards.map((board: Board, index: number) => (
              <Link
                key={board.id}
                to={`/board/${board.id}`}
                className={`block group ${
                  viewMode === 'grid' 
                    ? 'card hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1' 
                    : 'card hover:shadow-md transition-all duration-200'
                }`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                <div className={viewMode === 'grid' ? 'p-6' : 'p-4'}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                        {board.title}
                      </h3>
                      {board.lists && board.lists.length > 0 && (
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      board.visibility === 'private' 
                        ? 'bg-gray-100 text-gray-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {board.visibility}
                    </span>
                  </div>
                  
                  {board.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {board.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <List className="w-4 h-4" />
                        <span>{board.lists?.length || 0} lists</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{board.lists?.reduce((acc: number, list: any) => acc + (list.cards?.length || 0), 0) || 0} cards</span>
                      </div>
                    </div>
                    {board.workspace && (
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {board.workspace.name}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        Updated {new Date(board.updatedAt || Date.now()).toLocaleDateString()}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-primary-600 text-sm font-medium">
                          Open board →
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Board Modal */}
      {showCreateModal && (
        <CreateBoardModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateBoard={createBoardMutation.mutate}
          isLoading={createBoardMutation.isPending}
        />
      )}
    </div>
  )
}
