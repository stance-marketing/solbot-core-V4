import React from 'react'
import { 
  Wallet, 
  Activity, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Coins
} from 'lucide-react'

interface WalletTradingGridProps {
  wallets: any[]
  walletStatuses: Map<string, any>
  globalTradingFlag: boolean
  tokenSymbol?: string
}

const WalletTradingGrid: React.FC<WalletTradingGridProps> = ({
  wallets,
  walletStatuses,
  globalTradingFlag,
  tokenSymbol = 'Tokens'
}) => {
  const getWalletStatus = (wallet: any) => {
    const status = walletStatuses.get(wallet.publicKey)
    if (!status) return { ...wallet, isTrading: false, lastUpdate: null }
    return status
  }

  const getStatusIcon = (wallet: any) => {
    const status = getWalletStatus(wallet)
    
    if (!globalTradingFlag) {
      return <Pause className="w-4 h-4 text-gray-400" />
    }
    
    if (status.isTrading) {
      return <Activity className="w-4 h-4 text-green-500 animate-pulse" />
    }
    
    if (status.isActive) {
      return <CheckCircle className="w-4 h-4 text-blue-500" />
    }
    
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  const getStatusText = (wallet: any) => {
    const status = getWalletStatus(wallet)
    
    if (!globalTradingFlag) return 'Paused'
    if (status.isTrading) return 'Trading'
    if (status.isActive) return 'Ready'
    return 'Inactive'
  }

  const getStatusColor = (wallet: any) => {
    const status = getWalletStatus(wallet)
    
    if (!globalTradingFlag) return 'text-gray-500'
    if (status.isTrading) return 'text-green-500'
    if (status.isActive) return 'text-blue-500'
    return 'text-red-500'
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`
  }

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Wallet Trading Status
          </h3>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600 dark:text-gray-400">
              {wallets.filter(w => getWalletStatus(w).isTrading).length} Trading
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">
              {wallets.filter(w => getWalletStatus(w).isActive && !getWalletStatus(w).isTrading).length} Ready
            </span>
          </div>
        </div>
      </div>

      {/* Wallet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {wallets.map((wallet) => {
          const status = getWalletStatus(wallet)
          
          return (
            <div
              key={wallet.publicKey}
              className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                status.isTrading
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : status.isActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    #{wallet.number}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  {getStatusIcon(wallet)}
                  <span className={`text-xs font-medium ${getStatusColor(wallet)}`}>
                    {getStatusText(wallet)}
                  </span>
                </div>
              </div>

              {/* Address */}
              <div className="mb-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {formatAddress(wallet.publicKey)}
                </p>
              </div>

              {/* Balances */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <DollarSign className="w-3 h-3 text-solana-600 dark:text-solana-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">SOL</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {status.solBalance?.toFixed(4) || '0.0000'}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Coins className="w-3 h-3 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{tokenSymbol}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {status.tokenBalance?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>

              {/* Trading Activity */}
              {status.isTrading && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-gray-600 dark:text-gray-400">Buy Phase</span>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <div 
                      className="bg-green-500 h-1 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.random() * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Last Update */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Last Update</span>
                  </div>
                  <span>{formatTime(status.lastUpdate)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {wallets.length === 0 && (
        <div className="text-center py-12">
          <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Trading Wallets
          </h4>
          <p className="text-gray-600 dark:text-gray-400">
            Generate trading wallets to monitor their trading activity
          </p>
        </div>
      )}
    </div>
  )
}

export default WalletTradingGrid