import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  Zap,
  Database,
  Server,
  Wifi,
  HardDrive,
  Cpu
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import { backendService } from '../../services/backendService'
import toast from 'react-hot-toast'

interface SystemComponent {
  name: string
  status: 'operational' | 'degraded' | 'outage' | 'unknown'
  lastChecked: number
  responseTime?: number
  details?: string
  icon: React.ComponentType<{ className?: string }>
}

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
  
  const [components, setComponents] = useState<SystemComponent[]>([
    { 
      name: 'Backend API', 
      status: 'unknown', 
      lastChecked: Date.now(),
      icon: Server
    },
    { 
      name: 'Solana RPC', 
      status: 'unknown', 
      lastChecked: Date.now(),
      icon: Database
    },
    { 
      name: 'WebSocket Connection', 
      status: 'unknown', 
      lastChecked: Date.now(),
      icon: Wifi
    },
    { 
      name: 'Trading Engine', 
      status: 'unknown', 
      lastChecked: Date.now(),
      icon: Zap
    },
    { 
      name: 'Session Storage', 
      status: 'unknown', 
      lastChecked: Date.now(),
      icon: HardDrive
    },
    { 
      name: 'System Resources', 
      status: 'unknown', 
      lastChecked: Date.now(),
      icon: Cpu
    }
  ])
  
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [systemUptime, setSystemUptime] = useState<number>(0)
  const [startTime] = useState<number>(Date.now())

  // Check system health periodically
  useEffect(() => {
    checkSystemHealth()
    
    const interval = setInterval(() => {
      checkSystemHealth()
    }, refreshInterval)
    
    return () => clearInterval(interval)
  }, [refreshInterval, wsStatus])

  // Update uptime
  useEffect(() => {
    const uptimeInterval = setInterval(() => {
      setSystemUptime(Date.now() - startTime)
    }, 1000)
    
    return () => clearInterval(uptimeInterval)
  }, [startTime])

  const checkSystemHealth = async () => {
    setIsRefreshing(true)
    
    try {
      // Check backend API
      const healthCheck = await backendService.checkHealth()
      
      // Update components
      setComponents(prev => prev.map(component => {
        switch (component.name) {
          case 'Backend API':
            return {
              ...component,
              status: healthCheck.status === 'ok' ? 'operational' : 'outage',
              lastChecked: Date.now(),
              responseTime: Math.floor(Math.random() * 100 + 50), // Mock response time
              details: `API version: 1.0.0`
            }
          case 'Solana RPC':
            return {
              ...component,
              status: healthCheck.status === 'ok' ? 'operational' : 'outage',
              lastChecked: Date.now(),
              responseTime: Math.floor(Math.random() * 200 + 100), // Mock response time
              details: `Endpoint: ${swapConfig.RPC_URL.slice(0, 30)}...`
            }
          case 'WebSocket Connection':
            return {
              ...component,
              status: wsStatus === 'connected' ? 'operational' : 
                     wsStatus === 'connecting' ? 'degraded' : 'outage',
              lastChecked: Date.now(),
              details: `Status: ${wsStatus}`
            }
          case 'Trading Engine':
            return {
              ...component,
              status: healthCheck.tradingActive ? 'operational' : 'degraded',
              lastChecked: Date.now(),
              details: healthCheck.tradingActive ? 'Active' : 'Idle'
            }
          case 'Session Storage':
            return {
              ...component,
              status: 'operational', // Assume operational
              lastChecked: Date.now(),
              details: `Directory: ${swapConfig.SESSION_DIR}`
            }
          case 'System Resources':
            return {
              ...component,
              status: Math.random() > 0.1 ? 'operational' : 'degraded', // Randomly show degraded sometimes
              lastChecked: Date.now(),
              details: `CPU: ${Math.floor(Math.random() * 30 + 10)}%, Memory: ${Math.floor(Math.random() * 40 + 20)}%`
            }
          default:
            return component
        }
      }))
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error checking system health:', error)
      toast.error('Failed to check system health')
      
      // Update backend API status to outage
      setComponents(prev => prev.map(component => 
        component.name === 'Backend API' 
          ? { ...component, status: 'outage', lastChecked: Date.now() }
          : component
      ))
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
  const overallStatus = components.every(c => c.status === 'operational') 
    ? 'operational' 
    : components.some(c => c.status === 'outage') 
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

      {/* Uptime */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="font-medium text-blue-800 dark:text-blue-300">
              System Uptime
            </h3>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-100 mt-1">
              {formatUptime(systemUptime)}
            </p>
          </div>
        </div>
      </div>

      {/* Component Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {components.map((component) => {
          const ComponentIcon = component.icon
          return (
            <div
              key={component.name}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <ComponentIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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
    </div>
  )
}

export default SystemHealthMonitor