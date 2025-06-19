import React, { useState } from 'react'
import { Search, CheckCircle, AlertCircle, Loader2, Copy } from 'lucide-react'
import { backendService } from '../../services/backendService'
import toast from 'react-hot-toast'

interface TokenValidatorProps {
  onValidated?: (tokenAddress: string, tokenData: any) => void
  className?: string
}

const TokenValidator: React.FC<TokenValidatorProps> = ({ onValidated, className = '' }) => {
  const [address, setAddress] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [tokenData, setTokenData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const validateToken = async () => {
    if (!address.trim()) {
      setError('Please enter a token address')
      return
    }

    if (address.length < 32) {
      setError('Invalid token address format')
      return
    }

    setIsValidating(true)
    setError(null)
    setIsValid(null)
    setTokenData(null)

    try {
      const result = await backendService.validateTokenAddress(address)
      
      if (result.isValid && result.tokenData) {
        setIsValid(true)
        setTokenData(result.tokenData)
        toast.success(`Token validated: ${result.tokenData.name}`)
        
        if (onValidated) {
          onValidated(address, result.tokenData)
        }
      } else {
        setIsValid(false)
        setError('Token not found or invalid')
        toast.error('Token validation failed')
      }
    } catch (error) {
      setIsValid(false)
      setError(`Validation failed: ${error.message}`)
      toast.error(`Validation error: ${error.message}`)
    } finally {
      setIsValidating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateToken()
    }
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    toast.success('Address copied to clipboard')
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter Solana token address..."
          className="block w-full pl-10 pr-20 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-solana-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
          {address && (
            <button
              onClick={copyAddress}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
          {isValidating ? (
            <Loader2 className="h-5 w-5 text-solana-500 animate-spin" />
          ) : isValid === true ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : isValid === false ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : null}
        </div>
      </div>

      <button
        onClick={validateToken}
        disabled={isValidating || !address.trim()}
        className="w-full flex items-center justify-center px-4 py-2 bg-solana-600 hover:bg-solana-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isValidating ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Search className="w-4 h-4 mr-2" />
        )}
        Validate Token
      </button>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {tokenData && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-800 dark:text-green-300">
              Token Validated
            </span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-green-600 dark:text-green-400">Name:</span>
              <span className="text-green-800 dark:text-green-300">{tokenData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600 dark:text-green-400">Symbol:</span>
              <span className="text-green-800 dark:text-green-300">{tokenData.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600 dark:text-green-400">Price:</span>
              <span className="text-green-800 dark:text-green-300">{tokenData.price}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TokenValidator