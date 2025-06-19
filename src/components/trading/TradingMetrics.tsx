import React from 'react'
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Clock, 
  Target,
  CheckCircle,
  Timer
} from 'lucide-react'

interface TradingMetricsProps {
  activeWallets: number
  totalWallets: number
  successRate: number
  totalTransactions: number
  currentLap: any
  elapsedTime: number
  timeLeft: number
}

const TradingMetrics: React.FC<TradingMetricsProps> = ({
  activeWallets,
  totalWallets,
  successRate,
  totalTransactions,
  currentLap,
  elapsedTime,
  timeLeft
}) => {
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const metrics = [
    {
      name: 'Active Wallets',
      value: `${activeWallets}/${totalWallets}`,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      change: activeWallets > 0 ? '+' + activeWallets : '0'
    },
    {
      name: 'Success Rate',
      value: `${successRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      change: successRate > 90 ? 'Excellent' : successRate > 70 ? 'Good' : 'Fair'
    },
    {
      name: 'Total Transactions',
      value: totalTransactions.toString(),
      icon: Activity,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      change: totalTransactions > 0 ? `+${totalTransactions}` : '0'
    },
    {
      name: 'Current Lap',
      value: currentLap ? `#${currentLap.lapNumber}` : 'None',
      icon: Target,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      change: currentLap ? 'Active' : 'Idle'
    },
    {
      name: 'Elapsed Time',
      value: formatTime(elapsedTime),
      icon: Clock,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      change: elapsedTime > 0 ? 'Running' : 'Stopped'
    },
    {
      name: 'Time Left',
      value: formatTime(timeLeft),
      icon: Timer,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      change: timeLeft > 0 ? 'Remaining' : 'Complete'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <div
            key={metric.name}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <Icon className={`w-4 h-4 ${metric.color}`} />
              </div>
              <span className={`text-xs font-medium ${metric.color}`}>
                {metric.change}
              </span>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {metric.name}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {metric.value}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TradingMetrics