import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { 
  FolderOpen, 
  Calendar, 
  Users, 
  HardDrive, 
  MoreVertical, 
  Download, 
  Trash2, 
  Play,
  Search,
  Filter,
  Eye
} from 'lucide-react'
import { backendService, SessionFile } from '../../services/backendService'
import { setCurrentSession, setLoading, setError } from '../../store/slices/sessionSlice'
import { setAdminWallet, setTradingWallets } from '../../store/slices/walletSlice'
import { SessionData } from '../../store/slices/sessionSlice'
import SessionViewer from './SessionViewer'
import toast from 'react-hot-toast'

interface SessionBrowserProps {
  onSelectSession: (filename: string) => void
}

const SessionBrowser: React.FC<SessionBrowserProps> = ({ onSelectSession }) => {
  const dispatch = useDispatch()
  const [sessions, setSessions] = useState<SessionFile[]>([])
  const [filteredSessions, setFilteredSessions] = useState<SessionFile[]>([])
  const [isLoading, setIsLoadingState] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [viewingSession, setViewingSession] = useState<SessionData | null>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    filterAndSortSessions()
  }, [sessions, searchTerm, sortBy, sortOrder])

  const loadSessions = async () => {
    setIsLoadingState(true)
    try {
      // Call your backend to get session files
      const sessionFiles = await backendService.getSessionFiles()
      setSessions(sessionFiles)
    } catch (error) {
      toast.error(`Failed to load session files: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoadingState(false)
    }
  }

  const filterAndSortSessions = () => {
    let filtered = sessions.filter(session =>
      session.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.tokenName.toLowerCase().includes(searchTerm.toLowerCase())
    )

    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.tokenName.localeCompare(b.tokenName)
          break
        case 'date':
          comparison = a.lastModified.getTime() - b.lastModified.getTime()
          break
        case 'size':
          comparison = a.size - b.size
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredSessions(filtered)
  }

  const handleLoadSession = async (filename: string) => {
    dispatch(setLoading(true))
    try {
      // Call your backend to load session
      const sessionData = await backendService.loadSession(filename)
      
      // Convert session data to wallet format
      const adminWallet = {
        number: sessionData.admin.number,
        publicKey: sessionData.admin.address,
        privateKey: sessionData.admin.privateKey,
        solBalance: 0, // This will be updated by real-time balance fetching
        tokenBalance: 0, // This will be updated by real-time balance fetching
        isActive: true
      }

      const tradingWallets = sessionData.wallets.map(wallet => ({
        number: wallet.number,
        publicKey: wallet.address,
        privateKey: wallet.privateKey,
        solBalance: 0, // This will be updated by real-time balance fetching
        tokenBalance: 0, // This will be updated by real-time balance fetching
        isActive: false,
        generationTimestamp: wallet.generationTimestamp
      }))

      // Get real-time balances from your backend
      const walletsWithBalances = await backendService.getWalletBalances([adminWallet, ...tradingWallets])
      const updatedAdminWallet = walletsWithBalances.find(w => w.number === 0)
      const updatedTradingWallets = walletsWithBalances.filter(w => w.number > 0)

      dispatch(setCurrentSession(sessionData))
      dispatch(setAdminWallet(updatedAdminWallet || adminWallet))
      dispatch(setTradingWallets(updatedTradingWallets))
      
      toast.success(`Session loaded: ${sessionData.tokenName}`)
      onSelectSession(filename)
    } catch (error) {
      dispatch(setError(`Failed to load session: ${error instanceof Error ? error.message : String(error)}`))
      toast.error(`Failed to load session: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleDeleteSession = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
      return
    }

    try {
      // Call your backend to delete session
      await backendService.deleteSession(filename)
      setSessions(sessions.filter(s => s.filename !== filename))
      toast.success('Session deleted successfully')
    } catch (error) {
      toast.error(`Failed to delete session: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleViewSession = async (filename: string) => {
    try {
      const sessionData = await backendService.loadSession(filename)
      setViewingSession(sessionData)
      setSelectedSession(null)
    } catch (error) {
      toast.error(`Failed to load session: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleExportSession = async (filename: string) => {
    try {
      // Load session data from your backend
      const sessionData = await backendService.loadSession(filename)
      
      // Generate .env file content from your backend
      const envContent = await backendService.generateEnvFile(sessionData)
      
      // Create and download .env file
      const blob = new Blob([envContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${sessionData.tokenName}_${sessionData.timestamp}.env`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Environment file exported successfully')
    } catch (error) {
      toast.error(`Failed to export session: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Session Files
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        <button
          onClick={loadSessions}
          disabled={isLoading}
          className="px-4 py-2 bg-solana-600 hover:bg-solana-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-solana-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder]
              setSortBy(newSortBy)
              setSortOrder(newSortOrder)
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-solana-500 focus:border-transparent"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="size-desc">Largest First</option>
            <option value="size-asc">Smallest First</option>
          </select>
        </div>
      </div>

      {/* Session List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solana-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Loading sessions...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Sessions Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm ? 'No sessions match your search criteria.' : 'Create your first session to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <div
              key={session.filename}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
                selectedSession === session.filename
                  ? 'border-solana-500 bg-solana-50 dark:bg-solana-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-solana-500 rounded-lg flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {session.tokenName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {session.timestamp}
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={() => setSelectedSession(
                        selectedSession === session.filename ? null : session.filename
                      )}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {selectedSession === session.filename && (
                      <div className="absolute right-0 top-8 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-[160px]">
                        <button
                          onClick={() => {
                            handleViewSession(session.filename)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Session</span>
                        </button>
                        <button
                          onClick={() => {
                            handleLoadSession(session.filename)
                            setSelectedSession(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center space-x-2"
                        >
                          <Play className="w-4 h-4" />
                          <span>Load Session</span>
                        </button>
                        <button
                          onClick={() => {
                            handleExportSession(session.filename)
                            setSelectedSession(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Export .env</span>
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteSession(session.filename)
                            setSelectedSession(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {session.walletCount}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Wallets
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <HardDrive className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatFileSize(session.size)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Size
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(session.lastModified).split(',')[0]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Modified
                    </p>
                  </div>
                </div>

                {/* Load Button */}
                <button
                  onClick={() => handleLoadSession(session.filename)}
                  className="w-full px-4 py-2 bg-solana-600 hover:bg-solana-700 text-white font-medium rounded-lg transition-colors"
                >
                  Load Session
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Session Viewer Modal */}
      {viewingSession && (
        <SessionViewer
          sessionData={viewingSession}
          onClose={() => setViewingSession(null)}
        />
      )}
    </div>
  )
}

export default SessionBrowser