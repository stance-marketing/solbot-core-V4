import React, { useState, useEffect } from 'react'
import { 
  BarChart, 
  TrendingUp, 
  Clock, 
  Activity, 
  Zap,
  RefreshCw,
  Cpu,
  HardDrive,
  Wifi,
  Database
} from 'lucide-react'
import { 
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from 'recharts'

interface MetricData {
  name: string
  value: number
  unit: string
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
}

interface ChartData {
  name: string
  [key: string]: any
}

interface PerformanceMetricsProps {
  refreshInterval?: number
  showCharts?: boolean
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  refreshInterval = 5000,
  showCharts = true
}) => {
  const [metrics, setMetrics] = useState<MetricData[]>([
    { name: 'CPU Usage', value: 0, unit: '%' },
    { name: 'Memory Usage', value: 0, unit: 'MB' },
    { name: 'Network Latency', value: 0, unit: 'ms' },
    { name: 'Transactions/sec', value: 0, unit: 'tx/s' },
    { name: 'Success Rate', value: 0, unit: '%' },
    { name: 'Uptime', value: 0, unit: 'min' }
  ])
  
  const [cpuHistory, setCpuHistory] = useState<ChartData[]>([])
  const [memoryHistory, setMemoryHistory] = useState<ChartData[]>([])
  const [transactionHistory, setTransactionHistory] = useState<ChartData[]>([])
  const [latencyHistory, setLatencyHistory] = useState<ChartData[]>([])
  
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Simulate fetching performance metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      setIsRefreshing(true)
      
      try {
        // In a real implementation, you would fetch metrics from your backend
        // For now, we'll generate random metrics
        
        // Generate random values with some continuity from previous values
        const newMetrics = metrics.map(metric => {
          let newValue: number
          
          switch (metric.name) {
            case 'CPU Usage':
              newValue = Math.min(100, Math.max(0, metric.value + (Math.random() - 0.5) * 10))
              break
            case 'Memory Usage':
              newValue = Math.max(50, metric.value + (Math.random() - 0.5) * 20)
              break
            case 'Network Latency':
              newValue = Math.max(10, metric.value + (Math.random() - 0.5) * 30)
              break
            case 'Transactions/sec':
              newValue = Math.max(0, metric.value + (Math.random() - 0.5) * 5)
              break
            case 'Success Rate':
              newValue = Math.min(100, Math.max(70, metric.value + (Math.random() - 0.5) * 5))
              break
            case 'Uptime':
              newValue = metric.value + (refreshInterval / 60000) // Convert ms to minutes
              break
            default:
              newValue = metric.value
          }
          
          const change = newValue - metric.value
          const changeType = change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral'
          
          return {
            ...metric,
            value: Number(newValue.toFixed(2)),
            change: Number(Math.abs(change).toFixed(2)),
            changeType
          }
        })
        
        setMetrics(newMetrics as MetricData[])
        
        // Update history for charts
        const timestamp = new Date()
        const timeString = timestamp.toLocaleTimeString()
        
        setCpuHistory(prev => {
          const newHistory = [...prev, { name: timeString, CPU: newMetrics[0].value }]
          return newHistory.slice(-20) // Keep last 20 data points
        })
        
        setMemoryHistory(prev => {
          const newHistory = [...prev, { name: timeString, Memory: newMetrics[1].value }]
          return newHistory.slice(-20)
        })
        
        setTransactionHistory(prev => {
          const newHistory = [...prev, { 
            name: timeString, 
            TPS: newMetrics[3].value,
            Success: newMetrics[4].value
          }]
          return newHistory.slice(-20)
        })
        
        setLatencyHistory(prev => {
          const newHistory = [...prev, { name: timeString, Latency: newMetrics[2].value }]
          return newHistory.slice(-20)
        })
        
        setLastUpdated(timestamp)
      } catch (error) {
        console.error('Error fetching performance metrics:', error)
      } finally {
        setIsRefreshing(false)
      }
    }
    
    fetchMetrics() // Initial fetch
    
    const interval = setInterval(fetchMetrics, refreshInterval)
    return () => clearInterval(interval)
  }, [metrics, refreshInterval])

  const getMetricIcon = (name: string) => {
    switch (name) {
      case 'CPU Usage':
        return <Cpu className="w-5 h-5 text-blue-500" />
      case 'Memory Usage':
        return <HardDrive className="w-5 h-5 text-purple-500" />
      case 'Network Latency':
        return <Wifi className="w-5 h-5 text-green-500" />
      case 'Transactions/sec':
        return <Activity className="w-5 h-5 text-orange-500" />
      case 'Success Rate':
        return <TrendingUp className="w-5 h-5 text-red-500" />
      case 'Uptime':
        return <Clock className="w-5 h-5 text-indigo-500" />
      default:
        return <Zap className="w-5 h-5 text-gray-500" />
    }
  }

  const getChangeColor = (changeType?: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-500'
      case 'decrease':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getChangeIcon = (changeType?: string) => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="w-3 h-3" />
      case 'decrease':
        return <TrendingUp className="w-3 h-3 transform rotate-180" />
      default:
        return null
    }
  }

  const formatValue = (value: number, unit: string) => {
    if (unit === 'min') {
      const hours = Math.floor(value / 60)
      const minutes = Math.floor(value % 60)
      return `${hours}h ${minutes}m`
    }
    return `${value} ${unit}`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance Metrics
          </h2>
        </div>
        
        <div className="flex items-center space-x-3">
          {lastUpdated && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          
          <button
            onClick={() => {}}
            disabled={isRefreshing}
            className="flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                {getMetricIcon(metric.name)}
              </div>
              
              {metric.change !== undefined && metric.changeType && (
                <div className={`flex items-center space-x-1 text-xs ${getChangeColor(metric.changeType)}`}>
                  {getChangeIcon(metric.changeType)}
                  <span>{metric.change}</span>
                </div>
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {metric.name}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {formatValue(metric.value, metric.unit)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {showCharts && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CPU Usage Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Cpu className="w-4 h-4 text-blue-500" />
                <h3 className="font-medium text-gray-900 dark:text-white">
                  CPU Usage
                </h3>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cpuHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" tick={{ fill: '#9CA3AF' }} />
                    <YAxis tick={{ fill: '#9CA3AF' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        borderColor: '#374151',
                        color: '#F9FAFB'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="CPU" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Memory Usage Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center space-x-2 mb-4">
                <HardDrive className="w-4 h-4 text-purple-500" />
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Memory Usage
                </h3>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={memoryHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" tick={{ fill: '#9CA3AF' }} />
                    <YAxis tick={{ fill: '#9CA3AF' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        borderColor: '#374151',
                        color: '#F9FAFB'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Memory" 
                      stroke="#8B5CF6" 
                      fill="#8B5CF6" 
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Transaction Performance Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="w-4 h-4 text-orange-500" />
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Transaction Performance
                </h3>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={transactionHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" tick={{ fill: '#9CA3AF' }} />
                    <YAxis tick={{ fill: '#9CA3AF' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        borderColor: '#374151',
                        color: '#F9FAFB'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="TPS" 
                      stroke="#F97316" 
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Success" 
                      stroke="#22C55E"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Network Latency Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Wifi className="w-4 h-4 text-green-500" />
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Network Latency
                </h3>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={latencyHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" tick={{ fill: '#9CA3AF' }} />
                    <YAxis tick={{ fill: '#9CA3AF' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        borderColor: '#374151',
                        color: '#F9FAFB'
                      }}
                    />
                    <Bar 
                      dataKey="Latency" 
                      fill="#10B981"
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Database className="w-4 h-4 text-indigo-500" />
              <h3 className="font-medium text-gray-900 dark:text-white">
                System Health
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Backend API
                    </span>
                  </div>
                  <span className="text-xs text-green-600 dark:text-green-400">
                    Operational
                  </span>
                </div>
              </div>
              
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Solana RPC
                    </span>
                  </div>
                  <span className="text-xs text-green-600 dark:text-green-400">
                    Connected
                  </span>
                </div>
              </div>
              
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Trading Engine
                    </span>
                  </div>
                  <span className="text-xs text-green-600 dark:text-green-400">
                    Running
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PerformanceMetrics