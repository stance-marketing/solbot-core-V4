import React, { useState, useEffect } from 'react'
import { 
  Database, 
  RefreshCw, 
  Clock, 
  BarChart3, 
  TrendingUp,
  DollarSign,
  Coins,
  Activity,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink
} from 'lucide-react'

interface PoolData {
  id: string
  name: string
  address: string
  tokenAddress: string
  tokenSymbol: string
  tokenDecimals: number
  solPrice: number
  tokenPrice: number
  liquidity: number
  volume24h: number
  fees24h: number
  priceChange: {
    h1: number
    h24: number
  }
  transactions: {
    h24: {
      buys: number
      sells: number
    }
  }
  lastUpdated: number
  cacheExpiry: number
}

interface PoolInfoMonitorProps {
  tokenAddress: string
  tokenSymbol: string
  onPoolUpdate?: (poolData: PoolData) => void
  autoRefresh?: boolean
  refreshInterval?: number
}

const PoolInfoMonitor: React.FC<PoolInfoMonitorProps> = ({
  tokenAddress,
  tokenSymbol,
  onPoolUpdate,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [poolData, setPoolData] = useState<PoolData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<number>(0)
  const [cacheStatus, setCacheStatus] = useState<'fresh' | 'stale' | 'expired'>('expired')

  // Fetch pool data on mount and when tokenAddress changes
  useEffect(() => {
    if (tokenAddress) {
      fetchPoolData()
    }
  }, [tokenAddress])

  // Auto-refresh pool data
  useEffect(() => {
    if (!autoRefresh || !tokenAddress) return

    const interval = setInterval(() => {
      fetchPoolData()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, tokenAddress])

  // Update cache status
  useEffect(() => {
    if (!poolData) return

    const updateCacheStatus = () => {
      const now = Date.now()
      const age = now - poolData.lastUpdated
      
      if (age < 60000) { // Less than 1 minute
        setCacheStatus('fresh')
      } else if (age < 300000) { // Less than 5 minutes
        setCacheStatus('stale')
      } else {
        setCacheStatus('expired')
      }
    }

    updateCacheStatus()
    const interval = setInterval(updateCacheStatus, 10000) // Check every 10 seconds
    
    return () => clearInterval(interval)
  }, [poolData])

  const fetchPoolData = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock pool data
      const mockPoolData: PoolData = {
        id: `pool_${Math.random().toString(36).substr(2, 9)}`,
        name: `${tokenSymbol}/SOL`,
        address: `pool_${Math.random().toString(36).substr(2, 9)}`,
        tokenAddress,
        tokenSymbol,
        tokenDecimals: 9,
        solPrice: 180 + Math.random() * 10,
        tokenPrice: 0.001 + Math.random() * 0.0005,
        liquidity: 1000000 + Math.random() * 500000,
        volume24h: 500000 + Math.random() * 300000,
        fees24h: 1500 + Math.random() * 1000,
        priceChange: {
          h1: (Math.random() - 0.5) * 2,
          h24: (Math.random() - 0.5) * 10
        },
        transactions: {
          h24: {
            buys: 1200 + Math.floor(Math.random() * 300),
            sells: 800 + Math.floor(Math.random() * 200)
          }
        },
        lastUpdated: Date.now(),
        cacheExpiry: Date.now() + 300000 // 5 minutes
      }
      
      setPoolData(mockPoolData)
      setLastRefresh(Date.now())
      
      if (onPoolUpdate) {
        onPoolUpdate(mockPoolData)
      }
    } catch (error) {
      console.error('Failed to fetch pool data:', error)
      setError('Failed to fetch pool data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(2)}K`
    } else {
      return `$${amount.toFixed(2)}`
    }
  }

  const formatPrice = (price: number) => {
    if (price < 0.0001) {
      return `$${price.toExponential(4)}`
    } else if (price < 0.01) {
      return `$${price.toFixed(6)}`
    } else {
      return `$${price.toFixed(4)}`
    }
  }

  const formatPercent = (percent: number) => {
    const prefix = percent >= 0 ? '+' : ''
    return `${prefix}${percent.toFixed(2)}%`
  }

  const getPercentColor = (percent: number) => {
    if (percent > 0) return 'text-green-600 dark:text-green-400'
    if (percent < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getCacheStatusColor = () => {
    switch (cacheStatus) {
      case 'fresh': return 'text-green-600 dark:text-green-400'
      case 'stale': return 'text-yellow-600 dark:text-yellow-400'
      case 'expired': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pool Information
          </h3>
        </div>
        
        <div className="flex items-center space-x-3">
          {poolData && (
            <div className="flex items-center space-x-2 text-sm">
              <Clock className={`w-4 h-4 ${getCacheStatusColor()}`} />
              <span className={`${getCacheStatusColor()}`}>
                {cacheStatus === 'fresh' ? 'Fresh' : cacheStatus === 'stale' ? 'Stale' : 'Expired'}
              </span>
            </div>
          )}
          
          <button
            onClick={fetchPoolData}
            disabled={isLoading}
            className="flex items-center px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {poolData ? (
        <div className="space-y-6">
          {/* Pool Header */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                {poolData.name} Pool
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Last updated: {formatTime(poolData.lastUpdated)}
                </span>
                <a
                  href={`https://solscan.io/token/${poolData.tokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>View on Solscan</span>
                </a>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-1 ${getPercentColor(poolData.priceChange.h24)}`}>
                {poolData.priceChange.h24 >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span className="font-medium">
                  {formatPercent(poolData.priceChange.h24)} (24h)
                </span>
              </div>
            </div>
          </div>

          {/* Price & Liquidity */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Coins className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{tokenSymbol} Price</span>
              </div>
              <div className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
                {formatPrice(poolData.tokenPrice)}
              </div>
              <div className={`text-xs ${getPercentColor(poolData.priceChange.h1)}`}>
                {formatPercent(poolData.priceChange.h1)} (1h)
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">SOL Price</span>
              </div>
              <div className="text-xl font-bold text-green-900 dark:text-green-100">
                ${poolData.solPrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Market price
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Liquidity</span>
              </div>
              <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
                {formatCurrency(poolData.liquidity)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Total pool value
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">24h Volume</span>
              </div>
              <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                {formatCurrency(poolData.volume24h)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Trading volume
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">24h Transactions</span>
                <Target className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {poolData.transactions.h24.buys + poolData.transactions.h24.sells}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Total swaps
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-sm font-medium">{poolData.transactions.h24.buys}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                    <TrendingDown className="w-3 h-3" />
                    <span className="text-sm font-medium">{poolData.transactions.h24.sells}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">24h Fees</span>
                <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(poolData.fees24h)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Generated from {formatCurrency(poolData.volume24h)} volume
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pool Cache</span>
                <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {cacheStatus === 'fresh' ? 'Fresh' : cacheStatus === 'stale' ? 'Stale' : 'Expired'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Expires: {formatTime(poolData.cacheExpiry)}
              </div>
            </div>
          </div>

          {/* Exchange Rate */}
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-indigo-900 dark:text-indigo-100">Current Exchange Rate</h4>
              <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-sm text-indigo-700 dark:text-indigo-300">
                  1 SOL =
                </div>
                <div className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
                  {(1 / poolData.tokenPrice).toFixed(0)} {tokenSymbol}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-indigo-700 dark:text-indigo-300">
                  1 {tokenSymbol} =
                </div>
                <div className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
                  {poolData.tokenPrice.toFixed(6)} SOL
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Pool Information
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {isLoading ? 'Loading pool information...' : 'Click refresh to load pool information'}
          </p>
          {isLoading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PoolInfoMonitor