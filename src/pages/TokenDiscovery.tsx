import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Search, TrendingUp, BarChart3, AlertTriangle } from 'lucide-react'
import TokenDiscovery from '../components/tokens/TokenDiscovery'
import TokenValidator from '../components/tokens/TokenValidator'
import { setCurrentSession } from '../store/slices/sessionSlice'

const TokenDiscoveryPage: React.FC = () => {
  const dispatch = useDispatch()
  const [selectedTab, setSelectedTab] = useState<'discovery' | 'validator'>('discovery')
  const [validatedTokens, setValidatedTokens] = useState<any[]>([])

  const handleTokenValidated = (tokenData: any, poolKeys: any) => {
    const newToken = {
      ...tokenData,
      poolKeys,
      validatedAt: new Date().toISOString()
    }
    
    setValidatedTokens(prev => {
      const existing = prev.findIndex(t => t.address === tokenData.address)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = newToken
        return updated
      }
      return [newToken, ...prev].slice(0, 10) // Keep last 10 validated tokens
    })
  }

  const tabs = [
    {
      id: 'discovery' as const,
      name: 'Token Discovery',
      icon: Search,
      description: 'Comprehensive token analysis and validation'
    },
    {
      id: 'validator' as const,
      name: 'Quick Validator',
      icon: TrendingUp,
      description: 'Fast token address validation'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Token Discovery & Validation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover, validate, and analyze Solana tokens for trading
          </p>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
          <BarChart3 className="w-4 h-4" />
          <span>{validatedTokens.length} tokens validated</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = selectedTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-solana-500 text-solana-600 dark:text-solana-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {selectedTab === 'discovery' ? (
            <TokenDiscovery 
              onTokenValidated={handleTokenValidated}
              showFullInterface={true}
            />
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Quick Token Validation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Quickly validate token addresses without full analysis
                </p>
              </div>
              
              <TokenValidator 
                onValidated={(address, data) => handleTokenValidated({ ...data, address }, null)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Recently Validated Tokens */}
      {validatedTokens.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recently Validated Tokens
          </h3>
          
          <div className="space-y-3">
            {validatedTokens.map((token, index) => (
              <div
                key={`${token.address}-${index}`}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => setSelectedTab('discovery')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-solana-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {token.symbol?.charAt(0) || 'T'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {token.name} ({token.symbol})
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {token.address.slice(0, 8)}...{token.address.slice(-8)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {token.price || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(token.validatedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integration Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-300">
              Backend Integration Ready
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              This interface integrates directly with your existing backend functions:
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-400 mt-2 space-y-1">
              <li>• <code>validateTokenAddress()</code> - DexScreener API integration</li>
              <li>• <code>getPoolKeysForTokenAddress()</code> - Pool discovery</li>
              <li>• <code>getMarketIdForTokenAddress()</code> - Market ID fetching</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TokenDiscoveryPage