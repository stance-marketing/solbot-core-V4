import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
  Trash2, 
  ArrowUp, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  DollarSign,
  Coins,
  Shield,
  RefreshCw
} from 'lucide-react'
import { RootState } from '../../store/store'
import { backendService } from '../../services/backendService'
import toast from 'react-hot-toast'

const CleanupOperations: React.FC = () => {
  const dispatch = useDispatch()
  const { currentSession } = useSelector((state: RootState) => state.session)
  const { adminWallet, tradingWallets } = useSelector((state: RootState) => state.wallet)
  
  const [isLoading, setIsLoading] = useState(false)
  const [operationStatus, setOperationStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle')
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{
    solCollected: number
    tokensCollected: number
    accountsClosed: number
    errors: string[]
  }>({
    solCollected: 0,
    tokensCollected: 0,
    accountsClosed: 0,
    errors: []
  })

  const handleCleanup = async () => {
    if (!currentSession || !adminWallet || tradingWallets.length === 0) {
      toast.error('Session, admin wallet, and trading wallets are required')
      return
    }

    if (!confirm('This will close all token accounts and send balances to the admin wallet. Continue?')) {
      return
    }

    setIsLoading(true)
    setOperationStatus('running')
    setProgress(0)
    setResults({
      solCollected: 0,
      tokensCollected: 0,
      accountsClosed: 0,
      errors: []
    })

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 5
        })
      }, 1000)

      // Call backend to close token accounts and send balances
      await backendService.closeTokenAccountsAndSendBalance(currentSession)
      
      clearInterval(progressInterval)
      setProgress(100)
      setOperationStatus('completed')
      
      // Mock results - in a real implementation, these would come from the backend
      setResults({
        solCollected: tradingWallets.reduce((sum, w) => sum + w.solBalance, 0),
        tokensCollected: tradingWallets.reduce((sum, w) => sum + w.tokenBalance, 0),
        accountsClosed: tradingWallets.length,
        errors: []
      })
      
      toast.success('Cleanup operations completed successfully')
    } catch (error) {
      setOperationStatus('failed')
      setResults(prev => ({
        ...prev,
        errors: [...prev.errors, error instanceof Error ? error.message : String(error)]
      }))
      toast.error(`Cleanup failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cleanup Operations
          </h3>
        </div>
      </div>

      <div className="space-y-6">
        {/* Description */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-300">
                Token Account Cleanup
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                This operation will close all token accounts associated with your trading wallets and send any remaining SOL and token balances back to your admin wallet. This helps recover rent and consolidate funds after trading.
              </p>
            </div>
          </div>
        </div>

        {/* Prerequisites Check */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border ${
            adminWallet 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              {adminWallet ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <span className={`font-medium ${
                adminWallet 
                  ? 'text-green-800 dark:text-green-300' 
                  : 'text-red-800 dark:text-red-300'
              }`}>
                Admin Wallet
              </span>
            </div>
            <p className={`text-sm mt-1 ${
              adminWallet 
                ? 'text-green-700 dark:text-green-400' 
                : 'text-red-700 dark:text-red-400'
            }`}>
              {adminWallet 
                ? `Ready (${adminWallet.publicKey.slice(0, 8)}...)`
                : 'Admin wallet required'
              }
            </p>
          </div>

          <div className={`p-4 rounded-lg border ${
            tradingWallets.length > 0
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              {tradingWallets.length > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <span className={`font-medium ${
                tradingWallets.length > 0
                  ? 'text-green-800 dark:text-green-300' 
                  : 'text-red-800 dark:text-red-300'
              }`}>
                Trading Wallets
              </span>
            </div>
            <p className={`text-sm mt-1 ${
              tradingWallets.length > 0
                ? 'text-green-700 dark:text-green-400' 
                : 'text-red-700 dark:text-red-400'
            }`}>
              {tradingWallets.length > 0
                ? `${tradingWallets.length} wallets available`
                : 'Trading wallets required'
              }
            </p>
          </div>

          <div className={`p-4 rounded-lg border ${
            currentSession
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              {currentSession ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <span className={`font-medium ${
                currentSession
                  ? 'text-green-800 dark:text-green-300' 
                  : 'text-red-800 dark:text-red-300'
              }`}>
                Token Information
              </span>
            </div>
            <p className={`text-sm mt-1 ${
              currentSession
                ? 'text-green-700 dark:text-green-400' 
                : 'text-red-700 dark:text-red-400'
            }`}>
              {currentSession
                ? `${currentSession.tokenName} ready`
                : 'Token information required'
              }
            </p>
          </div>
        </div>

        {/* Operation Progress */}
        {operationStatus === 'running' && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
              <span className="font-medium text-blue-800 dark:text-blue-300">
                Cleanup in progress...
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-700 dark:text-blue-400">
                  Progress
                </span>
                <span className="text-blue-700 dark:text-blue-400">
                  {progress}%
                </span>
              </div>
              
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div 
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {operationStatus === 'completed' && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-800 dark:text-green-300">
                Cleanup completed successfully
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-green-600 dark:text-green-400">SOL Collected:</span>
                <div className="font-semibold text-green-900 dark:text-green-100">
                  {results.solCollected.toFixed(6)} SOL
                </div>
              </div>
              <div>
                <span className="text-green-600 dark:text-green-400">Tokens Collected:</span>
                <div className="font-semibold text-green-900 dark:text-green-100">
                  {results.tokensCollected.toFixed(2)} {currentSession?.tokenName || 'Tokens'}
                </div>
              </div>
              <div>
                <span className="text-green-600 dark:text-green-400">Accounts Closed:</span>
                <div className="font-semibold text-green-900 dark:text-green-100">
                  {results.accountsClosed}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Errors */}
        {operationStatus === 'failed' && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="font-medium text-red-800 dark:text-red-300">
                Cleanup failed
              </span>
            </div>
            
            <div className="space-y-2">
              {results.errors.map((error, index) => (
                <p key={index} className="text-sm text-red-700 dark:text-red-400">
                  {error}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6">
          <button
            onClick={handleCleanup}
            disabled={!adminWallet || tradingWallets.length === 0 || !currentSession || isLoading}
            className="w-full flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5 mr-2" />
            )}
            {isLoading ? 'Processing...' : 'Close Token Accounts & Send Balance to Admin'}
          </button>
        </div>

        {/* Warning */}
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-medium text-yellow-800 dark:text-yellow-300">
                Important Notice
              </h5>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                This operation is irreversible. All token accounts will be closed and balances will be sent to the admin wallet. Make sure you have completed all trading operations before proceeding.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CleanupOperations