import React from 'react'
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  Users, 
  Target,
  CheckCircle,
  AlertCircle,
  Pause,
  Play
} from 'lucide-react'

interface TradingStatusGridProps {
  status: string
  activeWallets: number
  totalWallets: number
  currentLap: any
  elapsedTime: number
  successRate: number
}

const TradingStatusGrid: React.FC<TradingStatusGridProps> = ({
  status,
  activeWallets,
  totalWallets,
  currentLap,
  elapsedTime,
  successRate
}) => {
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'running':
        return {
          icon: Play,
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800'
        }
      case 'paused':
        return {
          icon: Pause,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800'
        }
      case 'stopped':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800'
        }
      default:
        return {
          icon: Activity,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-700'
        }
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

  const statusCards = [
    {
      title: 'Trading Status',
      value: status.charAt(0).toUpperCase() + status.slice(1),
      icon: StatusIcon,
      color: statusConfig.color,
      bgColor: statusConfig.bgColor,
      borderColor: statusConfig.borderColor
    },
    {
      title: 'Active Wallets',
      value: `${activeWallets}/${totalWallets}`,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      title: 'Current Lap',
      value: currentLap ? `#${currentLap.lapNumber}` : 'None',
      icon: Target,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800'
    },
    {
      title: 'Elapsed Time',
      value: formatTime(elapsedTime),
      icon: Clock,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      borderColor: 'border-indigo-200 dark:border-indigo-800'
    },
    {
      title: 'Success Rate',
      value: `${successRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    {
      title: 'Performance',
      value: successRate > 90 ? 'Excellent' : successRate > 70 ? 'Good' : 'Fair',
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statusCards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.title}
            className={`p-4 border rounded-lg ${card.bgColor} ${card.borderColor} hover:shadow-md transition-shadow duration-200`}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-5 h-5 ${card.color}`} />
              {card.title === 'Trading Status' && status === 'running' && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {card.value}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TradingStatusGrid