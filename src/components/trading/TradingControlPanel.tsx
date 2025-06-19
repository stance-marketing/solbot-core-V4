import React from 'react'
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Zap, 
  Target,
  Loader2
} from 'lucide-react'

interface TradingControlPanelProps {
  status: string
  strategy: string | null
  selectedStrategy: 'INCREASE_MAKERS_VOLUME' | 'INCREASE_VOLUME_ONLY'
  onStrategyChange: (strategy: 'INCREASE_MAKERS_VOLUME' | 'INCREASE_VOLUME_ONLY') => void
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  isLoading: boolean
  canStart: boolean
}

const TradingControlPanel: React.FC<TradingControlPanelProps> = ({
  status,
  strategy,
  selectedStrategy,
  onStrategyChange,
  onStart,
  onPause,
  onResume,
  onStop,
  isLoading,
  canStart
}) => {
  const strategies = [
    {
      value: 'INCREASE_MAKERS_VOLUME' as const,
      name: 'Makers + Volume',
      description: 'Increase unique traders and trading volume',
      icon: Target,
      duration: '3 minutes',
      color: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
    },
    {
      value: 'INCREASE_VOLUME_ONLY' as const,
      name: 'Volume Only',
      description: 'Focus on maximizing trading volume',
      icon: Zap,
      duration: '20 minutes',
      color: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
    }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Trading Controls
          </h2>
        </div>
        
        {strategy && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Active: {strategy.replace('_', ' ').toLowerCase()}
          </div>
        )}
      </div>

      {/* Strategy Selection */}
      {status === 'idle' && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Select Trading Strategy
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategies.map((strat) => {
              const Icon = strat.icon
              const isSelected = selectedStrategy === strat.value
              
              return (
                <button
                  key={strat.value}
                  onClick={() => onStrategyChange(strat.value)}
                  className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                    isSelected
                      ? strat.color
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className={`w-6 h-6 mt-1 ${
                      isSelected ? 'text-current' : 'text-gray-400'
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {strat.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {strat.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Duration: {strat.duration}</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center space-x-3">
        {status === 'idle' && (
          <button
            onClick={onStart}
            disabled={!canStart || isLoading}
            className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Play className="w-5 h-5 mr-2" />
            )}
            Start Trading
          </button>
        )}

        {status === 'running' && (
          <>
            <button
              onClick={onPause}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Pause className="w-4 h-4 mr-2" />
              )}
              Pause
            </button>
            <button
              onClick={onStop}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Square className="w-4 h-4 mr-2" />
              )}
              Stop
            </button>
          </>
        )}

        {status === 'paused' && (
          <>
            <button
              onClick={onResume}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Resume
            </button>
            <button
              onClick={onStop}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Square className="w-4 h-4 mr-2" />
              )}
              Stop
            </button>
          </>
        )}

        {(status === 'stopped' || status === 'error') && (
          <button
            onClick={onStart}
            disabled={!canStart || isLoading}
            className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Play className="w-5 h-5 mr-2" />
            )}
            Restart Trading
          </button>
        )}
      </div>

      {/* Prerequisites Warning */}
      {!canStart && status === 'idle' && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            Complete session setup with admin wallet and trading wallets before starting.
          </p>
        </div>
      )}
    </div>
  )
}

export default TradingControlPanel