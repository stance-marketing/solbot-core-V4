import React, { useState, useEffect } from 'react'
import { 
  Database, 
  RefreshCw, 
  Clock, 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Coins,
  Activity,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  AreaChart,
  Area
} from 'recharts'
import { monitoringService, PerformanceMetric } from '../../services/monitoringService'
import toast from 'react-hot-toast'

interface PerformanceMetricsProps {
  refreshInterval?: number
  showCharts?: boolean
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  refreshInterval = 5000,
  showCharts = true
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  const [cpuHistory, setCpuHistory] = useState<any[]>([])
  const [memoryHistory, setMemoryHistory] = useState<any[]>([])
  const [transactionHistory, setTransactionHistory] = useState<any[]>([])
  const [latencyHistory, setLatencyHistory] = useState<any[]>([])

  // Fetch metrics from backend
  useEffect(() => {
    fetchMetrics()
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchMetrics()
    }, refreshInterval)
    
    return () => clearInterval(interval)
  }, [refreshInterval])

  const fetchMetrics = async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      const fetchedMetrics = await monitoringService.getPerformanceMetrics()
      setMetrics(fetchedMetrics)
      setLastUpdated(new Date())
      
      // Update chart data
      updateChartData(fetchedMetrics)
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const updateChartData = (newMetrics: PerformanceMetric[]) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    // CPU Usage
    const cpuMetric = newMetrics.find(m => m.name === 'CPU Usage')
    if (cpuMetric) {
      setCpuHistory(prev => {
        const newData = [...prev, { time: timestamp, CPU: cpuMetric.value }]
        return newData.length > 20 ? newData.slice(-20) : newData
      })
    }
    
    // Memory Usage
    const memoryMetric = newMetrics.find(m => m.name === 'Memory Usage')
    if (memoryMetric) {
      setMemoryHistory(prev => {
        const newData = [...prev, { time: timestamp, Memory: memoryMetric.value }]
        return newData.length > 20 ? newData.slice(-20) : newData
      })
    }
    
    // Transaction Performance
    const txMetric = newMetrics.find(m => m.name === 'Transactions/sec')
    const successRateMetric = newMetrics.find(m => m.name === 'Success Rate')
    if (txMetric && successRateMetric) {
      setTransactionHistory(prev => {
        const newData = [...prev, { 
          time: timestamp, 
          TPS: txMetric.value, 
          Success: successRateMetric.value 
        }]
        return newData.length > 20 ? newData.slice(-20) : newData
      })
    }
    
    // Network Latency
    const latencyMetric = newMetrics.find(m => m.name === 'Network Latency')
    if (latencyMetric) {
      setLatencyHistory(prev => {
        const newData = [...prev, { time: timestamp, Latency: latencyMetric.value }]
        return newData.length > 20 ? newData.slice(-20) : newData
      })
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      await fetchMetrics()
      toast.success('Performance metrics refreshed')
    } catch (error) {
      toast.error('Failed to refresh performance metrics')
    } finally {
      setIsRefreshing(false)
    }
  }

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
          <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
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
            onClick={refreshData}
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
                    <XAxis dataKey="time" tick={{ fill: '#9CA3AF' }} />
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
                    <XAxis dataKey="time" tick={{ fill: '#9CA3AF' }} />
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
                    <XAxis dataKey="time" tick={{ fill: '#9CA3AF' }} />
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
                      name="TPS" 
                      stroke="#F97316" 
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Success" 
                      name="Success" 
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
                  <BarChart data={latencyHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" tick={{ fill: '#9CA3AF' }} />
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
                  </BarChart>
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