import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Wifi, WifiOff, Loader2, RefreshCw, AlertTriangle } from 'lucide-react'
import { RootState } from '../store/store'
import { backendService } from '../services/backendService'
import toast from 'react-hot-toast'

const ConnectionStatus: React.FC = () => {
  const { status, reconnectAttempts, maxReconnectAttempts } = useSelector(
    (state: RootState) => state.websocket
  )
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [isCheckingBackend, setIsCheckingBackend] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  // Check backend connection on mount and periodically
  useEffect(() => {
    checkBackendConnection()
    
    // Check every 30 seconds
    const interval = setInterval(checkBackendConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkBackendConnection = async () => {
    if (isCheckingBackend) return
    
    setIsCheckingBackend(true)
    setBackendStatus('checking')
    setLastError(null)
    
    try {
      const isConnected = await backendService.testConnection()
      setBackendStatus(isConnected ? 'connected' : 'disconnected')
      
      if (!isConnected) {
        const errorMsg = 'Backend server is not running or not accessible at http://localhost:12001'
        setLastError(errorMsg)
        console.warn(errorMsg)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error checking backend connection:', errorMsg)
      setBackendStatus('disconnected')
      setLastError(errorMsg)
    } finally {
      setIsCheckingBackend(false)
    }
  }

  const handleRetryConnection = async () => {
    toast.loading('Reconnecting to backend...', { id: 'reconnect' })
    await checkBackendConnection()
    
    if (backendStatus === 'connected') {
      toast.success('Backend connection restored!', { id: 'reconnect' })
    } else {
      toast.error('Failed to connect to backend. Please ensure the server is running on port 12001.', { 
        id: 'reconnect',
        duration: 5000
      })
    }
  }

  const getStatusConfig = () => {
    // WebSocket status
    const wsConfig = {
      icon: status === 'connecting' ? Loader2 : 
            status === 'connected' ? Wifi : WifiOff,
      text: status === 'connecting' ? 'Connecting...' : 
            status === 'connected' ? 'Connected' : 
            status === 'error' ? 'Connection Error' : 'Disconnected',
      color: status === 'connected' ? 'text-secondary' : 
             status === 'connecting' ? 'text-yellow-500' : 'text-red-500',
      bgColor: status === 'connected' ? 'bg-secondary/10' : 
               status === 'connecting' ? 'bg-yellow-500/10' : 'bg-red-500/10',
      borderColor: status === 'connected' ? 'border-secondary/20' : 
                  status === 'connecting' ? 'border-yellow-500/20' : 'border-red-500/20',
    }

    // Backend status
    const beConfig = {
      icon: backendStatus === 'checking' ? Loader2 : 
            backendStatus === 'connected' ? Wifi : WifiOff,
      text: backendStatus === 'checking' ? 'Checking...' : 
            backendStatus === 'connected' ? 'Backend Connected' : 'Backend Offline',
      color: backendStatus === 'connected' ? 'text-secondary' : 
             backendStatus === 'checking' ? 'text-yellow-500' : 'text-red-500',
      bgColor: backendStatus === 'connected' ? 'bg-secondary/10' : 
               backendStatus === 'checking' ? 'bg-yellow-500/10' : 'bg-red-500/10',
      borderColor: backendStatus === 'connected' ? 'border-secondary/20' : 
                  backendStatus === 'checking' ? 'border-yellow-500/20' : 'border-red-500/20',
    }

    return { ws: wsConfig, be: beConfig }
  }

  const config = getStatusConfig()
  const WsIcon = config.ws.icon
  const BeIcon = config.be.icon

  return (
    <div className="space-y-2">
      {/* WebSocket Status */}
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${config.ws.bgColor} ${config.ws.borderColor}`}>
        <WsIcon 
          className={`w-4 h-4 ${config.ws.color} ${
            status === 'connecting' ? 'animate-spin' : 
            status === 'connected' ? 'connection-pulse connected' : ''
          }`} 
        />
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${config.ws.color}`}>
            {config.ws.text}
          </div>
          {reconnectAttempts > 0 && status !== 'connected' && (
            <div className="text-xs text-muted-foreground">
              Attempt {reconnectAttempts}/{maxReconnectAttempts}
            </div>
          )}
        </div>
      </div>

      {/* Backend Status */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${config.be.bgColor} ${config.be.borderColor}`}>
        <div className="flex items-center space-x-2">
          <BeIcon 
            className={`w-4 h-4 ${config.be.color} ${
              backendStatus === 'checking' ? 'animate-spin' : 
              backendStatus === 'connected' ? 'connection-pulse connected' : ''
            }`} 
          />
          <div className={`text-sm font-medium ${config.be.color}`}>
            {config.be.text}
          </div>
        </div>
        
        {backendStatus === 'disconnected' && (
          <button 
            onClick={handleRetryConnection}
            disabled={isCheckingBackend}
            className="text-xs flex items-center space-x-1 text-primary hover:text-primary/80 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isCheckingBackend ? 'animate-spin' : ''}`} />
            <span>Retry</span>
          </button>
        )}
      </div>

      {/* Error Details */}
      {lastError && backendStatus === 'disconnected' && (
        <div className="flex items-start space-x-2 px-3 py-2 rounded-lg border bg-orange-50 border-orange-200">
          <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-orange-800">
              Connection Issue
            </div>
            <div className="text-xs text-orange-600 mt-1">
              {lastError}
            </div>
            <div className="text-xs text-orange-600 mt-1">
              To start the backend server, run: <code className="bg-orange-100 px-1 rounded">npm run start-backend</code>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConnectionStatus