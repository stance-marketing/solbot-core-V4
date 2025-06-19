import React from 'react'
import { useSelector } from 'react-redux'
import { Wifi, WifiOff, Loader2 } from 'lucide-react'
import { RootState } from '../store/store'

const ConnectionStatus: React.FC = () => {
  const { status, reconnectAttempts, maxReconnectAttempts } = useSelector(
    (state: RootState) => state.websocket
  )

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Connected',
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
        }
      case 'connecting':
        return {
          icon: Loader2,
          text: 'Connecting...',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
        }
      case 'disconnected':
        return {
          icon: WifiOff,
          text: 'Disconnected',
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
        }
      case 'error':
        return {
          icon: WifiOff,
          text: 'Connection Error',
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
        }
      default:
        return {
          icon: WifiOff,
          text: 'Unknown',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      <Icon 
        className={`w-4 h-4 ${config.color} ${
          status === 'connecting' ? 'animate-spin' : 
          status === 'connected' ? 'connection-pulse connected' : ''
        }`} 
      />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${config.color}`}>
          {config.text}
        </div>
        {reconnectAttempts > 0 && status !== 'connected' && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Attempt {reconnectAttempts}/{maxReconnectAttempts}
          </div>
        )}
      </div>
    </div>
  )
}

export default ConnectionStatus