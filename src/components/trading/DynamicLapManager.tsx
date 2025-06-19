import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
  RotateCcw, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Target,
  Activity,
  Coins,
  ArrowRight,
  Timer,
  Zap
} from 'lucide-react'
import { RootState } from '../../store/store'
import { backendService } from '../../services/backendService'
import { 
  startLap, 
  completeLap, 
  failLap,
  updateElapsedTime 
} from '../../store/slices/tradingSlice'
import { setTradingWallets } from '../../store/slices/walletSlice'
import toast from 'react-hot-toast'

interface LapResult {
  lapNumber: number
  startTime: number
  endTime: number
  totalSolCollected: number
  totalTokensCollected: number
  walletsGenerated: number
  distributionSuccess: boolean
  status: 'completed' | 'failed' | 'timeout'
  errorMessage?: string
}

interface DynamicLapManagerProps {
  isActive: boolean
  onLapComplete: (result: LapResult) => void
}

const DynamicLapManager: React.FC<DynamicLapManagerProps> = ({
  isActive,
  onLapComplete
}) => {
  const dispatch = useDispatch()
  const { currentSession } = useSelector((state: RootState) => state.session)
  const { adminWallet, tradingWallets } = useSelector((state: RootState) => state.wallet)
  const { currentLap, laps, status } = useSelector((state: RootState) => state.trading)

  const [lapResults, setLapResults] = useState<LapResult[]>([])
  const [isProcessingLap, setIsProcessingLap] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<string>('')
  const [phaseProgress, setPhaseProgress] = useState(0)
  const [collectionProgress, setCollectionProgress] = useState({
    solCollected: 0,
    tokensCollected: 0,
    walletsProcessed: 0,
    totalWallets: 0
  })
  const [regenerationProgress, setRegenerationProgress] = useState({
    walletsGenerated: 0,
    solDistributed: 0,
    tokensDistributed: 0,
    phase: 'idle' as 'idle' | 'generating' | 'distributing-sol' | 'distributing-tokens' | 'complete'
  })
  const [timeoutHandling, setTimeoutHandling] = useState({
    isActive: false,
    operation: '',
    retryCount: 0,
    maxRetries: 3
  })

  // Lap completion handler
  useEffect(() => {
    if (currentLap && status === 'running') {
      const checkLapCompletion = async () => {
        const elapsed = Date.now() - currentLap.startTime
        const duration = 181000 // 3 minutes for makers + volume
        
        if (elapsed >= duration) {
          await completeTradingLap()
        }
      }

      const interval = setInterval(checkLapCompletion, 1000)
      return () => clearInterval(interval)
    }
  }, [currentLap, status])

  const completeTradingLap = async () => {
    if (!currentLap || isProcessingLap) return

    setIsProcessingLap(true)
    setCurrentPhase('Completing Trading Lap')
    setPhaseProgress(0)

    const lapStartTime = currentLap.startTime
    const lapNumber = currentLap.lapNumber

    try {
      // Phase 1: Collection (40% of progress)
      setCurrentPhase('Collecting SOL and Tokens from Trading Wallets')
      setPhaseProgress(10)
      
      const collectionResult = await collectFromTradingWallets()
      setPhaseProgress(40)

      if (!collectionResult.success) {
        throw new Error('Collection phase failed')
      }

      // Phase 2: Wallet Regeneration (30% of progress)
      setCurrentPhase('Regenerating Trading Wallets')
      setPhaseProgress(50)
      
      const regenerationResult = await regenerateTradingWallets()
      setPhaseProgress(70)

      if (!regenerationResult.success) {
        throw new Error('Wallet regeneration failed')
      }

      // Phase 3: Distribution (30% of progress)
      setCurrentPhase('Distributing Funds to New Wallets')
      setPhaseProgress(80)
      
      const distributionResult = await distributeFundsToNewWallets(
        collectionResult.solCollected,
        collectionResult.tokensCollected,
        regenerationResult.newWallets
      )
      setPhaseProgress(100)

      if (!distributionResult.success) {
        throw new Error('Distribution phase failed')
      }

      // Complete the lap
      const lapResult: LapResult = {
        lapNumber,
        startTime: lapStartTime,
        endTime: Date.now(),
        totalSolCollected: collectionResult.solCollected,
        totalTokensCollected: collectionResult.tokensCollected,
        walletsGenerated: regenerationResult.newWallets.length,
        distributionSuccess: distributionResult.success,
        status: 'completed'
      }

      setLapResults(prev => [...prev, lapResult])
      dispatch(completeLap({ 
        solCollected: collectionResult.solCollected, 
        tokensCollected: collectionResult.tokensCollected 
      }))

      // Start next lap
      dispatch(startLap(lapNumber + 1))
      onLapComplete(lapResult)

      toast.success(`Lap ${lapNumber} completed successfully!`)

    } catch (error) {
      console.error('Lap completion failed:', error)
      
      const failedLapResult: LapResult = {
        lapNumber,
        startTime: lapStartTime,
        endTime: Date.now(),
        totalSolCollected: 0,
        totalTokensCollected: 0,
        walletsGenerated: 0,
        distributionSuccess: false,
        status: 'failed',
        errorMessage: error.message
      }

      setLapResults(prev => [...prev, failedLapResult])
      dispatch(failLap(error.message))
      onLapComplete(failedLapResult)

      toast.error(`Lap ${lapNumber} failed: ${error.message}`)
    } finally {
      setIsProcessingLap(false)
      setCurrentPhase('')
      setPhaseProgress(0)
      resetProgress()
    }
  }

  const collectFromTradingWallets = async () => {
    setCollectionProgress({
      solCollected: 0,
      tokensCollected: 0,
      walletsProcessed: 0,
      totalWallets: tradingWallets.length
    })

    try {
      let totalSolCollected = 0
      let totalTokensCollected = 0

      for (let i = 0; i < tradingWallets.length; i++) {
        const wallet = tradingWallets[i]
        
        try {
          // Collect SOL and tokens from this wallet
          const result = await withTimeout(
            collectFromSingleWallet(wallet),
            30000, // 30 second timeout per wallet
            `Collection from wallet ${wallet.number}`
          )

          totalSolCollected += result.solCollected
          totalTokensCollected += result.tokensCollected

          setCollectionProgress(prev => ({
            ...prev,
            solCollected: totalSolCollected,
            tokensCollected: totalTokensCollected,
            walletsProcessed: i + 1
          }))

          // Small delay between wallets
          await new Promise(resolve => setTimeout(resolve, 500))

        } catch (error) {
          console.error(`Failed to collect from wallet ${wallet.number}:`, error)
          // Continue with other wallets
        }
      }

      return {
        success: true,
        solCollected: totalSolCollected,
        tokensCollected: totalTokensCollected
      }

    } catch (error) {
      console.error('Collection phase failed:', error)
      return {
        success: false,
        solCollected: 0,
        tokensCollected: 0
      }
    }
  }

  const collectFromSingleWallet = async (wallet: any) => {
    // Mock collection - replace with actual backend call
    const solCollected = Math.random() * 0.01 + 0.001
    const tokensCollected = Math.random() * 100 + 10

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return { solCollected, tokensCollected }
  }

  const regenerateTradingWallets = async () => {
    setRegenerationProgress({
      walletsGenerated: 0,
      solDistributed: 0,
      tokensDistributed: 0,
      phase: 'generating'
    })

    try {
      const walletCount = tradingWallets.length

      // Generate new wallets
      const newWallets = await withTimeout(
        backendService.generateTradingWallets(walletCount),
        60000, // 1 minute timeout
        'Wallet generation'
      )

      setRegenerationProgress(prev => ({
        ...prev,
        walletsGenerated: newWallets.length,
        phase: 'distributing-sol'
      }))

      return {
        success: true,
        newWallets
      }

    } catch (error) {
      console.error('Wallet regeneration failed:', error)
      return {
        success: false,
        newWallets: []
      }
    }
  }

  const distributeFundsToNewWallets = async (
    solAmount: number,
    tokenAmount: number,
    newWallets: any[]
  ) => {
    try {
      setRegenerationProgress(prev => ({ ...prev, phase: 'distributing-sol' }))

      // Distribute SOL
      if (solAmount > 0) {
        const updatedWallets = await withTimeout(
          backendService.distributeSol(adminWallet!, newWallets, solAmount),
          120000, // 2 minute timeout
          'SOL distribution'
        )

        setRegenerationProgress(prev => ({ ...prev, solDistributed: solAmount }))
        dispatch(setTradingWallets(updatedWallets))
      }

      // Distribute tokens if available
      if (tokenAmount > 0 && currentSession) {
        setRegenerationProgress(prev => ({ ...prev, phase: 'distributing-tokens' }))

        const amountPerWallet = tokenAmount / newWallets.length
        await withTimeout(
          backendService.distributeTokens(
            adminWallet!,
            newWallets,
            currentSession.tokenAddress,
            amountPerWallet
          ),
          120000, // 2 minute timeout
          'Token distribution'
        )

        setRegenerationProgress(prev => ({ ...prev, tokensDistributed: tokenAmount }))
      }

      setRegenerationProgress(prev => ({ ...prev, phase: 'complete' }))

      return { success: true }

    } catch (error) {
      console.error('Distribution failed:', error)
      return { success: false }
    }
  }

  const withTimeout = async <T,>(
    promise: Promise<T>,
    timeoutMs: number,
    operationName: string
  ): Promise<T> => {
    setTimeoutHandling({
      isActive: true,
      operation: operationName,
      retryCount: 0,
      maxRetries: 3
    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)), timeoutMs)
    })

    try {
      const result = await Promise.race([promise, timeoutPromise])
      setTimeoutHandling(prev => ({ ...prev, isActive: false }))
      return result
    } catch (error) {
      setTimeoutHandling(prev => ({ ...prev, isActive: false }))
      throw error
    }
  }

  const resetProgress = () => {
    setCollectionProgress({
      solCollected: 0,
      tokensCollected: 0,
      walletsProcessed: 0,
      totalWallets: 0
    })
    setRegenerationProgress({
      walletsGenerated: 0,
      solDistributed: 0,
      tokensDistributed: 0,
      phase: 'idle'
    })
    setTimeoutHandling({
      isActive: false,
      operation: '',
      retryCount: 0,
      maxRetries: 3
    })
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const formatDuration = (startTime: number, endTime: number) => {
    const duration = endTime - startTime
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Current Lap Processing */}
      {isProcessingLap && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
              Processing Lap {currentLap?.lapNumber}
            </h3>
          </div>

          <div className="space-y-4">
            {/* Phase Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {currentPhase}
                </span>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  {phaseProgress}%
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div 
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${phaseProgress}%` }}
                />
              </div>
            </div>

            {/* Collection Progress */}
            {collectionProgress.totalWallets > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {collectionProgress.solCollected.toFixed(6)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    SOL Collected
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {collectionProgress.tokensCollected.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Tokens Collected
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {collectionProgress.walletsProcessed}/{collectionProgress.totalWallets}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Wallets Processed
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {regenerationProgress.walletsGenerated}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    New Wallets
                  </div>
                </div>
              </div>
            )}

            {/* Timeout Handling */}
            {timeoutHandling.isActive && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Timer className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    Timeout protection active for: {timeoutHandling.operation}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lap Results History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Lap Results History
            </h3>
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {lapResults.length} laps completed
          </div>
        </div>

        {lapResults.length > 0 ? (
          <div className="space-y-4">
            {lapResults.slice(-10).reverse().map((result) => (
              <div
                key={result.lapNumber}
                className={`p-4 border rounded-lg ${
                  result.status === 'completed'
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                    : result.status === 'failed'
                    ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                    : 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {result.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : result.status === 'failed' ? (
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    )}
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Lap #{result.lapNumber}
                    </h4>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(result.startTime)} - {formatTime(result.endTime)}
                    </div>
                    <div className="text-xs text-gray-400">
                      Duration: {formatDuration(result.startTime, result.endTime)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        SOL
                      </span>
                    </div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {result.totalSolCollected.toFixed(6)}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Coins className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tokens
                      </span>
                    </div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {result.totalTokensCollected.toFixed(2)}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Wallets
                      </span>
                    </div>
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {result.walletsGenerated}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status
                      </span>
                    </div>
                    <div className={`text-sm font-medium capitalize ${
                      result.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                      result.status === 'failed' ? 'text-red-600 dark:text-red-400' :
                      'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {result.status}
                    </div>
                  </div>
                </div>

                {result.errorMessage && (
                  <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Error: {result.errorMessage}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Lap Results Yet
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Lap results will appear here as trading progresses
            </p>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {lapResults.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Session Summary
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {lapResults.reduce((sum, lap) => sum + lap.totalSolCollected, 0).toFixed(6)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total SOL Collected
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {lapResults.reduce((sum, lap) => sum + lap.totalTokensCollected, 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total Tokens Collected
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {lapResults.filter(lap => lap.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Successful Laps
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {lapResults.length > 0 ? 
                  ((lapResults.filter(lap => lap.status === 'completed').length / lapResults.length) * 100).toFixed(1) 
                  : '0'}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Success Rate
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DynamicLapManager