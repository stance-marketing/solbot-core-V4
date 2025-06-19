import React, { useState } from 'react'
import { 
  Globe, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Zap
} from 'lucide-react'
import toast from 'react-hot-toast'

interface RpcConnectionTesterProps {
  rpcUrl: string
  onRpcUrlChange: (url: string) => void
}

const RpcConnectionTester: React.FC<RpcConnectionTesterProps> = ({
  rpcUrl,
  onRpcUrlChange
}) => {
  const [isTestingRPC, setIsTestingRPC] = useState(false)
  const [rpcStatus, setRpcStatus] = useState<'untested' | 'success' | 'error'>('untested')
  const [rpcLatency, setRpcLatency] = useState<number | null>(null)
  const [localRpcUrl, setLocalRpcUrl] = useState(rpcUrl)

  const testRPCConnection = async () => {
    setIsTestingRPC(true)
    setRpcStatus('untested')
    setRpcLatency(null)
    
    try {
      const startTime = Date.now()
      const response = await fetch(localRpcUrl, {
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

  const handleApplyRpcUrl = () => {
    onRpcUrlChange(localRpcUrl)
    toast.success('RPC URL updated')
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            RPC Connection Test
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          {rpcStatus === 'success' && (
            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Connected</span>
              {rpcLatency && (
                <span className="text-sm">({rpcLatency}ms)</span>
              )}
            </div>
          )}
          
          {rpcStatus === 'error' && (
            <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Failed</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            RPC URL
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={localRpcUrl}
              onChange={(e) => setLocalRpcUrl(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://api.mainnet-beta.solana.com"
            />
            
            <button
              onClick={testRPCConnection}
              disabled={isTestingRPC || !localRpcUrl}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              {isTestingRPC ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Test
            </button>
            
            {localRpcUrl !== rpcUrl && (
              <button
                onClick={handleApplyRpcUrl}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                <Zap className="w-4 h-4 mr-2" />
                Apply
              </button>
            )}
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-300">
                RPC Connection Information
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                The RPC URL is used to connect to the Solana blockchain. A reliable and fast RPC provider is essential for optimal trading performance. Consider using a dedicated RPC service like QuickNode or Alchemy for production use.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RpcConnectionTester