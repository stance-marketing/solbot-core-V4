import React, { useState, useEffect } from 'react'
import { 
  DollarSign, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Eye,
  EyeOff,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Wallet
} from 'lucide-react'

interface WalletBalance {
  walletNumber: number
  publicKey: string
  solBalance: number
  tokenBalance: number
  previousSolBalance: number
  previousTokenBalance: number
  lastUpdated: number
  isActive: boolean
  change24h: {
    sol: number
    token: number
  }
}

interface BalanceTrackerProps {
  wallets: any[]
  tokenSymbol: string
  adminWallet?: any
  onBalanceUpdate?: (balances: WalletBalance[]) => void
  autoRefresh?: boolean
  refreshInterval?: number
}

const BalanceTracker: React.FC<BalanceTrackerProps> = ({
  wallets,
  tokenSymbol,
  adminWallet,
  onBalanceUpdate,
  autoRefresh = true,
  refreshInterval = 5000
}) => {
  const [balances, setBalances] = useState<WalletBalance[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [sortBy, setSortBy] = useState<'number' | 'sol' | 'token' | 'change'>('number')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')

  // Mock balance updates
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      updateBalances()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [wallets, autoRefresh, refreshInterval])

  // Initialize balances
  useEffect(() => {
    if (wallets.length > 0) {
      const initialBalances: WalletBalance[] = wallets.map(wallet => ({
        walletNumber: wallet.number,
        publicKey: wallet.publicKey,
        solBalance: wallet.solBalance || Math.random() * 0.1 + 0.001,
        tokenBalance: wallet.tokenBalance || Math.random() * 1000 + 100,
        previousSolBalance: wallet.solBalance || 0,
        previousTokenBalance: wallet.tokenBalance || 0,
        lastUpdated: Date.now(),
        isActive: wallet.isActive || Math.random() > 0.3,
        change24h: {
          sol: (Math.random() - 0.5) * 0.02,
          token: (Math.random() - 0.5) * 200
        }
      }))
      setBalances(initialBalances)
    }
  }, [wallets])

  const updateBalances = async () => {
    setIsRefreshing(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setBalances(prev => prev.map(balance => {
      const solChange = (Math.random() - 0.5) * 0.01
      const tokenChange = (Math.random() - 0.5) * 50
      
      return {
        ...balance,
        previousSolBalance: balance.solBalance,
        previousTokenBalance: balance.tokenBalance,
        solBalance: Math.max(0, balance.solBalance + solChange),
        tokenBalance: Math.max(0, balance.tokenBalance + tokenChange),
        lastUpdated: Date.now(),
        change24h: {
          sol: balance.change24h.sol + solChange * 0.1,
          token: balance.change24h.token + tokenChange * 0.1
        }
      }
    }))
    
    setIsRefreshing(false)
  }

  // Update parent component
  useEffect(() => {
    if (onBalanceUpdate) {
      onBalanceUpdate(balances)
    }
  }, [balances, onBalanceUpdate])

  const filteredBalances = balances
    .filter(balance => {
      if (filterActive === 'all') return true
      if (filterActive === 'active') return balance.isActive
      if (filterActive === 'inactive') return !balance.isActive
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'number':
          return a.walletNumber - b.walletNumber
        case 'sol':
          return b.solBalance - a.solBalance
        case 'token':
          return b.tokenBalance - a.tokenBalance
        case 'change':
          return b.change24h.sol - a.change24h.sol
        default:
          return a.walletNumber - b.walletNumber
      }
    })

  const totalSol = balances.reduce((sum, balance) => sum + balance.solBalance, 0)
  const totalTokens = balances.reduce((sum, balance) => sum + balance.tokenBalance, 0)
  const activeWallets = balances.filter(balance => balance.isActive).length
  const totalChange24h = balances.reduce((sum, balance) => sum + balance.change24h.sol, 0)

  const formatBalance = (amount: number, decimals: number = 6) => {
    return amount.toFixed(decimals)
  }

  const formatChange = (change: number, isPercentage: boolean = false) => {
    const prefix = change >= 0 ? '+' : ''
    const suffix = isPercentage ? '%' : ''
    return `${prefix}${change.toFixed(isPercentage ? 2 : 6)}${suffix}`
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-500'
    if (change < 0) return 'text-red-500'
    return 'text-gray-500'
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Balance Tracker
          </h3>
          {autoRefresh && (
            <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Auto-refresh</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            {showDetails ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
          
          <button
            onClick={updateBalances}
            disabled={isRefreshing}
            className="flex items-center px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total SOL</span>
          </div>
          <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
            {formatBalance(totalSol)}
          </div>
          <div className={`text-xs ${getChangeColor(totalChange24h)}`}>
            {formatChange(totalChange24h)} (24h)
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Coins className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Total {tokenSymbol}</span>
          </div>
          <div className="text-xl font-bold text-green-900 dark:text-green-100">
            {formatBalance(totalTokens, 2)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Across {balances.length} wallets
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Wallets</span>
          </div>
          <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
            {activeWallets}/{balances.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {((activeWallets / balances.length) * 100).toFixed(1)}% active
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Avg Balance</span>
          </div>
          <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
            {formatBalance(totalSol / balances.length)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            SOL per wallet
          </div>
        </div>
      </div>

      {/* Admin Wallet (if provided) */}
      {adminWallet && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Wallet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium text-purple-900 dark:text-purple-100">Admin Wallet</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300 font-mono">
                  {adminWallet.publicKey.slice(0, 8)}...{adminWallet.publicKey.slice(-8)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {formatBalance(adminWallet.solBalance || 0)} SOL
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">
                {formatBalance(adminWallet.tokenBalance || 0, 2)} {tokenSymbol}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="number">Wallet Number</option>
            <option value="sol">SOL Balance</option>
            <option value="token">Token Balance</option>
            <option value="change">24h Change</option>
          </select>
          
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as any)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Wallets</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {balances.length > 0 ? formatTime(Math.max(...balances.map(b => b.lastUpdated))) : 'Never'}
        </div>
      </div>

      {/* Balance List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredBalances.length > 0 ? (
          filteredBalances.map((balance) => (
            <div
              key={balance.walletNumber}
              className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md ${
                balance.isActive
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    balance.isActive ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Wallet #{balance.walletNumber}
                    </div>
                    {showDetails && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {balance.publicKey.slice(0, 8)}...{balance.publicKey.slice(-8)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatBalance(balance.solBalance)} SOL
                      </div>
                      {showDetails && (
                        <div className={`text-xs ${getChangeColor(balance.change24h.sol)}`}>
                          {formatChange(balance.change24h.sol)}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatBalance(balance.tokenBalance, 2)} {tokenSymbol}
                      </div>
                      {showDetails && (
                        <div className={`text-xs ${getChangeColor(balance.change24h.token)}`}>
                          {formatChange(balance.change24h.token, false)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {showDetails && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Updated: {formatTime(balance.lastUpdated)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Wallet Balances
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Wallet balances will appear here once trading begins
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BalanceTracker