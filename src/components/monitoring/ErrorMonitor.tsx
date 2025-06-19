import React, { useState, useEffect } from 'react'
import { 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Search, 
  Filter,
  ArrowRight,
  Trash2,
  Download,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import toast from 'react-hot-toast'

interface ErrorData {
  id: string
  timestamp: number
  message: string
  source: string
  stack?: string
  resolved: boolean
  resolvedAt?: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  occurrences: number
  lastOccurrence: number
}

interface ErrorMonitorProps {
  errors?: ErrorData[]
  onResolve?: (id: string) => void
  onClear?: () => void
}

const ErrorMonitor: React.FC<ErrorMonitorProps> = ({
  errors: propErrors,
  onResolve,
  onClear
}) => {
  const { messages } = useSelector((state: RootState) => state.websocket)
  const [errors, setErrors] = useState<ErrorData[]>([])
  const [filteredErrors, setFilteredErrors] = useState<ErrorData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Convert websocket error messages to error data if no errors are provided
  useEffect(() => {
    if (propErrors) {
      setErrors(propErrors)
    } else {
      const errorMessages = messages.filter(msg => msg.type === 'error')
      
      // Group similar errors
      const errorMap = new Map<string, ErrorData>()
      
      errorMessages.forEach(msg => {
        const errorMessage = typeof msg.data === 'string' ? msg.data : msg.data.message || JSON.stringify(msg.data)
        const errorKey = errorMessage.slice(0, 100) // Use first 100 chars as key
        
        if (errorMap.has(errorKey)) {
          const existingError = errorMap.get(errorKey)!
          errorMap.set(errorKey, {
            ...existingError,
            occurrences: existingError.occurrences + 1,
            lastOccurrence: msg.timestamp
          })
        } else {
          errorMap.set(errorKey, {
            id: msg.id,
            timestamp: msg.timestamp,
            message: errorMessage,
            source: msg.data.source || 'unknown',
            stack: msg.data.stack,
            resolved: false,
            severity: getSeverity(errorMessage),
            occurrences: 1,
            lastOccurrence: msg.timestamp
          })
        }
      })
      
      setErrors(Array.from(errorMap.values()))
    }
  }, [propErrors, messages])

  // Filter errors based on search term, severity, and status
  useEffect(() => {
    let filtered = errors
    
    if (searchTerm) {
      filtered = filtered.filter(error => 
        error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.source.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (severityFilter !== 'all') {
      filtered = filtered.filter(error => error.severity === severityFilter)
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(error => 
        statusFilter === 'resolved' ? error.resolved : !error.resolved
      )
    }
    
    setFilteredErrors(filtered)
  }, [errors, searchTerm, severityFilter, statusFilter])

  const getSeverity = (message: string): 'critical' | 'high' | 'medium' | 'low' => {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('critical') || 
        lowerMessage.includes('fatal') || 
        lowerMessage.includes('crash')) {
      return 'critical'
    }
    
    if (lowerMessage.includes('error') || 
        lowerMessage.includes('exception') || 
        lowerMessage.includes('failed')) {
      return 'high'
    }
    
    if (lowerMessage.includes('warning') || 
        lowerMessage.includes('timeout') || 
        lowerMessage.includes('retry')) {
      return 'medium'
    }
    
    return 'low'
  }

  const handleResolveError = (id: string) => {
    if (onResolve) {
      onResolve(id)
    } else {
      setErrors(prev => prev.map(error => 
        error.id === id 
          ? { ...error, resolved: true, resolvedAt: Date.now() } 
          : error
      ))
      toast.success('Error marked as resolved')
    }
  }

  const handleClearErrors = () => {
    if (confirm('Are you sure you want to clear all errors?')) {
      if (onClear) {
        onClear()
      } else {
        setErrors([])
      }
      toast.success('All errors cleared')
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    // In a real implementation, you would fetch fresh error data
    setTimeout(() => {
      setIsRefreshing(false)
      toast.success('Error data refreshed')
    }, 1000)
  }

  const downloadErrorReport = () => {
    const content = errors.map(error => 
      `[${new Date(error.timestamp).toISOString()}] [${error.severity.toUpperCase()}] [${error.source}] ${error.message}${error.stack ? '\nStack: ' + error.stack : ''}`
    ).join('\n\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `error-report-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Error report downloaded')
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20'
      case 'high':
        return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20'
      case 'low':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Error Monitor
          </h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredErrors.length} errors
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={downloadErrorReport}
            disabled={errors.length === 0}
            className="flex items-center px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </button>
          
          <button
            onClick={handleClearErrors}
            disabled={errors.length === 0}
            className="flex items-center px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search errors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Error List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredErrors.length > 0 ? (
          filteredErrors.map((error) => (
            <div
              key={error.id}
              className={`p-4 border rounded-lg ${
                error.resolved
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                  : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {error.resolved ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {error.message.length > 100 ? error.message.slice(0, 100) + '...' : error.message}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(error.severity)}`}>
                        {error.severity}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <span>Source: {error.source}</span>
                      <span>First: {formatTimeAgo(error.timestamp)}</span>
                      {error.occurrences > 1 && (
                        <span>Last: {formatTimeAgo(error.lastOccurrence)}</span>
                      )}
                      {error.occurrences > 1 && (
                        <span className="text-red-600 dark:text-red-400">
                          {error.occurrences} occurrences
                        </span>
                      )}
                    </div>
                    
                    {error.stack && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                          Stack Trace
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs text-gray-800 dark:text-gray-200 overflow-x-auto">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {error.resolved ? (
                    <div className="flex items-center space-x-1 text-sm text-green-600 dark:text-green-400">
                      <Clock className="w-4 h-4" />
                      <span>Resolved {error.resolvedAt ? formatTimeAgo(error.resolvedAt) : ''}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleResolveError(error.id)}
                      className="flex items-center px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400">
            <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
            <p className="text-lg font-medium text-green-600 dark:text-green-400">No errors to display</p>
            <p className="text-sm mt-1">
              {searchTerm || severityFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Your system is running smoothly'}
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      {errors.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {errors.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Total Errors
              </div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                {errors.filter(e => !e.resolved).length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Active Errors
              </div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {errors.filter(e => e.resolved).length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Resolved Errors
              </div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {errors.reduce((sum, e) => sum + e.occurrences, 0)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Total Occurrences
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ErrorMonitor