import React, { useState } from 'react'
import { Search, CheckCircle, AlertCircle, Loader2, ExternalLink, TrendingUp, DollarSign, Activity } from 'lucide-react'
import { backendService } from '../../services/backendService'
import toast from 'react-hot-toast'

interface TokenData {
  name: string
  symbol: string
  address: string
  price: string
  volume: { h24: string }
  priceChange: { h24: string }
  txns: {
    h24: {
      buys: number
      sells: number
    }
  }
}

interface TokenDiscoveryProps {
  onTokenValidated: (tokenData: TokenData, poolKeys: any) => void
  initialAddress?: string
  showFullInterface?: boolean
}

const TokenDiscovery: React.FC<TokenDiscoveryProps> = ({
  onTokenValidated,
  initialAddress = '',
  showFullInterface = true
}) => {
  const [tokenAddress, setTokenAddress] = useState(initialAddress)
  const [isValidating, setIsValidating] = useState(false)
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const validateToken = async () => {
    if (!tokenAddress.trim()) {
      setError('Please enter a token address')
      return
    }

    // Basic Solana address validation
    if (tokenAddress.length < 32 || tokenAddress.length > 44) {
      setError('Invalid Solana token address format')
      return
    }

    setIsValidating(true)
    setError(null)
    setTokenData(null)

    try {
      console.log('🔍 Validating token with backend:', tokenAddress)
      
      // Test backend connection first
      const isConnected = await backendService.testConnection()
      if (!isConnected) {
        throw new Error('Backend server is not running. Please start the backend server first.')
      }

      // Step 1: Validate token and get data from backend
      const validationResult = await backendService.validateTokenAddress(tokenAddress)
      console.log('✅ Token validation result:', validationResult)
      
      if (!validationResult.isValid || !validationResult.tokenData) {
        throw new Error('Token not found or not available for trading. Please check the address and try again.')
      }

      console.log('✅ Token data received:', validationResult.tokenData)
      setTokenData(validationResult.tokenData)

      // Step 2: Get pool information from backend
      console.log('🔍 Getting pool information...')
      const poolKeys = await backendService.getPoolKeys(tokenAddress)
      console.log('✅ Pool keys received:', poolKeys)
      
      if (!poolKeys) {
        throw new Error('This token is not available for trading on Raydium')
      }

      console.log('✅ Pool information confirmed')

      // Success - call the callback with validated data
      onTokenValidated(validationResult.tokenData, poolKeys)
      toast.success(`${validationResult.tokenData.name} is ready for trading!`)

    } catch (error) {
      console.error('❌ Token validation error:', error)
      const errorMessage = error.message || 'Failed to validate token'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsValidating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isValidating) {
      validateToken()
    }
  }

  const formatNumber = (num: string | number) => {
    if (!num) return '0'
    const numValue = typeof num === 'string' ? parseFloat(num) : num
    if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(1)}M`
    } else if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(1)}K`
    }
    return numValue.toFixed(2)
  }

  return (
    <div className="space-y-6">
      {/* Token Address Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Solana Token Address
        </label>
        <div className="relative">
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter token address (e.g., 4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R)"
            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-solana-500 focus:border-transparent"
            disabled={isValidating}
          />
          <button
            onClick={validateToken}
            disabled={isValidating || !tokenAddress.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-solana-600 dark:hover:text-solana-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isValidating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {error && (
          <div className="mt-2 flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Validation Results */}
      {tokenData && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
                {tokenData.name} ({tokenData.symbol})
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400">
                Ready for trading on Raydium
              </p>
            </div>
          </div>

          {/* Market Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Price</div>
              <div className="text-lg font-bold text-green-800 dark:text-green-300">
                ${tokenData.price ? parseFloat(tokenData.price).toFixed(6) : '0.000000'}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">24h Volume</div>
              <div className="text-lg font-bold text-blue-800 dark:text-blue-300">
                ${formatNumber(tokenData.volume?.h24 || '0')}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">24h Change</div>
              <div className={`text-lg font-bold ${
                tokenData.priceChange?.h24?.toString().startsWith('+') || parseFloat(tokenData.priceChange?.h24 || '0') > 0
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {tokenData.priceChange?.h24}%
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">24h Trades</div>
              <div className="text-lg font-bold text-orange-800 dark:text-orange-300">
                {formatNumber((tokenData.txns?.h24?.buys || 0) + (tokenData.txns?.h24?.sells || 0))}
              </div>
            </div>
          </div>

          {/* Trading Activity */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
              <div className="text-sm font-medium text-green-700 dark:text-green-300">24h Buys</div>
              <div className="text-xl font-bold text-green-800 dark:text-green-200">
                {formatNumber(tokenData.txns?.h24?.buys || 0)}
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3">
              <div className="text-sm font-medium text-red-700 dark:text-red-300">24h Sells</div>
              <div className="text-xl font-bold text-red-800 dark:text-red-200">
                {formatNumber(tokenData.txns?.h24?.sells || 0)}
              </div>
            </div>
          </div>

          {/* External Links */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-green-200 dark:border-green-800">
            <a
              href={`https://solscan.io/token/${tokenData.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm font-medium">View on Solscan</span>
            </a>
            
            <a
              href={`https://dexscreener.com/solana/${tokenData.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm font-medium">View on DexScreener</span>
            </a>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isValidating && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-300">
                Validating Token...
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Checking token data and trading availability
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      {!tokenData && !isValidating && !error && (
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            How to find a token address:
          </h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Visit DexScreener or Solscan</li>
            <li>• Search for your token by name</li>
            <li>• Copy the contract address</li>
            <li>• Paste it above to validate</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default TokenDiscovery