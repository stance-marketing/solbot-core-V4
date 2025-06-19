import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Coins, 
  RefreshCw,
  ArrowRight,
  Clock,
  BarChart3
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'

interface BalanceChange {
  id: string
  timestamp: number
  walletNumber: number
  walletAddress: string
  solBefore: number
  solAfter: number
  solChange: number
  tokenBefore: number
  tokenAfter: number
  tokenChange: number
  source: string
  details?: string
}

interface BalanceChangeTrackerProps {
  changes?: BalanceChange[]
  tokenSymbol?: string
  refreshInterval?: number
}

const BalanceChangeTracker: React.FC<BalanceChangeTrackerProps> = ({
  changes: propChanges,
  tokenSymbol = 'Tokens',
  refreshInterval = 10000
}) => {
  const { adminWallet, tradingWallets } = useSelector((state: RootState) => state.wallet)
  const [changes, setChanges] = useState<BalanceChange[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | 'all'>('1h')
  
  const [solBalanceHistory, setSolBalanceHistory] = useState<any[]>([])
  const [tokenBalanceHistory, setTokenBalanceHistory] = useState<any[]>([])

  // Initialize with mock data or use provided changes
  useEffect(() => {
    if (propChanges) {
      setChanges(propChanges)
    } else {
      // Generate some mock balance changes
      const mockChanges: BalanceChange[] = []
      
      // Generate data points for the last 24 hours
      const now = Date.now()
      const hourMs = 3600000
      
      for (let i = 24; i >= 0; i--) {
        const timestamp = now - (i * hourMs)
        
        // Add a change for admin wallet
        if (adminWallet) {
          const solChange = (Math.random() - 0.4) * 0.1 // Slightly biased towards negative
          const tokenChange = (Math.random() - 0.4) * 100
          
          mockChanges.push({
            id: `admin-${timestamp}`,
            timestamp,
            walletNumber: 0,
            walletAddress: adminWallet.publicKey,
            solBefore: adminWallet.solBalance - solChange,
            solAfter: adminWallet.solBalance,
            solChange,
            tokenBefore: adminWallet.tokenBalance - tokenChange,
            tokenAfter: adminWallet.tokenBalance,
            tokenChange,
            source: Math.random() > 0.5 ? 'Trading' : 'Collection',
            details: `Balance update at ${new Date(timestamp).toLocaleTimeString()}`
          })
        }
        
        // Add changes for a few trading wallets
        for (let j = 0; j < Math.min(3, tradingWallets.length); j++) {
          const wallet = tradingWallets[j]
          const solChange = (Math.random() - 0.6) * 0.05 // More biased towards negative
          const tokenChange = (Math.random() - 0.6) * 50
          
          mockChanges.push({
            id: `wallet-${j}-${timestamp}`,
            timestamp,
            walletNumber: wallet.number,
            walletAddress: wallet.publicKey,
            solBefore: wallet.solBalance - solChange,
            solAfter: wallet.solBalance,
            solChange,
            tokenBefore: wallet.tokenBalance - tokenChange,
            tokenAfter: wallet.tokenBalance,
            tokenChange,
            source: Math.random() > 0.7 ? 'Buy' : 'Sell',
            details: `Transaction at ${new Date(timestamp).toLocaleTimeString()}`
          })
        }
      }
      
      setChanges(mockChanges)
    }
  }, [propChanges, adminWallet, tradingWallets])

  // Generate chart data
  useEffect(() => {
    if (changes.length === 0) return
    
    // Filter changes based on time range
    const now = Date.now()
    const timeRangeMs = timeRange === '1h' ? 3600000 : 
                        timeRange === '24h' ? 86400000 : 
                        timeRange === '7d' ? 604800000 : 
                        Number.MAX_SAFE_INTEGER
    
    const filteredChanges = changes.filter(change => 
      now - change.timestamp < timeRangeMs
    )
    
    // Group changes by hour
    const hourlyChanges = new Map<string, { 
      time: string, 
      solChange: number, 
      tokenChange: number,
      adminSolBalance: number,
      adminTokenBalance: number,
      tradingSolBalance: number,
      tradingTokenBalance: number
    }>()
    
    filteredChanges.forEach(change => {
      const hour = new Date(change.timestamp).toLocaleTimeString([], { hour: '2-digit' })
      
      if (!hourlyChanges.has(hour)) {
        hourlyChanges.set(hour, { 
          time: hour, 
          solChange: 0, 
          tokenChange: 0,
          adminSolBalance: 0,
          adminTokenBalance: 0,
          tradingSolBalance: 0,
          tradingTokenBalance: 0
        })
      }
      
      const entry = hourlyChanges.get(hour)!
      entry.solChange += change.solChange
      entry.tokenChange += change.tokenChange
      
      if (change.walletNumber === 0) {
        entry.adminSolBalance = change.solAfter
        entry.adminTokenBalance = change.tokenAfter
      } else {
        entry.tradingSolBalance += change.solAfter
        entry.tradingTokenBalance += change.tokenAfter
      }
    })
    
    // Convert to arrays for charts
    const solData = Array.from(hourlyChanges.values())
      .sort((a, b) => a.time.localeCompare(b.time))
    
    const tokenData = Array.from(hourlyChanges.values())
      .sort((a, b) => a.time.localeCompare(b.time))
    
    setSolBalanceHistory(solData)
    setTokenBalanceHistory(tokenData)
  }, [changes, timeRange])

  const refreshData = () => {
    setIsRefreshing(true)
    
    // In a real implementation, you would fetch fresh data
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
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

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400'
    if (change < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4" />
    if (change < 0) return <TrendingDown className="w-4 h-4" />
    return null
  }

  const formatChange = (change: number, isSol: boolean = true) => {
    const prefix = change > 0 ? '+' : ''
    return `${prefix}${change.toFixed(isSol ? 6 : 2)}`
  }

  // Calculate total changes
  const totalSolChange = changes.reduce((sum, change) => sum + change.solChange, 0)
  const totalTokenChange = changes.reduce((sum, change) => sum + change.tokenChange, 0)
  
  // Get recent changes (last hour)
  const recentChanges = changes.filter(change => Date.now() - change.timestamp < 3600000)
  const recentSolChange = recentChanges.reduce((sum, change) => sum + change.solChange, 0)
  const recentTokenChange = recentChanges.reduce((sum, change) => sum + change.tokenChange, 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Balance Change Tracker
          </h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          
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

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total SOL Change</span>
          </div>
          <div className={`text-xl font-bold ${getChangeColor(totalSolChange)}`}>
            {formatChange(totalSolChange)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            All time
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Coins className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Total {tokenSymbol} Change</span>
          </div>
          <div className={`text-xl font-bold ${getChangeColor(totalTokenChange)}`}>
            {formatChange(totalTokenChange, false)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            All time
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Recent SOL Change</span>
          </div>
          <div className={`text-xl font-bold ${getChangeColor(recentSolChange)}`}>
            {formatChange(recentSolChange)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last hour
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Coins className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Recent {tokenSymbol} Change</span>
          </div>
          <div className={`text-xl font-bold ${getChangeColor(recentTokenChange)}`}>
            {formatChange(recentTokenChange, false)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last hour
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* SOL Balance Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="w-4 h-4 text-blue-500" />
            <h3 className="font-medium text-gray-900 dark:text-white">
              SOL Balance History
            </h3>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={solBalanceHistory}>
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
                  dataKey="adminSolBalance" 
                  name="Admin SOL" 
                  stroke="#3B82F6" 
                  activeDot={{ r: 8 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="tradingSolBalance" 
                  name="Trading SOL" 
                  stroke="#10B981"
                />
                <Line 
                  type="monotone" 
                  dataKey="solChange" 
                  name="SOL Change" 
                  stroke="#F59E0B" 
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Token Balance Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Coins className="w-4 h-4 text-green-500" />
            <h3 className="font-medium text-gray-900 dark:text-white">
              {tokenSymbol} Balance History
            </h3>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tokenBalanceHistory}>
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
                  dataKey="adminTokenBalance" 
                  name={`Admin ${tokenSymbol}`}
                  stroke="#8B5CF6" 
                  activeDot={{ r: 8 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="tradingTokenBalance" 
                  name={`Trading ${tokenSymbol}`}
                  stroke="#EC4899"
                />
                <Line 
                  type="monotone" 
                  dataKey="tokenChange" 
                  name={`${tokenSymbol} Change`}
                  stroke="#F97316" 
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Changes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Recent Balance Changes
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing last {Math.min(5, changes.length)} of {changes.length} changes
          </div>
        </div>
        
        <div className="space-y-3">
          {changes.slice(0, 5).map((change) => (
            <div
              key={change.id}
              className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {change.walletNumber === 0 ? 'Admin Wallet' : `Wallet #${change.walletNumber}`}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {change.source}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatTimestamp(change.timestamp)} ({formatTimeAgo(change.timestamp)})
                  </div>
                  
                  {change.details && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {change.details}
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <div className={`flex items-center space-x-1 ${getChangeColor(change.solChange)}`}>
                    {getChangeIcon(change.solChange)}
                    <span className="font-medium">{formatChange(change.solChange)} SOL</span>
                  </div>
                  
                  <div className={`flex items-center space-x-1 mt-1 ${getChangeColor(change.tokenChange)}`}>
                    {getChangeIcon(change.tokenChange)}
                    <span className="font-medium">{formatChange(change.tokenChange, false)} {tokenSymbol}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {changes.length > 5 && (
          <div className="mt-4 text-center">
            <button className="flex items-center mx-auto px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
              View All Changes
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BalanceChangeTracker