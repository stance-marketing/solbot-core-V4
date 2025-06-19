import React, { useState, useEffect, useRef } from 'react'
import { 
  Terminal, 
  Copy, 
  Download, 
  Trash2, 
  Play, 
  Pause,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Info,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { monitoringService } from '../../services/monitoringService'

interface ConsoleOutputProps {
  logs?: string[]
  maxHeight?: string
  title?: string
  autoScroll?: boolean
  showControls?: boolean
  refreshInterval?: number
}

const ConsoleOutput: React.FC<ConsoleOutputProps> = ({
  logs: propLogs,
  maxHeight = '400px',
  title = 'Console Output',
  autoScroll = true,
  showControls = true,
  refreshInterval = 5000
}) => {
  const [logs, setLogs] = useState<string[]>(propLogs || [])
  const [filteredLogs, setFilteredLogs] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'info' | 'error' | 'warning' | 'success'>('all')
  const [isPaused, setIsPaused] = useState(false)
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(autoScroll)
  const [isLoading, setIsLoading] = useState(false)
  const consoleRef = useRef<HTMLDivElement>(null)

  // Fetch console output from backend
  useEffect(() => {
    fetchConsoleOutput()
    
    // Set up auto-refresh if not paused
    if (!isPaused) {
      const interval = setInterval(() => {
        fetchConsoleOutput()
      }, refreshInterval)
      
      return () => clearInterval(interval)
    }
  }, [isPaused, refreshInterval])

  const fetchConsoleOutput = async () => {
    if (isLoading || isPaused) return
    
    setIsLoading(true)
    try {
      const output = await monitoringService.getConsoleOutput(100)
      setLogs(output)
    } catch (error) {
      console.error('Failed to fetch console output:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter logs based on search term and filter
  useEffect(() => {
    let filtered = logs
    
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (filter !== 'all') {
      filtered = filtered.filter(log => 
        log.toLowerCase().includes(`[${filter}]`)
      )
    }
    
    setFilteredLogs(filtered)
  }, [logs, searchTerm, filter])

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (autoScrollEnabled && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [filteredLogs, autoScrollEnabled])

  const clearLogs = () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      setLogs([])
      toast.success('Console cleared')
    }
  }

  const downloadLogs = () => {
    const content = logs.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `console-logs-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Logs downloaded')
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(logs.join('\n'))
      toast.success('Logs copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy logs to clipboard')
    }
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
    toast.success(isPaused ? 'Console resumed' : 'Console paused')
  }

  const getLogColor = (log: string) => {
    if (log.includes('[ERROR]')) return 'text-red-600 dark:text-red-400'
    if (log.includes('[WARNING]')) return 'text-yellow-600 dark:text-yellow-400'
    if (log.includes('[SUCCESS]')) return 'text-green-600 dark:text-green-400'
    if (log.includes('[INFO]')) return 'text-blue-600 dark:text-blue-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getLogIcon = (log: string) => {
    if (log.includes('[ERROR]')) return <XCircle className="w-4 h-4 text-red-500" />
    if (log.includes('[WARNING]')) return <AlertCircle className="w-4 h-4 text-yellow-500" />
    if (log.includes('[SUCCESS]')) return <CheckCircle className="w-4 h-4 text-green-500" />
    if (log.includes('[INFO]')) return <Info className="w-4 h-4 text-blue-500" />
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredLogs.length} lines
          </div>
        </div>
        
        {showControls && (
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchConsoleOutput}
              disabled={isLoading || isPaused}
              className="flex items-center p-1 rounded text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50"
              title="Refresh console"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={togglePause}
              className={`p-1 rounded ${
                isPaused 
                  ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300' 
                  : 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300'
              }`}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setAutoScrollEnabled(!autoScrollEnabled)}
              className={`p-1 rounded ${
                autoScrollEnabled 
                  ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300' 
                  : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
              }`}
              title={autoScrollEnabled ? 'Disable auto-scroll' : 'Enable auto-scroll'}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19V5M12 19L5 12M12 19L19 12" />
              </svg>
            </button>
            
            <button
              onClick={copyToClipboard}
              className="flex items-center p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
            
            <button
              onClick={downloadLogs}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Download logs"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={clearLogs}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Clear console"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {showControls && (
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Logs</option>
              <option value="info">Info</option>
              <option value="error">Errors</option>
              <option value="warning">Warnings</option>
              <option value="success">Success</option>
            </select>
          </div>
        </div>
      )}

      <div 
        ref={consoleRef}
        className="bg-gray-900 text-gray-100 font-mono text-sm rounded-lg p-4 overflow-y-auto"
        style={{ maxHeight }}
      >
        {filteredLogs.length > 0 ? (
          <div className="space-y-1">
            {filteredLogs.map((log, index) => (
              <div key={index} className={`flex items-start space-x-2 ${getLogColor(log)}`}>
                {getLogIcon(log)}
                <pre className="whitespace-pre-wrap break-all">{log}</pre>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Terminal className="w-8 h-8 mb-2" />
            <p>No logs to display</p>
            {searchTerm && (
              <p className="text-sm mt-1">Try adjusting your search or filter</p>
            )}
          </div>
        )}
      </div>

      {showControls && logs.length > 0 && (
        <div className="mt-4 flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <div>
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
          <div>
            {isPaused && (
              <span className="text-yellow-600 dark:text-yellow-400">Console output paused</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ConsoleOutput