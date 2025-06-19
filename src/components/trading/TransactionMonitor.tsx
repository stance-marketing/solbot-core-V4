import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  Clock,
  ExternalLink,
  Filter
} from 'lucide-react'

interface Transaction {
  id: string
  walletNumber: number
  type: 'buy' | 'sell'
  amount: number
  status: 'success' | 'failed' | 'pending'
  timestamp: number
  txHash?: string
  error?: string
}

interface TransactionMonitorProps {
  transactions: Transaction[]
  onTransactionUpdate: (transactions: Transaction[]) => void
}

const TransactionMonitor: React.FC<TransactionMonitorProps> = ({
  transactions,
  onTransactionUpdate
}) => {
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell' | 'success' | 'failed'>('all')
  const [mockTransactions, setMockTransactions] = useState<Transaction[]>([])

  // Mock transaction generator for demo
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance to generate a transaction
        const newTransaction: Transaction = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          walletNumber: Math.floor(Math.random() * 10) + 1,
          type: Math.random() > 0.5 ? 'buy' : 'sell',
          amount: Math.random() * 0.1 + 0.001,
          status: Math.random() > 0.1 ? 'success' : 'failed',
          timestamp: Date.now(),
          txHash: Math.random() > 0.1 ? `${Math.random().toString(36).substr(2, 9)}...${Math.random().toString(36).substr(2, 9)}` : undefined,
          error: Math.random() > 0.9 ? 'Insufficient balance' : undefined
        }
        
        setMockTransactions(prev => [newTransaction, ...prev.slice(0, 49)]) // Keep last 50
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Update parent component
  useEffect(() => {
    onTransactionUpdate(mockTransactions)
  }, [mockTransactions, onTransactionUpdate])

  const filteredTransactions = mockTransactions.filter(tx => {
    if (filter === 'all') return true
    if (filter === 'buy' || filter === 'sell') return tx.type === filter
    if (filter === 'success' || filter === 'failed') return tx.status === filter
    return true
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
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

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'buy', label: 'Buys' },
    { value: 'sell', label: 'Sells' },
    { value: 'success', label: 'Success' },
    { value: 'failed', label: 'Failed' }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Transaction Monitor
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-solana-500 focus:border-transparent"
          >
            {filterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
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
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      tx.type === 'buy' 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    }`}>
                      {tx.type.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatTime(tx.timestamp)}</span>
                    {tx.txHash && (
                      <a
                        href={`https://solscan.io/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-blue-500 hover:text-blue-600"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {tx.amount.toFixed(6)} SOL
                </div>
                {tx.error && (
                  <div className="text-xs text-red-500">
                    {tx.error}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Transactions
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Transactions will appear here when trading starts
            </p>
          </div>
        )}
      </div>

      {/* Transaction Stats */}
      {filteredTransactions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
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
          </div>
        </div>
      )}
    </div>
  )
}

export default TransactionMonitor