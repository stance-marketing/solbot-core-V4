import React, { useState, useEffect } from 'react'
import { Coins, ArrowDown, Loader2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { backendService } from '../../services/backendService'
import { WalletData } from '../../store/slices/walletSlice'
import toast from 'react-hot-toast'

interface TokenDistributionPanelProps {
  adminWallet: WalletData | null
  tradingWallets: WalletData[]
  tokenAddress: string
  tokenSymbol: string
  onDistributionComplete: (wallets: WalletData[]) => void
}

const TokenDistributionPanel: React.FC<TokenDistributionPanelProps> = ({
  adminWallet,
  tradingWallets,
  tokenAddress,
  tokenSymbol,
  onDistributionComplete
}) => {
  const [isDistributing, setIsDistributing] = useState(false)
  const [isCheckingBalance, setIsCheckingBalance] = useState(false)
  const [adminTokenBalance, setAdminTokenBalance] = useState(0)
  const [distributionMode, setDistributionMode] = useState<'equal' | 'custom'>('equal')
  const [customAmountPerWallet, setCustomAmountPerWallet] = useState(0)

  useEffect(() => {
    if (adminWallet && tokenAddress) {
      checkAdminTokenBalance()
    }
  }, [adminWallet, tokenAddress])

  const checkAdminTokenBalance = async () => {
    if (!adminWallet) return

    setIsCheckingBalance(true)
    try {
      const balance = await backendService.getAdminTokenBalance(adminWallet, tokenAddress)
      setAdminTokenBalance(balance)
    } catch (error) {
      console.error('Failed to get admin token balance:', error)
      setAdminTokenBalance(0)
    } finally {
      setIsCheckingBalance(false)
    }
  }

  const distributeTokens = async () => {
    if (!adminWallet || tradingWallets.length === 0) {
      toast.error('Admin wallet and trading wallets are required')
      return
    }

    if (adminTokenBalance === 0) {
      toast.error('Admin wallet has no tokens to distribute')
      return
    }

    const amountPerWallet = distributionMode === 'equal' 
      ? adminTokenBalance / tradingWallets.length
      : customAmountPerWallet

    if (amountPerWallet <= 0) {
      toast.error('Invalid distribution amount')
      return
    }

    const totalRequired = amountPerWallet * tradingWallets.length
    if (totalRequired > adminTokenBalance) {
      toast.error(`Not enough tokens. Required: ${totalRequired.toFixed(2)}, Available: ${adminTokenBalance.toFixed(2)}`)
      return
    }

    setIsDistributing(true)
    try {
      const updatedWallets = await backendService.distributeTokens(
        adminWallet,
        tradingWallets,
        tokenAddress,
        amountPerWallet
      )
      
      onDistributionComplete(updatedWallets)
      toast.success(`Successfully distributed ${tokenSymbol} to ${updatedWallets.length} wallets`)
      
      // Refresh admin balance
      await checkAdminTokenBalance()
    } catch (error) {
      toast.error(`Failed to distribute tokens: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsDistributing(false)
    }
  }

  const canDistribute = adminWallet && tradingWallets.length > 0 && adminTokenBalance > 0

  const equalAmountPerWallet = tradingWallets.length > 0 ? adminTokenBalance / tradingWallets.length : 0
  const amountPerWallet = distributionMode === 'equal' ? equalAmountPerWallet : customAmountPerWallet
  const totalRequired = amountPerWallet * tradingWallets.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Coins className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {tokenSymbol} Token Distribution
          </h3>
        </div>
        
        <button
          onClick={checkAdminTokenBalance}
          disabled={isCheckingBalance || !adminWallet}
          className="flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isCheckingBalance ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Admin Token Balance */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          Admin Wallet Token Balance
        </h4>

        <div className={`p-4 rounded-lg border ${
          adminTokenBalance > 0
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {adminTokenBalance > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              )}
              <span className={`font-medium ${
                adminTokenBalance > 0
                  ? 'text-green-800 dark:text-green-300'
                  : 'text-yellow-800 dark:text-yellow-300'
              }`}>
                Available {tokenSymbol}
              </span>
            </div>
            
            <div className="text-right">
              <p className={`text-2xl font-bold ${
                adminTokenBalance > 0
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-yellow-900 dark:text-yellow-100'
              }`}>
                {isCheckingBalance ? (
                  <Loader2 className="w-6 h-6 animate-spin inline" />
                ) : (
                  adminTokenBalance.toFixed(2)
                )}
              </p>
              <p className={`text-sm ${
                adminTokenBalance > 0
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-yellow-700 dark:text-yellow-400'
              }`}>
                {adminTokenBalance > 0 ? 'Ready for distribution' : 'No tokens available'}
              </p>
            </div>
          </div>
        </div>

        {adminTokenBalance === 0 && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-medium text-blue-800 dark:text-blue-300">
                  No Tokens Found
                </h5>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  Your admin wallet doesn't have any {tokenSymbol} tokens. You can skip this step and distribute tokens later,
                  or acquire some {tokenSymbol} tokens first.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Distribution Configuration */}
      {adminTokenBalance > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">
            Distribution Settings
          </h4>

          {/* Distribution Mode */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Distribution Mode
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setDistributionMode('equal')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  distributionMode === 'equal'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <h5 className="font-medium text-gray-900 dark:text-white">Equal Distribution</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Distribute all tokens equally among wallets
                </p>
                {distributionMode === 'equal' && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    {equalAmountPerWallet.toFixed(2)} {tokenSymbol} per wallet
                  </p>
                )}
              </button>

              <button
                onClick={() => setDistributionMode('custom')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  distributionMode === 'custom'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <h5 className="font-medium text-gray-900 dark:text-white">Custom Amount</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Specify amount per wallet
                </p>
              </button>
            </div>
          </div>

          {/* Custom Amount Input */}
          {distributionMode === 'custom' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {tokenSymbol} per Wallet
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={adminTokenBalance}
                value={customAmountPerWallet}
                onChange={(e) => setCustomAmountPerWallet(parseFloat(e.target.value) || 0)}
                disabled={isDistributing}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
              />
            </div>
          )}

          {/* Distribution Summary */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <ArrowDown className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-800 dark:text-green-300">
                Distribution Summary
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-green-600 dark:text-green-400">Per Wallet:</span>
                <div className="font-semibold text-green-900 dark:text-green-100">
                  {amountPerWallet.toFixed(2)} {tokenSymbol}
                </div>
              </div>
              <div>
                <span className="text-green-600 dark:text-green-400">Recipients:</span>
                <div className="font-semibold text-green-900 dark:text-green-100">
                  {tradingWallets.length} wallets
                </div>
              </div>
              <div>
                <span className="text-green-600 dark:text-green-400">Total Required:</span>
                <div className="font-semibold text-green-900 dark:text-green-100">
                  {totalRequired.toFixed(2)} {tokenSymbol}
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6">
            <button
              onClick={distributeTokens}
              disabled={!canDistribute || isDistributing || totalRequired > adminTokenBalance}
              className="w-full flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDistributing ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <ArrowDown className="w-5 h-5 mr-2" />
              )}
              {isDistributing ? `Distributing ${tokenSymbol}...` : `Distribute ${tokenSymbol} to Trading Wallets`}
            </button>
          </div>

          {/* Validation Warnings */}
          {totalRequired > adminTokenBalance && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-medium text-red-800 dark:text-red-300">
                    Insufficient Tokens
                  </h5>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    You need {totalRequired.toFixed(2)} {tokenSymbol} but only have {adminTokenBalance.toFixed(2)} {tokenSymbol} available.
                    Reduce the amount per wallet or acquire more tokens.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TokenDistributionPanel