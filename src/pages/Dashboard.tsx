import React from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { 
  Activity, 
  Wallet, 
  TrendingUp, 
  DollarSign,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { RootState } from '../store/store'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { currentSession } = useSelector((state: RootState) => state.session)
  const { status: tradingStatus, currentLap, laps } = useSelector((state: RootState) => state.trading)
  const { adminWallet, tradingWallets, totalSolBalance, totalTokenBalance } = useSelector((state: RootState) => state.wallet)
  const { status: connectionStatus } = useSelector((state: RootState) => state.websocket)

  const handleCreateSession = () => {
    navigate('/sessions')
  }

  const stats = [
    {
      name: 'Total SOL Balance',
      value: totalSolBalance.toFixed(6),
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      name: 'Total Token Balance',
      value: totalTokenBalance.toFixed(2),
      icon: TrendingUp,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      name: 'Active Wallets',
      value: tradingWallets.filter(w => w.isActive).length.toString(),
      icon: Users,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      name: 'Trading Laps',
      value: laps.length.toString(),
      icon: Activity,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor your Solana trading bot performance
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
            connectionStatus === 'connected' 
              ? 'bg-secondary/10 text-secondary'
              : 'bg-red-500/10 text-red-500'
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
              className="card p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
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
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Current Session
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Token Information
              </h3>
              <div className="space-y-1">
                <p className="text-sm text-foreground font-medium">
                  {currentSession.tokenName}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {currentSession.tokenAddress}
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Admin Wallet
              </h3>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-mono">
                  {adminWallet?.publicKey}
                </p>
                <p className="text-sm text-foreground">
                  {adminWallet?.solBalance.toFixed(6)} SOL
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Session Details
              </h3>
              <div className="space-y-1">
                <p className="text-sm text-foreground">
                  {currentSession.wallets.length} Trading Wallets
                </p>
                <p className="text-xs text-muted-foreground">
                  Created: {currentSession.timestamp}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Active Session
          </h3>
          <p className="text-muted-foreground mb-4">
            Create a new session or load an existing one to get started
          </p>
          <button 
            onClick={handleCreateSession}
            className="btn btn-primary inline-flex items-center"
          >
            Create Session
          </button>
        </div>
      )}

      {/* Trading Status */}
      {tradingStatus !== 'idle' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Trading Status
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                tradingStatus === 'running' ? 'bg-secondary animate-pulse' :
                tradingStatus === 'paused' ? 'bg-yellow-500' :
                tradingStatus === 'error' ? 'bg-red-500' :
                'bg-muted-foreground'
              }`} />
              <span className="text-lg font-medium text-foreground capitalize">
                {tradingStatus}
              </span>
            </div>
            
            {currentLap && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Current Lap: {currentLap.lapNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  Started: {new Date(currentLap.startTime).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Activity
          </h2>
          
          {laps.length > 0 && (
            <button 
              onClick={() => navigate('/trading')}
              className="text-primary hover:text-primary/80 text-sm font-medium flex items-center"
            >
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          {laps.slice(-5).map((lap) => (
            <div key={lap.lapNumber} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  lap.status === 'completed' ? 'bg-secondary' :
                  lap.status === 'failed' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`} />
                <span className="text-sm text-foreground">
                  Lap {lap.lapNumber}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-foreground">
                  {lap.totalSolCollected.toFixed(6)} SOL
                </p>
                <p className="text-xs text-muted-foreground">
                  {lap.endTime ? new Date(lap.endTime).toLocaleTimeString() : 'Running...'}
                </p>
              </div>
            </div>
          ))}
          
          {laps.length === 0 && (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
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