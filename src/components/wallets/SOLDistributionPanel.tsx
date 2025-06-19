import React, { useState } from 'react'
import { DollarSign, ArrowDown, Loader2, AlertCircle, CheckCircle, Users } from 'lucide-react'
import { backendService } from '../../services/backendService'
import { WalletData } from '../../store/slices/walletSlice'
import toast from 'react-hot-toast'

interface SOLDistributionPanelProps {
  adminWallet: WalletData | null
  tradingWallets: WalletData[]
  onDistributionComplete: (wallets: WalletData[]) => void
}

const SOLDistributionPanel: React.FC<SOLDistributionPanelProps> = ({
  adminWallet,
  tradingWallets,
  onDistributionComplete
}) => {
  const [isDistributing, setIsDistributing] = useState(false)
  const [totalAmount, setTotalAmount] = useState(1.0)
  const [distributionProgress, setDistributionProgress] = useState<{
    completed: number
    total: number
    currentWallet?: string
  } | null>(null)

  const canDistribute = adminWallet && tradingWallets.length > 0 && totalAmount > 0

  const distributeSol = async () => {
    if (!canDistribute) {
      toast.error('Admin wallet and trading wallets are required')
      return
    }

    setIsDistributing(true)
    setDistributionProgress({ completed: 0, total: tradingWallets.length })

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setDistributionProgress(prev => {
          if (!prev || prev.completed >= prev.total) return prev
          return {
            ...prev,
            completed: prev.completed + 1,
            currentWallet: tradingWallets[prev.completed]?.publicKey
          }
        })
      }, 1000)

      const updatedWallets = await backendService.distributeSol(adminWallet, tradingWallets, totalAmount)
      
      clearInterval(progressInterval)
      setDistributionProgress(null)
      
      onDistributionComplete(updatedWallets)
      toast.success(`Successfully distributed ${totalAmount} SOL to ${updatedWallets.length} wallets`)
    } catch (error) {
      setDistributionProgress(null)
      toast.error(`Failed to distribute SOL: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsDistributing(false)
    }
  }

  const amountPerWallet = tradingWallets.length > 0 ? totalAmount / tradingWallets.length : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <DollarSign className="w-5 h-5 text-solana-600 dark:text-solana-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          SOL Distribution
        </h3>
      </div>

      {/* Prerequisites Check */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              ? `Ready (${adminWallet.solBalance.toFixed(6)} SOL available)`
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
              ? `${tradingWallets.length} wallets ready`
              : 'Trading wallets required'
            }
          </p>
        </div>
      </div>

      {/* Distribution Configuration */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          Distribution Settings
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Total SOL Amount to Distribute
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={totalAmount}
              onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
              disabled={isDistributing}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-solana-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SOL per Wallet
            </label>
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {amountPerWallet.toFixed(6)} SOL
              </span>
            </div>
          </div>
        </div>

        {/* Distribution Summary */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <ArrowDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-800 dark:text-blue-300">
              Distribution Summary
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-600 dark:text-blue-400">Total Amount:</span>
              <div className="font-semibold text-blue-900 dark:text-blue-100">
                {totalAmount.toFixed(6)} SOL
              </div>
            </div>
            <div>
              <span className="text-blue-600 dark:text-blue-400">Recipients:</span>
              <div className="font-semibold text-blue-900 dark:text-blue-100">
                {tradingWallets.length} wallets
              </div>
            </div>
            <div>
              <span className="text-blue-600 dark:text-blue-400">Per Wallet:</span>
              <div className="font-semibold text-blue-900 dark:text-blue-100">
                {amountPerWallet.toFixed(6)} SOL
              </div>
            </div>
          </div>
        </div>

        {/* Distribution Progress */}
        {distributionProgress && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Loader2 className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-spin" />
              <span className="font-medium text-yellow-800 dark:text-yellow-300">
                Distributing SOL...
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-yellow-700 dark:text-yellow-400">
                  Progress: {distributionProgress.completed} / {distributionProgress.total}
                </span>
                <span className="text-yellow-700 dark:text-yellow-400">
                  {Math.round((distributionProgress.completed / distributionProgress.total) * 100)}%
                </span>
              </div>
              
              <div className="w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-2">
                <div 
                  className="bg-yellow-600 dark:bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(distributionProgress.completed / distributionProgress.total) * 100}%` }}
                />
              </div>
              
              {distributionProgress.currentWallet && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 font-mono">
                  Current: {distributionProgress.currentWallet.slice(0, 8)}...{distributionProgress.currentWallet.slice(-8)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6">
          <button
            onClick={distributeSol}
            disabled={!canDistribute || isDistributing}
            className="w-full flex items-center justify-center px-6 py-3 bg-solana-600 hover:bg-solana-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDistributing ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <ArrowDown className="w-5 h-5 mr-2" />
            )}
            {isDistributing ? 'Distributing SOL...' : 'Distribute SOL to Trading Wallets'}
          </button>
        </div>

        {/* Warning */}
        {adminWallet && adminWallet.solBalance < totalAmount && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-medium text-red-800 dark:text-red-300">
                  Insufficient Balance
                </h5>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  Admin wallet has {adminWallet.solBalance.toFixed(6)} SOL but you're trying to distribute {totalAmount.toFixed(6)} SOL.
                  Please fund your admin wallet or reduce the distribution amount.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SOLDistributionPanel