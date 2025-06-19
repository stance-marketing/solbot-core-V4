import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
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
  ArrowRight,
  Coins,
  BarChart3,
  Target,
  Zap
} from 'lucide-react'
import { RootState } from '../store/store'
import { motion } from 'framer-motion'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
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
      borderColor: 'border-primary/20',
      iconBgColor: 'bg-primary/20',
      gradient: 'from-purple-500 to-indigo-600'
    },
    {
      name: 'Total Token Balance',
      value: totalTokenBalance.toFixed(2),
      icon: Coins,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      borderColor: 'border-secondary/20',
      iconBgColor: 'bg-secondary/20',
      gradient: 'from-green-500 to-teal-500'
    },
    {
      name: 'Active Wallets',
      value: tradingWallets.filter(w => w.isActive).length.toString(),
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      iconBgColor: 'bg-purple-500/20',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Trading Laps',
      value: laps.length.toString(),
      icon: Activity,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      iconBgColor: 'bg-orange-500/20',
      gradient: 'from-orange-500 to-red-500'
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-secondary">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Monitor your Solana trading bot performance
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
            connectionStatus === 'connected' 
              ? 'bg-secondary/20 text-secondary border border-secondary/30'
              : 'bg-red-500/20 text-red-500 border border-red-500/30'
          }`}>
            {connectionStatus === 'connected' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="capitalize">{connectionStatus}</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.name}
              variants={itemVariants}
              className="relative overflow-hidden rounded-xl border border-border shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
              
              <div className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-base font-semibold text-foreground/80">
                    {stat.name}
                  </p>
                  <div className={`p-3 rounded-full ${stat.iconBgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
                
                {/* Animated indicator */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-muted overflow-hidden">
                  <div className={`h-full ${stat.color} animate-pulse`} style={{width: '60%'}}></div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Current Session */}
      {currentSession ? (
        <motion.div 
          className="rounded-xl border border-border shadow-lg overflow-hidden bg-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-4 border-b border-border">
            <h2 className="text-xl font-bold text-foreground">
              Current Session
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Token Information
                </h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-lg font-semibold text-foreground">
                    {currentSession.tokenName}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-1 break-all">
                    {currentSession.tokenAddress}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Admin Wallet
                </h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {adminWallet?.publicKey.slice(0, 6)}...{adminWallet?.publicKey.slice(-6)}
                      </p>
                      <p className="text-sm text-foreground mt-1">
                        {adminWallet?.solBalance.toFixed(6)} SOL
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Session Details
                </h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">
                        {currentSession.wallets.length} Trading Wallets
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created: {currentSession.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          className="rounded-xl border border-border shadow-lg overflow-hidden bg-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              No Active Session
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create a new session or load an existing one to get started with your Solana trading bot
            </p>
            <button 
              onClick={handleCreateSession}
              className="btn btn-primary inline-flex items-center px-6 py-3 rounded-lg text-lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              Create Session
            </button>
          </div>
        </motion.div>
      )}

      {/* Trading Status */}
      {tradingStatus !== 'idle' && (
        <motion.div 
          className="rounded-xl border border-border shadow-lg overflow-hidden bg-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-4 border-b border-border">
            <h2 className="text-xl font-bold text-foreground">
              Trading Status
            </h2>
          </div>
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  tradingStatus === 'running' ? 'bg-secondary/20' :
                  tradingStatus === 'paused' ? 'bg-yellow-500/20' :
                  tradingStatus === 'error' ? 'bg-red-500/20' :
                  'bg-muted/30'
                }`}>
                  <div className={`w-4 h-4 rounded-full ${
                    tradingStatus === 'running' ? 'bg-secondary animate-pulse' :
                    tradingStatus === 'paused' ? 'bg-yellow-500' :
                    tradingStatus === 'error' ? 'bg-red-500' :
                    'bg-muted-foreground'
                  }`} />
                </div>
                <div>
                  <span className="text-2xl font-bold text-foreground capitalize">
                    {tradingStatus}
                  </span>
                  <p className="text-muted-foreground">
                    {tradingStatus === 'running' ? 'Trading is active' :
                     tradingStatus === 'paused' ? 'Trading is temporarily paused' :
                     tradingStatus === 'error' ? 'An error occurred during trading' :
                     'Trading is stopped'}
                  </p>
                </div>
              </div>
              
              {currentLap && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Target className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Current Lap
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        #{currentLap.lapNumber}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Started: {new Date(currentLap.startTime).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Activity */}
      <motion.div 
        className="rounded-xl border border-border shadow-lg overflow-hidden bg-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
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
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {laps.slice(-5).map((lap) => (
              <div 
                key={lap.lapNumber} 
                className="flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors border border-border"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    lap.status === 'completed' ? 'bg-secondary/20' :
                    lap.status === 'failed' ? 'bg-red-500/20' :
                    'bg-yellow-500/20'
                  }`}>
                    {lap.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-secondary" />
                    ) : lap.status === 'failed' ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  <div>
                    <span className="text-lg font-semibold text-foreground">
                      Lap #{lap.lapNumber}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {lap.status === 'completed' ? 'Completed successfully' :
                       lap.status === 'failed' ? 'Failed to complete' :
                       'In progress'}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-semibold text-foreground">
                    {lap.totalSolCollected.toFixed(6)} SOL
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {lap.endTime ? new Date(lap.endTime).toLocaleTimeString() : 'Running...'}
                  </p>
                </div>
              </div>
            ))}
            
            {laps.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-foreground mb-2">
                  No trading activity yet
                </p>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Start a trading session to see your activity here
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard