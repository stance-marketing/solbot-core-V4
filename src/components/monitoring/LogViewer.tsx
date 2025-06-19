import React, { useState, useEffect, useRef } from 'react'
import { 
  Terminal, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  Clock, 
  Download,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  Copy,
  ArrowDown,
  ArrowUp
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import toast from 'react-hot-toast'
import { monitoringService, LogEntry } from '../../services/monitoringService'

interface LogViewerProps {
  logs?: LogEntry[]
  maxHeight?: string
  title?: string
  autoScroll?: boolean
  showControls?: boolean
  showTimestamps?: boolean
  showSource?: boolean
}

const LogViewer: React.FC<LogViewerProps> = ({
  logs: propLogs,
  maxHeight = '400px',
  title = 'System Logs',
  autoScroll = true,
  showControls = true,
  showTimestamps = true,
  showSource = true
}) => {
  const { messages } = useSelector((state: RootState) => state.websocket)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [logLevel, setLogLevel] = useState<'all' | 'info' | 'warning' | 'error' | 'success' | 'debug'>('all')
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(autoScroll)
  const [isLoading, setIsLoading] = useState(false)
  const logContainerRef = useRef<HTMLDivElement>(null)

  // Fetch logs from backend
  useEffect(() => {
    fetchLogs()
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      if (autoScrollEnabled) {
        fetchLogs()
      }
    }, 5000) // Refresh every 5 seconds
    
    return () => clearInterval(interval)
  }, [autoScrollEnabled])

  const fetchLogs = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      const fetchedLogs = await monitoringService.getLogs(100, logLevel !== 'all' ? logLevel : undefined)
      setLogs(fetchedLogs)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter logs based on search term and log level
  useEffect(() => {
    let filtered = logs
    
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.source.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (logLevel !== 'all') {
      filtered = filtered.filter(log => log.level === logLevel)
    }
    
    setFilteredLogs(filtered)
  }, [logs, searchTerm, logLevel])

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (autoScrollEnabled && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [filteredLogs, autoScrollEnabled])

  const clearLogs = () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      setLogs([])
      toast.success('Logs cleared')
    }
  }

  const downloadLogs = () => {
    const content = logs.map(log => 
      `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`
    ).join('\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `solana-trading-bot-logs-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Logs downloaded')
  }

  const copyToClipboard = async () => {
    const content = logs.map(log => 
      `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`
    ).join('\n')
    
    try {
      await navigator.clipboard.writeText(content)
      toast.success('Logs copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy logs to clipboard')
    }
  }

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'debug':
        return <Terminal className="w-4 h-4 text-purple-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const getLogColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'text-blue-600 dark:text-blue-400'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'error':
        return 'text-red-600 dark:text-red-400'
      case 'success':
        return 'text-green-600 dark:text-green-400'
      case 'debug':
        return 'text-purple-600 dark:text-purple-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getLogBackground = (level: string) => {
    switch (level) {
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/10'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/10'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/10'
      case 'success':
        return 'bg-green-50 dark:bg-green-900/10'
      case 'debug':
        return 'bg-purple-50 dark:bg-purple-900/10'
      default:
        return 'bg-gray-50 dark:bg-gray-900/10'
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredLogs.length} entries
          </div>
        </div>
        
        {showControls && (
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="flex items-center p-1 rounded text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setAutoScrollEnabled(!autoScrollEnabled)}
              className={`flex items-center p-1 rounded ${
                autoScrollEnabled 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-gray-400 dark:text-gray-600'
              }`}
              title={autoScrollEnabled ? 'Disable auto-scroll' : 'Enable auto-scroll'}
            >
              {autoScrollEnabled ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
            </button>
            
            <button
              onClick={copyToClipboard}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Copy logs to clipboard"
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
              title="Clear logs"
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
              value={logLevel}
              onChange={(e) => setLogLevel(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warning">Warnings</option>
              <option value="error">Errors</option>
              <option value="success">Success</option>
              <option value="debug">Debug</option>
            </select>
          </div>
        </div>
      )}

      <div 
        ref={logContainerRef}
        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-y-auto font-mono text-sm"
        style={{ maxHeight }}
      >
        {filteredLogs.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className={`p-3 ${getLogBackground(log.level)}`}
              >
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 mt-1">
                    {getLogIcon(log.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {showTimestamps && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(log.timestamp)}
                        </span>
                      )}
                      {showSource && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getLogColor(log.level)} bg-opacity-10`}>
                          {log.source}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                      {log.message}
                    </p>
                    {log.details && typeof log.details === 'object' && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                          Details
                        </summary>
                        <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400">
            <Terminal className="w-12 h-12 mb-2" />
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
            {logs.length > 0 && (
              <span>
                First: {formatTime(logs[0].timestamp)} | 
                Last: {formatTime(logs[logs.length - 1].timestamp)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LogViewer