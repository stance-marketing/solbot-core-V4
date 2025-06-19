import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Wifi, WifiOff, Loader2, RefreshCw, AlertTriangle, Server } from 'lucide-react'
import { RootState } from '../store/store'
import { backendService } from '../services/backendService'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const ConnectionStatus: React.FC = () => {
  const { status, reconnectAttempts, maxReconnectAttempts } = useSelector(
    (state: RootState) => state.websocket
  )
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [isCheckingBackend, setIsCheckingBackend] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

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
      setLastChecked(new Date())
      
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
      setLastChecked(new Date())
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
            backendStatus === 'connected' ? Server : WifiOff,
      text: backendStatus === 'checking' ? 'Checking...' : 
            backendStatus === 'connected' ? 'Backend Online' : 'Backend Offline',
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
    <div className="space-y-3">
      {/* WebSocket Status */}
      <motion.div 
        className={`flex items-center justify-between p-3 rounded-xl border ${config.ws.bgColor} ${config.ws.borderColor}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center space-x-3">
          <WsIcon 
            className={`w-5 h-5 ${config.ws.color} ${
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
      </motion.div>

      {/* Backend Status - Only show if connected or checking */}
      {(backendStatus === 'connected' || backendStatus === 'checking') && (
        <motion.div 
          className={`flex items-center justify-between p-3 rounded-xl border ${config.be.bgColor} ${config.be.borderColor}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center space-x-3">
            <BeIcon 
              className={`w-5 h-5 ${config.be.color} ${
                backendStatus === 'checking' ? 'animate-spin' : 
                backendStatus === 'connected' ? 'connection-pulse connected' : ''
              }`} 
            />
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${config.be.color}`}>
                {config.be.text}
              </div>
              {lastChecked && backendStatus === 'connected' && (
                <div className="text-xs text-muted-foreground">
                  Last check: {lastChecked.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Subtle Backend Offline Indicator - Only show retry button */}
      {backendStatus === 'disconnected' && (
        <motion.div 
          className="flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <button 
            onClick={handleRetryConnection}
            disabled={isCheckingBackend}
            className="text-xs flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-muted/20 text-muted-foreground hover:text-primary hover:bg-muted/30 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isCheckingBackend ? 'animate-spin' : ''}`} />
            <span>Reconnect Services</span>
          </button>
        </motion.div>
      )}

      {/* Simplified Error Message - Only show if backend is disconnected for more than 1 minute */}
      {lastError && backendStatus === 'disconnected' && lastChecked && 
       (Date.now() - lastChecked.getTime()) > 60000 && (
        <motion.div 
          className="flex items-center space-x-2 p-2 rounded-lg border border-orange-200/50 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-900/10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <div className="text-xs text-orange-600 dark:text-orange-400">
            Some features may be limited while reconnecting...
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default ConnectionStatus