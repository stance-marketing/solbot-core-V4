import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
  Play, 
  Pause, 
  Square, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Settings,
  RefreshCw,
  Zap,
  Target,
  Timer
} from 'lucide-react'
import { RootState } from '../store/store'
import { backendService } from '../services/backendService'
import { 
  setStatus, 
  setStrategy, 
  startTrading, 
  pauseTrading, 
  resumeTrading, 
  stopTrading,
  startLap,
  completeLap,
  updateElapsedTime
} from '../store/slices/tradingSlice'
import TradingControlPanel from '../components/trading/TradingControlPanel'
import TradingStatusGrid from '../components/trading/TradingStatusGrid'
import WalletTradingGrid from '../components/trading/WalletTradingGrid'
import TradingLapMonitor from '../components/trading/TradingLapMonitor'
import TransactionMonitor from '../components/trading/TransactionMonitor'
import TradingMetrics from '../components/trading/TradingMetrics'
import toast from 'react-hot-toast'

const Trading: React.FC = () => {
  const dispatch = useDispatch()
  const { currentSession } = useSelector((state: RootState) => state.session)
  const { adminWallet, tradingWallets } = useSelector((state: RootState) => state.wallet)
  const { 
    status, 
    strategy, 
    currentLap, 
    laps, 
    globalTradingFlag, 
    elapsedTime, 
    timeLeft, 
    duration 
  } = useSelector((state: RootState) => state.trading)

  const [selectedStrategy, setSelectedStrategy] = useState<'INCREASE_MAKERS_VOLUME' | 'INCREASE_VOLUME_ONLY'>('INCREASE_MAKERS_VOLUME')
  const [isLoading, setIsLoading] = useState(false)
  const [walletStatuses, setWalletStatuses] = useState<Map<string, any>>(new Map())
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])

  // Real-time updates
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (status === 'running') {
      interval = setInterval(() => {
        // Update elapsed time
        if (currentLap) {
          const elapsed = Date.now() - currentLap.startTime
          dispatch(updateElapsedTime(elapsed))
        }
        
        // Refresh wallet statuses
        refreshWalletStatuses()
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [status, currentLap, dispatch])

  const refreshWalletStatuses = async () => {
    if (!tradingWallets.length) return
    
    try {
      const updatedWallets = await backendService.getWalletBalances(tradingWallets)
      const statusMap = new Map()
      
      updatedWallets.forEach(wallet => {
        statusMap.set(wallet.publicKey, {
          ...wallet,
          isTrading: globalTradingFlag && wallet.isActive,
          lastUpdate: Date.now()
        })
      })
      
      setWalletStatuses(statusMap)
    } catch (error) {
      console.error('Failed to refresh wallet statuses:', error)
    }
  }

  const handleStartTrading = async () => {
    if (!currentSession || !adminWallet || tradingWallets.length === 0) {
      toast.error('Complete session setup required before starting trading')
      return
    }

    setIsLoading(true)
    try {
      // Start trading via backend
      await backendService.startTrading(selectedStrategy, currentSession)
      
      // Update local state
      const tradeDuration = selectedStrategy === 'INCREASE_MAKERS_VOLUME' ? 181000 : 1200000000
      dispatch(startTrading({ strategy: selectedStrategy, duration: tradeDuration }))
      dispatch(startLap(1))
      
      toast.success(`Trading started with ${selectedStrategy.replace('_', ' ').toLowerCase()}`)
    } catch (error) {
      toast.error(`Failed to start trading: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePauseTrading = async () => {
    setIsLoading(true)
    try {
      await backendService.pauseTrading()
      dispatch(pauseTrading())
      toast.success('Trading paused')
    } catch (error) {
      toast.error(`Failed to pause trading: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResumeTrading = async () => {
    setIsLoading(true)
    try {
      await backendService.resumeTrading()
      dispatch(resumeTrading())
      toast.success('Trading resumed')
    } catch (error) {
      toast.error(`Failed to resume trading: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStopTrading = async () => {
    setIsLoading(true)
    try {
      await backendService.stopTrading()
      dispatch(stopTrading())
      
      if (currentLap) {
        dispatch(completeLap({ solCollected: 0, tokensCollected: 0 }))
      }
      
      toast.success('Trading stopped')
    } catch (error) {
      toast.error(`Failed to stop trading: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'text-green-500'
      case 'paused': return 'text-yellow-500'
      case 'stopped': return 'text-red-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'running': return <Play className="w-5 h-5" />
      case 'paused': return <Pause className="w-5 h-5" />
      case 'stopped': return <Square className="w-5 h-5" />
      case 'error': return <AlertCircle className="w-5 h-5" />
      default: return <Activity className="w-5 h-5" />
    }
  }

  // Calculate metrics
  const activeWallets = Array.from(walletStatuses.values()).filter(w => w.isTrading).length
  const totalTransactions = recentTransactions.length
  const successfulTransactions = recentTransactions.filter(tx => tx.status === 'success').length
  const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Trading Control Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and control your automated trading operations
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshWalletStatuses}
            className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            status === 'running' ? 'bg-green-100 dark:bg-green-900/20' :
            status === 'paused' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
            'bg-gray-100 dark:bg-gray-700'
          }`}>
            <div className={getStatusColor()}>
              {getStatusIcon()}
            </div>
            <span className={`font-medium capitalize ${getStatusColor()}`}>
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Session Check */}
      {!currentSession && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-300">
                No Active Session
              </h3>
              <p className="text-yellow-700 dark:text-yellow-400 mt-1">
                Please create or load a trading session before starting trading operations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trading Metrics */}
      <TradingMetrics
        activeWallets={activeWallets}
        totalWallets={tradingWallets.length}
        successRate={successRate}
        totalTransactions={totalTransactions}
        currentLap={currentLap}
        elapsedTime={elapsedTime}
        timeLeft={timeLeft}
      />

      {/* Trading Control Panel */}
      <TradingControlPanel
        status={status}
        strategy={strategy}
        selectedStrategy={selectedStrategy}
        onStrategyChange={setSelectedStrategy}
        onStart={handleStartTrading}
        onPause={handlePauseTrading}
        onResume={handleResumeTrading}
        onStop={handleStopTrading}
        isLoading={isLoading}
        canStart={!!(currentSession && adminWallet && tradingWallets.length > 0)}
      />

      {/* Trading Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lap Monitor */}
        <TradingLapMonitor
          currentLap={currentLap}
          laps={laps}
          elapsedTime={elapsedTime}
          timeLeft={timeLeft}
          duration={duration}
          status={status}
        />

        {/* Transaction Monitor */}
        <TransactionMonitor
          transactions={recentTransactions}
          onTransactionUpdate={setRecentTransactions}
        />
      </div>

      {/* Wallet Trading Grid */}
      <WalletTradingGrid
        wallets={tradingWallets}
        walletStatuses={walletStatuses}
        globalTradingFlag={globalTradingFlag}
        tokenSymbol={currentSession?.tokenName}
      />
    </div>
  )
}

export default Trading