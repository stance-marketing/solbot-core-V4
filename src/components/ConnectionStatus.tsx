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
          color: 'text-secondary',
          bgColor: 'bg-secondary/10',
          borderColor: 'border-secondary/20',
        }
      case 'connecting':
        return {
          icon: Loader2,
          text: 'Connecting...',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
        }
      case 'disconnected':
        return {
          icon: WifiOff,
          text: 'Disconnected',
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
        }
      case 'error':
        return {
          icon: WifiOff,
          text: 'Connection Error',
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
        }
      default:
        return {
          icon: WifiOff,
          text: 'Unknown',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          borderColor: 'border-border',
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
          <div className="text-xs text-muted-foreground">
            Attempt {reconnectAttempts}/{maxReconnectAttempts}
          </div>
        )}
      </div>
    </div>
  )
}

export default ConnectionStatus