import React, { useState } from 'react'
import { Search, CheckCircle, AlertCircle, Loader2, Eye, EyeOff, ExternalLink } from 'lucide-react'
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
  const [poolKeys, setPoolKeys] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

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
    setPoolKeys(null)

    try {
      console.log('Validating token:', tokenAddress)
      
      // Step 1: Validate token and get data from Dexscreener
      const validationResult = await backendService.validateTokenAddress(tokenAddress)
      
      if (!validationResult.isValid || !validationResult.tokenData) {
        throw new Error('Token not found or invalid. Please check the address.')
      }

      console.log('Token validated:', validationResult.tokenData)
      setTokenData(validationResult.tokenData)

      // Step 2: Get pool keys
      console.log('Fetching pool keys...')
      const fetchedPoolKeys = await backendService.getPoolKeys(tokenAddress)
      
      if (!fetchedPoolKeys) {
        throw new Error('Pool keys not found for this token')
      }

      console.log('Pool keys fetched:', fetchedPoolKeys)
      setPoolKeys(fetchedPoolKeys)

      // Step 3: Get market ID for additional validation
      try {
        const marketId = await backendService.getMarketId(tokenAddress)
        console.log('Market ID confirmed:', marketId)
      } catch (marketError) {
        console.warn('Market ID not found, but proceeding with pool keys')
      }

      // Success - call the callback
      onTokenValidated(validationResult.tokenData, fetchedPoolKeys)
      toast.success(`Token validated: ${validationResult.tokenData.name}`)

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
          Solana Token Address
        </label>
        <div className="relative">
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter Solana token address (e.g., 4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R)"
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
      {tokenData && poolKeys && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="font-medium text-green-800 dark:text-green-300">
                Token Validated Successfully
              </h3>
            </div>
            
            {showFullInterface && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center space-x-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
              >
                {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="text-sm">{showDetails ? 'Hide' : 'Show'} Details</span>
              </button>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-600 dark:text-green-400 font-medium">Name:</span>
              <span className="ml-2 text-green-800 dark:text-green-300">{tokenData.name}</span>
            </div>
            <div>
              <span className="text-green-600 dark:text-green-400 font-medium">Symbol:</span>
              <span className="ml-2 text-green-800 dark:text-green-300">{tokenData.symbol}</span>
            </div>
            <div>
              <span className="text-green-600 dark:text-green-400 font-medium">Pool:</span>
              <span className="ml-2 text-green-800 dark:text-green-300">✓ Raydium V{poolKeys.version || 4}</span>
            </div>
            <div>
              <span className="text-green-600 dark:text-green-400 font-medium">Status:</span>
              <span className="ml-2 text-green-800 dark:text-green-300">✓ Ready for Trading</span>
            </div>
          </div>

          {/* Detailed Info */}
          {showDetails && showFullInterface && (
            <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Market Data</h4>
                  <div className="space-y-1">
                    <div>
                      <span className="text-green-600 dark:text-green-400">Price:</span>
                      <span className="ml-2 text-green-800 dark:text-green-300">{tokenData.price}</span>
                    </div>
                    <div>
                      <span className="text-green-600 dark:text-green-400">24h Volume:</span>
                      <span className="ml-2 text-green-800 dark:text-green-300">{tokenData.volume?.h24}</span>
                    </div>
                    <div>
                      <span className="text-green-600 dark:text-green-400">24h Change:</span>
                      <span className={`ml-2 ${
                        tokenData.priceChange?.h24?.startsWith('+') 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {tokenData.priceChange?.h24}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Trading Activity</h4>
                  <div className="space-y-1">
                    <div>
                      <span className="text-green-600 dark:text-green-400">24h Buys:</span>
                      <span className="ml-2 text-green-800 dark:text-green-300">{tokenData.txns?.h24?.buys}</span>
                    </div>
                    <div>
                      <span className="text-green-600 dark:text-green-400">24h Sells:</span>
                      <span className="ml-2 text-green-800 dark:text-green-300">{tokenData.txns?.h24?.sells}</span>
                    </div>
                    <div>
                      <span className="text-green-600 dark:text-green-400">Pool Version:</span>
                      <span className="ml-2 text-green-800 dark:text-green-300">Raydium V{poolKeys.version || 4}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Token Address */}
              <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Token Address</h4>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded text-xs font-mono text-green-800 dark:text-green-300 break-all">
                    {tokenData.address}
                  </code>
                  <a
                    href={`https://solscan.io/token/${tokenData.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                    title="View on Solscan"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}
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
                Checking token data and pool information
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TokenDiscovery