import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
  Settings as SettingsIcon, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Globe,
  Sliders,
  Clock,
  Repeat,
  Percent,
  DollarSign,
  RotateCcw,
  Folder
} from 'lucide-react'
import { RootState } from '../store/store'
import { 
  updateSwapConfig, 
  resetSwapConfig, 
  saveConfig, 
  clearUnsavedChanges 
} from '../store/slices/configSlice'
import toast from 'react-hot-toast'

const Settings: React.FC = () => {
  const dispatch = useDispatch()
  const { swapConfig, hasUnsavedChanges, isLoading } = useSelector((state: RootState) => state.config)
  
  const [isTestingRPC, setIsTestingRPC] = useState(false)
  const [rpcStatus, setRpcStatus] = useState<'untested' | 'success' | 'error'>('untested')
  const [rpcLatency, setRpcLatency] = useState<number | null>(null)
  
  const [localConfig, setLocalConfig] = useState({ ...swapConfig })

  useEffect(() => {
    setLocalConfig({ ...swapConfig })
  }, [swapConfig])

  const handleInputChange = (key: string, value: any) => {
    // Convert numeric strings to numbers
    const processedValue = !isNaN(Number(value)) && value !== '' ? Number(value) : value
    setLocalConfig({ ...localConfig, [key]: processedValue })
  }

  const handleSaveConfig = () => {
    dispatch(updateSwapConfig(localConfig))
    dispatch(saveConfig())
    toast.success('Configuration saved successfully')
  }

  const handleResetConfig = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      dispatch(resetSwapConfig())
      toast.success('Configuration reset to defaults')
    }
  }

  const handleDiscardChanges = () => {
    setLocalConfig({ ...swapConfig })
    dispatch(clearUnsavedChanges())
    toast.success('Changes discarded')
  }

  const testRPCConnection = async () => {
    setIsTestingRPC(true)
    setRpcStatus('untested')
    setRpcLatency(null)
    
    try {
      const startTime = Date.now()
      const response = await fetch(localConfig.RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getHealth',
        }),
      })
      
      const latency = Date.now() - startTime
      setRpcLatency(latency)
      
      if (response.ok) {
        const data = await response.json()
        if (data.result === 'ok') {
          setRpcStatus('success')
          toast.success(`RPC connection successful (${latency}ms)`)
        } else {
          setRpcStatus('error')
          toast.error('RPC connection failed: Unhealthy node')
        }
      } else {
        setRpcStatus('error')
        toast.error(`RPC connection failed: ${response.statusText}`)
      }
    } catch (error) {
      setRpcStatus('error')
      toast.error(`RPC connection failed: ${error.message}`)
    } finally {
      setIsTestingRPC(false)
    }
  }

  const configSections = [
    {
      title: 'Connection Settings',
      icon: Globe,
      fields: [
        { key: 'RPC_URL', label: 'RPC URL', type: 'text', description: 'Solana RPC endpoint URL' },
        { key: 'WS_URL', label: 'WebSocket URL', type: 'text', description: 'Solana WebSocket endpoint URL' }
      ]
    },
    {
      title: 'Address Configuration',
      icon: Globe,
      fields: [
        { key: 'WSOL_ADDRESS', label: 'WSOL Address', type: 'text', description: 'Wrapped SOL token address' },
        { key: 'RAYDIUM_LIQUIDITY_POOL_V4_ADDRESS', label: 'Raydium Liquidity Pool V4 Address', type: 'text', description: 'Raydium liquidity pool program address' }
      ]
    },
    {
      title: 'Swap Configuration',
      icon: Sliders,
      fields: [
        { key: 'SLIPPAGE_PERCENT', label: 'Slippage Percentage', type: 'number', description: 'Maximum allowed slippage for swaps', step: '0.1' },
        { key: 'initialAmount', label: 'Initial Amount', type: 'number', description: 'Initial amount of SOL to swap', step: '0.00001' },
        { key: 'TOKEN_TRANSFER_THRESHOLD', label: 'Token Transfer Threshold', type: 'number', description: 'Minimum tokens to keep in wallet', step: '0.1' }
      ]
    },
    {
      title: 'Retry Configuration',
      icon: Repeat,
      fields: [
        { key: 'poolSearchMaxRetries', label: 'Pool Search Max Retries', type: 'number', description: 'Maximum number of retries for pool search' },
        { key: 'poolSearchRetryInterval', label: 'Pool Search Retry Interval (ms)', type: 'number', description: 'Retry interval for pool search in milliseconds' },
        { key: 'retryInterval', label: 'Retry Interval (ms)', type: 'number', description: 'Time interval in milliseconds for retrying failed transactions' },
        { key: 'maxRetries', label: 'Max Retries', type: 'number', description: 'Maximum retries for sending transactions' }
      ]
    },
    {
      title: 'Fees and Limits',
      icon: DollarSign,
      fields: [
        { key: 'RENT_EXEMPT_FEE', label: 'Rent Exempt Fee', type: 'number', description: 'Rent exempt fee for token accounts' },
        { key: 'maxLamports', label: 'Max Lamports', type: 'number', description: 'Maximum lamports for transaction' },
        { key: 'RENT_EXEMPT_SWAP_FEE', label: 'Rent Exempt Swap Fee', type: 'number', description: 'Rent exempt fee for swap transactions' }
      ]
    },
    {
      title: 'Trading Durations',
      icon: Clock,
      fields: [
        { key: 'TRADE_DURATION_VOLUME', label: 'Volume Trading Duration (ms)', type: 'number', description: 'Duration for volume-focused trading strategy' },
        { key: 'TRADE_DURATION_MAKER', label: 'Maker Trading Duration (ms)', type: 'number', description: 'Duration for maker-focused trading strategy' },
        { key: 'loopInterval', label: 'Loop Interval (ms)', type: 'number', description: 'Loop interval in milliseconds' },
        { key: 'buyDuration', label: 'Buy Phase Duration (ms)', type: 'number', description: 'Duration of buy phase in milliseconds' },
        { key: 'sellDuration', label: 'Sell Phase Duration (ms)', type: 'number', description: 'Duration of sell phase in milliseconds' }
      ]
    },
    {
      title: 'Percentage Configuration',
      icon: Percent,
      fields: [
        { key: 'minPercentage', label: 'Min Buy Percentage', type: 'number', description: 'Minimum percentage for buy amounts', step: '0.1' },
        { key: 'maxPercentage', label: 'Max Buy Percentage', type: 'number', description: 'Maximum percentage for buy amounts', step: '0.1' },
        { key: 'minSellPercentage', label: 'Min Sell Percentage', type: 'number', description: 'Minimum percentage for sell amounts', step: '0.1' },
        { key: 'maxSellPercentage', label: 'Max Sell Percentage', type: 'number', description: 'Maximum percentage for sell amounts', step: '0.1' }
      ]
    },
    {
      title: 'Session Configuration',
      icon: Folder,
      fields: [
        { key: 'SESSION_DIR', label: 'Session Directory', type: 'text', description: 'Directory to save session data' }
      ]
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Configuration Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your trading bot configuration
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {hasUnsavedChanges && (
            <button
              onClick={handleDiscardChanges}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Discard Changes
            </button>
          )}
          
          <button
            onClick={handleResetConfig}
            className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </button>
          
          <button
            onClick={handleSaveConfig}
            disabled={isLoading || !hasUnsavedChanges}
            className="flex items-center px-4 py-2 bg-solana-600 hover:bg-solana-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Configuration
          </button>
        </div>
      </div>

      {/* RPC Connection Test */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              RPC Connection Test
            </h2>
          </div>
          
          <button
            onClick={testRPCConnection}
            disabled={isTestingRPC}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            {isTestingRPC ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Test Connection
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              RPC URL
            </label>
            <input
              type="text"
              value={localConfig.RPC_URL}
              onChange={(e) => handleInputChange('RPC_URL', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2 mt-6">
            {rpcStatus === 'success' && (
              <>
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300">
                  Connected {rpcLatency && `(${rpcLatency}ms)`}
                </span>
              </>
            )}
            {rpcStatus === 'error' && (
              <>
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-red-700 dark:text-red-300">
                  Connection Failed
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Sections */}
      {configSections.map((section) => {
        const Icon = section.icon
        return (
          <div key={section.title} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {section.title}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={localConfig[field.key]}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    step={field.step}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {field.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Save Button (Bottom) */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={handleSaveConfig}
            disabled={isLoading}
            className="flex items-center px-6 py-3 bg-solana-600 hover:bg-solana-700 text-white font-medium rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Save Changes
          </button>
        </div>
      )}
    </div>
  )
}

export default Settings