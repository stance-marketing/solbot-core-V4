import React, { useState } from 'react'
import { Search, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react'
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
      console.log('Validating token with backend:', tokenAddress)
      
      // Step 1: Validate token and get data from backend
      const validationResult = await backendService.validateTokenAddress(tokenAddress)
      
      if (!validationResult.isValid || !validationResult.tokenData) {
        throw new Error('Token not found or not tradeable. Please check the address.')
      }

      console.log('Token validated successfully:', validationResult.tokenData)
      setTokenData(validationResult.tokenData)

      // Step 2: Get pool information from backend
      console.log('Getting pool information...')
      const poolKeys = await backendService.getPoolKeys(tokenAddress)
      
      if (!poolKeys) {
        throw new Error('This token is not available for trading on Raydium')
      }

      console.log('Pool information confirmed')

      // Success - call the callback with validated data
      onTokenValidated(validationResult.tokenData, poolKeys)
      toast.success(`${validationResult.tokenData.name} is ready for trading!`)

    } catch (error) {
      console.error('Token validation error:', error)
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

  return (
    <div className="space-y-6">
      {/* Token Address Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Token Address
        </label>
        <div className="relative">
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter token address to start trading..."
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
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-medium text-green-800 dark:text-green-300">
              {tokenData.name} ({tokenData.symbol}) - Ready for Trading!
            </h3>
          </div>

          {/* Market Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-green-600 dark:text-green-400 font-medium">Price</div>
              <div className="text-green-800 dark:text-green-300">${tokenData.price}</div>
            </div>
            <div className="text-center">
              <div className="text-green-600 dark:text-green-400 font-medium">24h Volume</div>
              <div className="text-green-800 dark:text-green-300">${tokenData.volume?.h24}</div>
            </div>
            <div className="text-center">
              <div className="text-green-600 dark:text-green-400 font-medium">24h Change</div>
              <div className={`${
                tokenData.priceChange?.h24?.startsWith('+') 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {tokenData.priceChange?.h24}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-green-600 dark:text-green-400 font-medium">24h Trades</div>
              <div className="text-green-800 dark:text-green-300">
                {(tokenData.txns?.h24?.buys || 0) + (tokenData.txns?.h24?.sells || 0)}
              </div>
            </div>
          </div>

          {/* View on Solscan */}
          <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
            <a
              href={`https://solscan.io/token/${tokenData.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm">View on Solscan</span>
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
                Checking if this token is available for trading
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TokenDiscovery