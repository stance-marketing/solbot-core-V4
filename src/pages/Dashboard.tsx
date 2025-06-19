import React from 'react'
import { useSelector } from 'react-redux'
import { 
  Activity, 
  Wallet, 
  TrendingUp, 
  DollarSign,
  Users,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { RootState } from '../store/store'

const Dashboard: React.FC = () => {
  const { currentSession } = useSelector((state: RootState) => state.session)
  const { status: tradingStatus, currentLap, laps } = useSelector((state: RootState) => state.trading)
  const { adminWallet, tradingWallets, totalSolBalance, totalTokenBalance } = useSelector((state: RootState) => state.wallet)
  const { status: connectionStatus } = useSelector((state: RootState) => state.websocket)

  const stats = [
    {
      name: 'Total SOL Balance',
      value: totalSolBalance.toFixed(6),
      icon: DollarSign,
      color: 'text-solana-600 dark:text-solana-400',
      bgColor: 'bg-solana-50 dark:bg-solana-900/20',
    },
    {
      name: 'Total Token Balance',
      value: totalTokenBalance.toFixed(2),
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      name: 'Active Wallets',
      value: tradingWallets.filter(w => w.isActive).length.toString(),
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      name: 'Trading Laps',
      value: laps.length.toString(),
      icon: Activity,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor your Solana trading bot performance
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
            connectionStatus === 'connected' 
              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          }`}>
            {connectionStatus === 'connected' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="capitalize">{connectionStatus}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Current Session */}
      {currentSession ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Current Session
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Token Information
              </h3>
              <div className="space-y-1">
                <p className="text-sm text-gray-900 dark:text-white font-medium">
                  {currentSession.tokenName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {currentSession.tokenAddress}
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Admin Wallet
              </h3>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {adminWallet?.publicKey}
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {adminWallet?.solBalance.toFixed(6)} SOL
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Session Details
              </h3>
              <div className="space-y-1">
                <p className="text-sm text-gray-900 dark:text-white">
                  {currentSession.wallets.length} Trading Wallets
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Created: {currentSession.timestamp}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Active Session
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create a new session or load an existing one to get started
          </p>
          <button className="inline-flex items-center px-4 py-2 bg-solana-600 hover:bg-solana-700 text-white font-medium rounded-lg transition-colors duration-200">
            Create Session
          </button>
        </div>
      )}

      {/* Trading Status */}
      {tradingStatus !== 'idle' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Trading Status
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                tradingStatus === 'running' ? 'bg-green-500 animate-pulse' :
                tradingStatus === 'paused' ? 'bg-yellow-500' :
                tradingStatus === 'error' ? 'bg-red-500' :
                'bg-gray-400'
              }`} />
              <span className="text-lg font-medium text-gray-900 dark:text-white capitalize">
                {tradingStatus}
              </span>
            </div>
            
            {currentLap && (
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Current Lap: {currentLap.lapNumber}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Started: {new Date(currentLap.startTime).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <div className="space-y-3">
          {laps.slice(-5).map((lap) => (
            <div key={lap.lapNumber} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  lap.status === 'completed' ? 'bg-green-500' :
                  lap.status === 'failed' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`} />
                <span className="text-sm text-gray-900 dark:text-white">
                  Lap {lap.lapNumber}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-900 dark:text-white">
                  {lap.totalSolCollected.toFixed(6)} SOL
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {lap.endTime ? new Date(lap.endTime).toLocaleTimeString() : 'Running...'}
                </p>
              </div>
            </div>
          ))}
          
          {laps.length === 0 && (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                No trading activity yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard