import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  DollarSign,
  Coins,
  Clock,
  Target,
  RefreshCw
} from 'lucide-react'

interface RegenerationPhase {
  name: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  progress: number
  details?: string
  error?: string
}

interface WalletRegenerationTrackerProps {
  isActive: boolean
  walletCount: number
  solAmount: number
  tokenAmount: number
  tokenSymbol: string
  onRegenerationComplete: (result: any) => void
}

const WalletRegenerationTracker: React.FC<WalletRegenerationTrackerProps> = ({
  isActive,
  walletCount,
  solAmount,
  tokenAmount,
  tokenSymbol,
  onRegenerationComplete
}) => {
  const [phases, setPhases] = useState<RegenerationPhase[]>([
    { name: 'Generate New Wallets', status: 'pending', progress: 0 },
    { name: 'Distribute SOL', status: 'pending', progress: 0 },
    { name: 'Distribute Tokens', status: 'pending', progress: 0 },
    { name: 'Validate Setup', status: 'pending', progress: 0 }
  ])
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [generatedWallets, setGeneratedWallets] = useState<any[]>([])
  const [distributionResults, setDistributionResults] = useState({
    solDistributed: 0,
    tokensDistributed: 0,
    successfulWallets: 0
  })

  useEffect(() => {
    if (isActive && !isRegenerating) {
      startRegeneration()
    }
  }, [isActive])

  const startRegeneration = async () => {
    setIsRegenerating(true)
    setCurrentPhaseIndex(0)

    try {
      // Phase 1: Generate New Wallets
      await executePhase(0, generateWallets)
      
      // Phase 2: Distribute SOL
      await executePhase(1, distributeSol)
      
      // Phase 3: Distribute Tokens (if available)
      if (tokenAmount > 0) {
        await executePhase(2, distributeTokens)
      } else {
        skipPhase(2, 'No tokens to distribute')
      }
      
      // Phase 4: Validate Setup
      await executePhase(3, validateSetup)

      // Complete regeneration
      onRegenerationComplete({
        success: true,
        wallets: generatedWallets,
        solDistributed: distributionResults.solDistributed,
        tokensDistributed: distributionResults.tokensDistributed
      })

    } catch (error) {
      console.error('Regeneration failed:', error)
      
      // Mark current phase as failed
      updatePhaseStatus(currentPhaseIndex, 'failed', 0, error.message)
      
      onRegenerationComplete({
        success: false,
        error: error.message
      })
    } finally {
      setIsRegenerating(false)
    }
  }

  const executePhase = async (phaseIndex: number, phaseFunction: () => Promise<void>) => {
    setCurrentPhaseIndex(phaseIndex)
    updatePhaseStatus(phaseIndex, 'active', 0)
    
    try {
      await phaseFunction()
      updatePhaseStatus(phaseIndex, 'completed', 100)
    } catch (error) {
      updatePhaseStatus(phaseIndex, 'failed', 0, error.message)
      throw error
    }
  }

  const skipPhase = (phaseIndex: number, reason: string) => {
    updatePhaseStatus(phaseIndex, 'completed', 100, reason)
  }

  const updatePhaseStatus = (
    phaseIndex: number, 
    status: RegenerationPhase['status'], 
    progress: number, 
    details?: string
  ) => {
    setPhases(prev => prev.map((phase, index) => 
      index === phaseIndex 
        ? { ...phase, status, progress, details, error: status === 'failed' ? details : undefined }
        : phase
    ))
  }

  const updatePhaseProgress = (phaseIndex: number, progress: number, details?: string) => {
    setPhases(prev => prev.map((phase, index) => 
      index === phaseIndex 
        ? { ...phase, progress, details }
        : phase
    ))
  }

  const generateWallets = async () => {
    updatePhaseProgress(0, 10, 'Initializing wallet generation...')
    
    // Simulate wallet generation
    const newWallets = []
    for (let i = 0; i < walletCount; i++) {
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const wallet = {
        number: i + 1,
        publicKey: `Generated${i + 1}PublicKey${Math.random().toString(36).substr(2, 9)}`,
        privateKey: `generated_private_key_${i + 1}`,
        solBalance: 0,
        tokenBalance: 0,
        isActive: false,
        generationTimestamp: new Date().toISOString()
      }
      
      newWallets.push(wallet)
      
      const progress = ((i + 1) / walletCount) * 100
      updatePhaseProgress(0, progress, `Generated ${i + 1}/${walletCount} wallets`)
    }
    
    setGeneratedWallets(newWallets)
    updatePhaseProgress(0, 100, `Successfully generated ${walletCount} wallets`)
  }

  const distributeSol = async () => {
    if (solAmount <= 0) {
      updatePhaseProgress(1, 100, 'No SOL to distribute')
      return
    }

    updatePhaseProgress(1, 10, 'Preparing SOL distribution...')
    
    const amountPerWallet = solAmount / walletCount
    let distributedCount = 0
    let totalDistributed = 0

    for (let i = 0; i < generatedWallets.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Simulate distribution success/failure (95% success rate)
      const success = Math.random() > 0.05
      
      if (success) {
        distributedCount++
        totalDistributed += amountPerWallet
        generatedWallets[i].solBalance = amountPerWallet
        generatedWallets[i].isActive = true
      }
      
      const progress = ((i + 1) / generatedWallets.length) * 100
      updatePhaseProgress(1, progress, `Distributed SOL to ${distributedCount}/${i + 1} wallets`)
    }
    
    setDistributionResults(prev => ({
      ...prev,
      solDistributed: totalDistributed,
      successfulWallets: distributedCount
    }))
    
    updatePhaseProgress(1, 100, `Distributed ${totalDistributed.toFixed(6)} SOL to ${distributedCount} wallets`)
  }

  const distributeTokens = async () => {
    if (tokenAmount <= 0) {
      updatePhaseProgress(2, 100, 'No tokens to distribute')
      return
    }

    updatePhaseProgress(2, 10, 'Preparing token distribution...')
    
    const amountPerWallet = tokenAmount / walletCount
    let distributedCount = 0
    let totalDistributed = 0

    for (let i = 0; i < generatedWallets.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Only distribute to wallets that successfully received SOL
      if (generatedWallets[i].isActive) {
        const success = Math.random() > 0.03 // 97% success rate for token distribution
        
        if (success) {
          distributedCount++
          totalDistributed += amountPerWallet
          generatedWallets[i].tokenBalance = amountPerWallet
        }
      }
      
      const progress = ((i + 1) / generatedWallets.length) * 100
      updatePhaseProgress(2, progress, `Distributed tokens to ${distributedCount}/${i + 1} wallets`)
    }
    
    setDistributionResults(prev => ({
      ...prev,
      tokensDistributed: totalDistributed
    }))
    
    updatePhaseProgress(2, 100, `Distributed ${totalDistributed.toFixed(2)} ${tokenSymbol} to ${distributedCount} wallets`)
  }

  const validateSetup = async () => {
    updatePhaseProgress(3, 10, 'Validating wallet setup...')
    
    let validWallets = 0
    
    for (let i = 0; i < generatedWallets.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const wallet = generatedWallets[i]
      if (wallet.isActive && wallet.solBalance > 0) {
        validWallets++
      }
      
      const progress = ((i + 1) / generatedWallets.length) * 100
      updatePhaseProgress(3, progress, `Validated ${validWallets}/${i + 1} wallets`)
    }
    
    if (validWallets === 0) {
      throw new Error('No valid wallets found after regeneration')
    }
    
    updatePhaseProgress(3, 100, `Setup validated: ${validWallets} wallets ready for trading`)
  }

  const getPhaseIcon = (phase: RegenerationPhase) => {
    switch (phase.status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />
      case 'active':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getPhaseColor = (phase: RegenerationPhase) => {
    switch (phase.status) {
      case 'pending': return 'text-gray-500'
      case 'active': return 'text-blue-500'
      case 'completed': return 'text-green-500'
      case 'failed': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const overallProgress = phases.reduce((sum, phase) => sum + phase.progress, 0) / phases.length

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Wallet Regeneration
          </h3>
        </div>
        
        {isRegenerating && (
          <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
            <Target className="w-4 h-4" />
            <span>{overallProgress.toFixed(1)}% Complete</span>
          </div>
        )}
      </div>

      {/* Overall Progress */}
      {isRegenerating && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Progress
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {overallProgress.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Phase Progress */}
      <div className="space-y-4">
        {phases.map((phase, index) => (
          <div
            key={phase.name}
            className={`p-4 border rounded-lg transition-colors ${
              phase.status === 'completed'
                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                : phase.status === 'failed'
                ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                : phase.status === 'active'
                ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                {getPhaseIcon(phase)}
                <span className="font-medium text-gray-900 dark:text-white">
                  {phase.name}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${getPhaseColor(phase)}`}>
                  {phase.progress.toFixed(0)}%
                </span>
                {index < phases.length - 1 && phase.status === 'completed' && (
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {phase.status === 'active' && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mb-2">
                <div 
                  className="bg-blue-600 dark:bg-blue-400 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${phase.progress}%` }}
                />
              </div>
            )}

            {/* Phase Details */}
            {phase.details && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {phase.details}
              </p>
            )}

            {/* Error Message */}
            {phase.error && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                Error: {phase.error}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Results Summary */}
      {!isRegenerating && generatedWallets.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Regeneration Results
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Wallets
                </span>
              </div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {generatedWallets.length}
              </div>
            </div>

            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  SOL
                </span>
              </div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {distributionResults.solDistributed.toFixed(6)}
              </div>
            </div>

            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Coins className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {tokenSymbol}
                </span>
              </div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {distributionResults.tokensDistributed.toFixed(2)}
              </div>
            </div>

            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <CheckCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Active
                </span>
              </div>
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {distributionResults.successfulWallets}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletRegenerationTracker