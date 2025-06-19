import React, { useState } from 'react'
import { 
  Activity, 
  Terminal, 
  BarChart, 
  AlertTriangle, 
  Clock,
  Database,
  Layers,
  RefreshCw
} from 'lucide-react'
import LogViewer from '../components/monitoring/LogViewer'
import PerformanceMetrics from '../components/monitoring/PerformanceMetrics'
import ErrorMonitor from '../components/monitoring/ErrorMonitor'
import BalanceChangeTracker from '../components/monitoring/BalanceChangeTracker'
import SystemHealthMonitor from '../components/monitoring/SystemHealthMonitor'
import ConsoleOutput from '../components/monitoring/ConsoleOutput'
import TradingAnalytics from '../components/monitoring/TradingAnalytics'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'

const Monitoring: React.FC = () => {
  const { currentSession } = useSelector((state: RootState) => state.session)
  const [activeTab, setActiveTab] = useState<'console' | 'logs' | 'errors' | 'performance' | 'health' | 'balances' | 'analytics'>('console')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshData = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  const tabs = [
    { id: 'console', name: 'Console Output', icon: Terminal },
    { id: 'logs', name: 'System Logs', icon: Layers },
    { id: 'errors', name: 'Error Monitor', icon: AlertTriangle },
    { id: 'performance', name: 'Performance', icon: Activity },
    { id: 'health', name: 'System Health', icon: Database },
    { id: 'balances', name: 'Balance Changes', icon: Clock },
    { id: 'analytics', name: 'Trading Analytics', icon: BarChart }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Monitoring & Logging
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time system monitoring, logs, and performance analytics
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh All
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="flex space-x-6 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-solana-500 text-solana-600 dark:text-solana-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'console' && (
            <ConsoleOutput 
              title="Live Console Output"
              maxHeight="600px"
              showControls={true}
              autoScroll={true}
              refreshInterval={2000}
            />
          )}

          {activeTab === 'logs' && (
            <LogViewer 
              title="System Logs"
              maxHeight="600px"
              showControls={true}
              autoScroll={true}
              showTimestamps={true}
              showSource={true}
            />
          )}

          {activeTab === 'errors' && (
            <ErrorMonitor />
          )}

          {activeTab === 'performance' && (
            <PerformanceMetrics 
              refreshInterval={5000}
              showCharts={true}
            />
          )}

          {activeTab === 'health' && (
            <SystemHealthMonitor 
              refreshInterval={30000}
              showDetails={true}
            />
          )}

          {activeTab === 'balances' && (
            <BalanceChangeTracker 
              tokenSymbol={currentSession?.tokenName || 'Tokens'}
              refreshInterval={10000}
            />
          )}

          {activeTab === 'analytics' && (
            <TradingAnalytics 
              tokenSymbol={currentSession?.tokenName || 'Tokens'}
              refreshInterval={10000}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Monitoring