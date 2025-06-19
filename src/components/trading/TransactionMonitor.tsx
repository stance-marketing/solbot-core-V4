import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  Clock,
  ExternalLink,
  Filter,
  RefreshCw,
  DollarSign,
  Coins,
  AlertTriangle,
  BarChart3,
  Target,
  Zap
} from 'lucide-react'

interface Transaction {
  id: string
  walletNumber: number
  walletAddress: string
  type: 'buy' | 'sell'
  amount: number
  tokenAmount?: number
  status: 'success' | 'failed' | 'pending' | 'retrying'
  timestamp: number
  txHash?: string
  error?: string
  retryCount?: number
  maxRetries?: number
  gasUsed?: number
  slippage?: number
  priceImpact?: number
  poolInfo?: any
}

interface TransactionStats {
  totalTransactions: number
  successfulTransactions: number
  failedTransactions: number
  totalVolume: number
  totalFees: number
  averageSlippage: number
  successRate: number
}

interface TransactionMonitorProps {
  transactions: Transaction[]
  onTransactionUpdate: (transactions: Transaction[]) => void
  tokenSymbol?: string
  isActive?: boolean
}

const TransactionMonitor: React.FC<TransactionMonitorProps> = ({
  transactions,
  onTransactionUpdate,
  tokenSymbol = 'TOKEN',
  isActive = false
}) => {
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell' | 'success' | 'failed' | 'pending'>('all')
  const [sortBy, setSortBy] = useState<'timestamp' | 'amount' | 'status'>('timestamp')
  const [mockTransactions, setMockTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    totalVolume: 0,
    totalFees: 0,
    averageSlippage: 0,
    successRate: 0
  })

  // Mock transaction generator for demo
  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      if (Math.random() > 0.6) { // 40% chance to generate a transaction
        const newTransaction: Transaction = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          walletNumber: Math.floor(Math.random() * 10) + 1,
          walletAddress: `${Math.random().toString(36).substr(2, 8)}...${Math.random().toString(36).substr(2, 8)}`,
          type: Math.random() > 0.5 ? 'buy' : 'sell',
          amount: Math.random() * 0.1 + 0.001,
          tokenAmount: Math.random() * 1000 + 100,
          status: Math.random() > 0.15 ? 'success' : (Math.random() > 0.5 ? 'failed' : 'pending'),
          timestamp: Date.now(),
          txHash: Math.random() > 0.1 ? `${Math.random().toString(36).substr(2, 9)}...${Math.random().toString(36).substr(2, 9)}` : undefined,
          error: Math.random() > 0.9 ? 'Insufficient balance for transaction' : undefined,
          retryCount: Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0,
          maxRetries: 3,
          gasUsed: Math.random() * 0.001 + 0.0001,
          slippage: Math.random() * 5 + 0.5,
          priceImpact: Math.random() * 2 + 0.1
        }
        
        setMockTransactions(prev => [newTransaction, ...prev.slice(0, 99)]) // Keep last 100
      }
    }, 1500)

    return () => clearInterval(interval)
  }, [isActive])

  // Calculate statistics
  useEffect(() => {
    const allTransactions = [...mockTransactions, ...transactions]
    const successful = allTransactions.filter(tx => tx.status === 'success')
    const failed = allTransactions.filter(tx => tx.status === 'failed')
    
    const newStats: TransactionStats = {
      totalTransactions: allTransactions.length,
      successfulTransactions: successful.length,
      failedTransactions: failed.length,
      totalVolume: successful.reduce((sum, tx) => sum + tx.amount, 0),
      totalFees: successful.reduce((sum, tx) => sum + (tx.gasUsed || 0), 0),
      averageSlippage: successful.length > 0 
        ? successful.reduce((sum, tx) => sum + (tx.slippage || 0), 0) / successful.length 
        : 0,
      successRate: allTransactions.length > 0 
        ? (successful.length / allTransactions.length) * 100 
        : 0
    }
    
    setStats(newStats)
  }, [mockTransactions, transactions])

  // Update parent component
  useEffect(() => {
    onTransactionUpdate(mockTransactions)
  }, [mockTransactions, onTransactionUpdate])

  const allTransactions = [...mockTransactions, ...transactions]
  
  const filteredTransactions = allTransactions
    .filter(tx => {
      if (filter === 'all') return true
      if (filter === 'buy' || filter === 'sell') return tx.type === filter
      if (filter === 'success' || filter === 'failed' || filter === 'pending') return tx.status === filter
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'timestamp':
          return b.timestamp - a.timestamp
        case 'amount':
          return b.amount - a.amount
        case 'status':
          return a.status.localeCompare(b.status)
        default:
          return b.timestamp - a.timestamp
      }
    })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
      case 'retrying':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'buy' 
      ? <TrendingUp className="w-4 h-4 text-green-500" />
      : <TrendingDown className="w-4 h-4 text-red-500" />
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const formatAmount = (amount: number) => {
    return amount.toFixed(6)
  }

  const filterOptions = [
    { value: 'all', label: 'All', count: allTransactions.length },
    { value: 'buy', label: 'Buys', count: allTransactions.filter(tx => tx.type === 'buy').length },
    { value: 'sell', label: 'Sells', count: allTransactions.filter(tx => tx.type === 'sell').length },
    { value: 'success', label: 'Success', count: allTransactions.filter(tx => tx.status === 'success').length },
    { value: 'failed', label: 'Failed', count: allTransactions.filter(tx => tx.status === 'failed').length },
    { value: 'pending', label: 'Pending', count: allTransactions.filter(tx => tx.status === 'pending').length }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Live Transaction Monitor
          </h3>
          {isActive && (
            <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-solana-500 focus:border-transparent"
          >
            <option value="timestamp">Latest First</option>
            <option value="amount">Amount</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Volume</span>
          </div>
          <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
            {stats.totalVolume.toFixed(4)} SOL
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Success Rate</span>
          </div>
          <div className="text-xl font-bold text-green-900 dark:text-green-100">
            {stats.successRate.toFixed(1)}%
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Avg Slippage</span>
          </div>
          <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
            {stats.averageSlippage.toFixed(2)}%
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Fees</span>
          </div>
          <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
            {stats.totalFees.toFixed(6)} SOL
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value as any)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === option.value
                ? 'bg-solana-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {option.label} ({option.count})
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md ${
                tx.status === 'success'
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                  : tx.status === 'failed'
                  ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                  : tx.status === 'pending'
                  ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(tx.status)}
                    {getTypeIcon(tx.type)}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Wallet #{tx.walletNumber}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        tx.type === 'buy' 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      }`}>
                        {tx.type.toUpperCase()}
                      </span>
                      {tx.retryCount && tx.retryCount > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                          Retry {tx.retryCount}/{tx.maxRetries}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{formatTime(tx.timestamp)}</span>
                      <span className="font-mono">{tx.walletAddress}</span>
                      {tx.txHash && (
                        <a
                          href={`https://solscan.io/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Solscan</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatAmount(tx.amount)} SOL
                  </div>
                  {tx.tokenAmount && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {tx.tokenAmount.toFixed(2)} {tokenSymbol}
                    </div>
                  )}
                  {tx.slippage && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Slippage: {tx.slippage.toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Details */}
              {(tx.error || tx.gasUsed || tx.priceImpact) && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  {tx.error && (
                    <div className="flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{tx.error}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {tx.gasUsed && (
                      <span>Gas: {tx.gasUsed.toFixed(6)} SOL</span>
                    )}
                    {tx.priceImpact && (
                      <span>Impact: {tx.priceImpact.toFixed(2)}%</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Transactions
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              {isActive 
                ? 'Waiting for trading activity...' 
                : 'Start trading to see live transactions'
              }
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats Footer */}
      {filteredTransactions.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {filteredTransactions.filter(tx => tx.status === 'success').length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Successful
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                {filteredTransactions.filter(tx => tx.status === 'failed').length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Failed
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {filteredTransactions.filter(tx => tx.type === 'buy').length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Buys
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {filteredTransactions.filter(tx => tx.type === 'sell').length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Sells
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransactionMonitor