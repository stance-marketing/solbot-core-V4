import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Users, 
  Clock,
  ExternalLink,
  Copy,
  RefreshCw
} from 'lucide-react'
import { backendService } from '../../services/backendService'
import toast from 'react-hot-toast'

interface TokenData {
  name: string
  symbol: string
  address: string
  price: string
  priceUsd: number
  volume24h: string
  priceChange24h: string
  priceChange24hPercent: number
  marketCap: string
  liquidity: string
  holders: string
  transactions24h: {
    buys: number
    sells: number
    total: number
  }
  pairAddress: string
  dexId: string
  chainId: string
  createdAt: string
  fdv: string
  pooledSol: string
  pooledToken: string
}

interface PoolKeys {
  id: string
  baseMint: string
  quoteMint: string
  lpMint: string
  baseDecimals: number
  quoteDecimals: number
  lpDecimals: number
  version: number
  programId: string
  authority: string
  openOrders: string
  targetOrders: string
  baseVault: string
  quoteVault: string
  withdrawQueue: string
  lpVault: string
  marketVersion: number
  marketProgramId: string
  marketId: string
  marketAuthority: string
  marketBaseVault: string
  marketQuoteVault: string
  marketBids: string
  marketAsks: string
  marketEventQueue: string
}

interface TokenDiscoveryProps {
  onTokenValidated?: (tokenData: TokenData, poolKeys: PoolKeys) => void
  initialAddress?: string
  showFullInterface?: boolean
}

