import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  Zap,
  Target,
  Timer,
  RotateCcw,
  ArrowDown,
  Database,
  Calculator,
  Trash2
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import { backendService } from '../../services/backendService'
import { monitoringService, SystemHealth } from '../../services/monitoringService'
import toast from 'react-hot-toast'

interface SystemHealthMonitorProps {
  refreshInterval?: number
  showDetails?: boolean
}

const SystemHealthMonitor: React.FC<SystemHealthMonitorProps> = ({
  refreshInterval = 30000,
  showDetails = true
}) => {
  const { status: wsStatus } = useSelector((state: RootState) => state.websocket)
  const { swapConfig } = useSelector((state: RootState) => state.config)
  
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Check system health periodically
  useEffect(() => {
    checkSystemHealth()
    
    const interval = setInterval(() => {
      checkSystemHealth()
    }, refreshInterval)
    
    return () => clearInterval(interval)
  }, [refreshInterval, wsStatus])

  const checkSystemHealth = async () => {
    setIsRefreshing(true)
    
    try {
      const health = await monitoringService.getSystemHealth()
      setSystemHealth(health)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to check system health:', error)
      toast.error('Failed to check system health')
    } finally {
      setIsRefreshing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20'
      case 'degraded':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20'
      case 'outage':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-4 h-4" />
      case 'degraded':
        return <AlertCircle className="w-4 h-4" />
      case 'outage':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return 'Operational'
      case 'degraded':
        return 'Degraded'
      case 'outage':
        return 'Outage'
      default:
        return 'Unknown'
    }
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

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`
  }

  // Calculate overall system status
  const overallStatus = systemHealth?.components.every(c => c.status === 'operational') 
    ? 'operational' 
    : systemHealth?.components.some(c => c.status === 'outage') 
    ? 'outage' 
    : 'degraded'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            System Health Monitor
          </h2>
        </div>
        
        <div className="flex items-center space-x-3">
          {lastUpdated && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          
          <button
            onClick={checkSystemHealth}
            disabled={isRefreshing}
            className="flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status */}
      {systemHealth && (
        <div className={`mb-6 p-4 rounded-lg ${getStatusColor(overallStatus)}`}>
          <div className="flex items-center space-x-3">
            {getStatusIcon(overallStatus)}
            <div>
              <h3 className="font-medium">
                System Status: {getStatusText(overallStatus)}
              </h3>
              <p className="text-sm mt-1">
                {overallStatus === 'operational' 
                  ? 'All systems are operational' 
                  : overallStatus === 'degraded'
                  ? 'Some systems are experiencing issues'
                  : 'Critical systems are down'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Uptime */}
      {systemHealth && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-300">
                System Uptime
              </h3>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100 mt-1">
                {formatUptime(systemHealth.uptime)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Component Grid */}
      {systemHealth ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemHealth.components.map((component) => {
            return (
              <div
                key={component.name}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      component.status === 'operational' ? 'bg-green-500' :
                      component.status === 'degraded' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {component.name}
                    </h3>
                  </div>
                  
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(component.status)}`}>
                    {getStatusIcon(component.status)}
                    <span>{getStatusText(component.status)}</span>
                  </div>
                </div>
                
                {showDetails && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Last checked:</span>
                      <span>{formatTimeAgo(component.lastChecked)}</span>
                    </div>
                    
                    {component.responseTime && (
                      <div className="flex justify-between">
                        <span>Response time:</span>
                        <span>{component.responseTime}ms</span>
                      </div>
                    )}
                    
                    {component.details && (
                      <div className="pt-1 mt-1 border-t border-gray-200 dark:border-gray-700">
                        {component.details}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading system health data...</p>
        </div>
      )}
    </div>
  )
}

export default SystemHealthMonitor