const TokenDiscovery: React.FC<TokenDiscoveryProps> = ({ 
  onTokenValidated, 
  initialAddress = '',
  showFullInterface = true 
}) => {
  const dispatch = useDispatch()
  const [tokenAddress, setTokenAddress] = useState(initialAddress)
  const [isValidating, setIsValidating] = useState(false)
  const [isFetchingPool, setIsFetchingPool] = useState(false)
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [poolKeys, setPoolKeys] = useState<PoolKeys | null>(null)
  const [marketId, setMarketId] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [poolError, setPoolError] = useState<string | null>(null)
  const [lastValidated, setLastValidated] = useState<string | null>(null)

  // Auto-validate when address changes (with debounce)
  useEffect(() => {
    if (tokenAddress.length >= 32) {
      const timer = setTimeout(() => {
        validateToken()
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setTokenData(null)
      setPoolKeys(null)
      setMarketId(null)
      setValidationError(null)
      setPoolError(null)
    }
  }, [tokenAddress])

  const validateToken = async () => {
    if (!tokenAddress.trim() || tokenAddress.length < 32) {
      setValidationError('Please enter a valid Solana token address (32+ characters)')
      return
    }

    setIsValidating(true)
    setValidationError(null)
    setTokenData(null)

    try {
      // Call your backend token validation service
      const result = await backendService.validateTokenAddress(tokenAddress)
      
      if (result.isValid && result.tokenData) {
        setTokenData(result.tokenData)
        setLastValidated(new Date().toLocaleTimeString())
        toast.success(`Token validated: ${result.tokenData.name}`)
        
        // Automatically fetch pool keys after successful validation
        await fetchPoolKeys()
      } else {
        setValidationError('Token not found or invalid. Please check the address.')
        toast.error('Token validation failed')
      }
    } catch (error) {
      setValidationError(`Validation failed: ${error.message}`)
      toast.error(`Validation error: ${error.message}`)
    } finally {
      setIsValidating(false)
    }
  }

  const fetchPoolKeys = async () => {
    if (!tokenAddress) return

    setIsFetchingPool(true)
    setPoolError(null)
    setPoolKeys(null)
    setMarketId(null)

    try {
      // Call your backend pool keys service
      const keys = await backendService.getPoolKeys(tokenAddress)
      
      if (keys) {
        setPoolKeys(keys)
        setMarketId(keys.marketId)
        toast.success('Pool keys fetched successfully')
        
        // Call the callback if provided
        if (onTokenValidated && tokenData) {
          onTokenValidated(tokenData, keys)
        }
      } else {
        setPoolError('Pool not found for this token. It may not be tradeable on Raydium.')
        toast.error('Pool keys not found')
      }
    } catch (error) {
      setPoolError(`Failed to fetch pool keys: ${error.message}`)
      toast.error(`Pool error: ${error.message}`)
    } finally {
      setIsFetchingPool(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const formatNumber = (num: string | number) => {
    const value = typeof num === 'string' ? parseFloat(num) : num
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`
    return value.toFixed(2)
  }

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(num)
  }

  return (
    <div className="space-y-6">
      {/* Token Address Input */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Token Discovery
          </h2>
          {lastValidated && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Last validated: {lastValidated}
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="Enter Solana token address (e.g., 4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R)"
              className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-solana-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {isValidating ? (
                <Loader2 className="h-5 w-5 text-solana-500 animate-spin" />
              ) : tokenData ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : validationError ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : null}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={validateToken}
              disabled={isValidating || !tokenAddress.trim()}
              className="flex items-center px-4 py-2 bg-solana-600 hover:bg-solana-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Validate Token
            </button>

            {tokenData && (
              <button
                onClick={fetchPoolKeys}
                disabled={isFetchingPool}
                className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isFetchingPool ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Fetch Pool Keys
              </button>
            )}
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-red-700 dark:text-red-300">{validationError}</span>
              </div>
            </div>
          )}

          {/* Pool Error */}
          {poolError && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <span className="text-yellow-700 dark:text-yellow-300">{poolError}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Token Information Display */}
      {tokenData && showFullInterface && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-solana-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {tokenData.name} ({tokenData.symbol})
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {tokenData.address.slice(0, 8)}...{tokenData.address.slice(-8)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(tokenData.address, 'Token address')}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <a
                    href={`https://solscan.io/token/${tokenData.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(tokenData.priceUsd)}
              </div>
              <div className={`text-sm font-medium ${
                tokenData.priceChange24hPercent >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {tokenData.priceChange24hPercent >= 0 ? '+' : ''}{tokenData.priceChange24hPercent.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Token Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(tokenData.volume24h)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                24h Volume
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(tokenData.marketCap)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Market Cap
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(tokenData.liquidity)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Liquidity
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(tokenData.holders)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Holders
              </div>
            </div>
          </div>

          {/* Trading Activity */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              24h Trading Activity
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {tokenData.transactions24h.buys.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Buys
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {tokenData.transactions24h.sells.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Sells
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tokenData.transactions24h.total.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pool Information */}
      {poolKeys && showFullInterface && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pool Information
            </h3>
            <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span>Pool Validated</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pool Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pool ID
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {poolKeys.id.slice(0, 8)}...{poolKeys.id.slice(-8)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(poolKeys.id, 'Pool ID')}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Market ID
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {marketId ? `${marketId.slice(0, 8)}...${marketId.slice(-8)}` : 'Not available'}
                  </span>
                  {marketId && (
                    <button
                      onClick={() => copyToClipboard(marketId, 'Market ID')}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Base/Quote Pair
                </label>
                <div className="text-sm text-gray-900 dark:text-white">
                  {tokenData?.symbol}/SOL
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pool Version
                </label>
                <div className="text-sm text-gray-900 dark:text-white">
                  Raydium V{poolKeys.version}
                </div>
              </div>
            </div>

            {/* Pool Liquidity */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pooled SOL
                </label>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tokenData?.pooledSol ? formatNumber(tokenData.pooledSol) : 'Loading...'} SOL
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pooled {tokenData?.symbol}
                </label>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tokenData?.pooledToken ? formatNumber(tokenData.pooledToken) : 'Loading...'} {tokenData?.symbol}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Decimals
                </label>
                <div className="text-sm text-gray-900 dark:text-white">
                  Base: {poolKeys.baseDecimals} | Quote: {poolKeys.quoteDecimals}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  DEX
                </label>
                <div className="text-sm text-gray-900 dark:text-white">
                  Raydium
                </div>
              </div>
            </div>
          </div>

          {/* Pool Status */}
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-800 dark:text-green-300">
                Pool Ready for Trading
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
              All pool keys have been validated and the token is ready for automated trading operations.
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {tokenData && poolKeys && showFullInterface && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <a
              href={`https://dexscreener.com/solana/${tokenData.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on DexScreener
            </a>
            <a
              href={`https://solscan.io/token/${tokenData.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Solscan
            </a>
            <a
              href={`https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${tokenData.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Trade on Raydium
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default TokenDiscovery