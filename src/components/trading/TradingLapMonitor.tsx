import React from 'react'
import { 
  Clock, 
  Target, 
  TrendingUp, 
  Activity, 
  CheckCircle, 
  AlertCircle,
  Play,
  Pause
} from 'lucide-react'

interface TradingLapMonitorProps {
  currentLap: any
  laps: any[]
  elapsedTime: number
  timeLeft: number
  duration: number
  status: string
}

const TradingLapMonitor: React.FC<TradingLapMonitorProps> = ({
  currentLap,
  laps,
  elapsedTime,
  timeLeft,
  duration,
  status
}) => {
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    if (duration === 0) return 0
    return Math.min((elapsedTime / duration) * 100, 100)
  }

  const getStatusIcon = (lapStatus: string) => {
    switch (lapStatus) {
      case 'running':
        return <Play className="w-4 h-4 text-blue-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Pause className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Trading Lap Monitor
          </h3>
        </div>
        
        {currentLap && (
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Activity className="w-4 h-4" />
            <span>Lap #{currentLap.lapNumber}</span>
          </div>
        )}
      </div>

      {/* Current Lap Progress */}
      {currentLap ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                status === 'running' ? 'bg-green-500 animate-pulse' :
                status === 'paused' ? 'bg-yellow-500' :
                'bg-gray-400'
              }`} />
              <span className="font-medium text-gray-900 dark:text-white">
                Current Lap #{currentLap.lapNumber}
              </span>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {formatTime(elapsedTime)} / {formatTime(duration)}
              </div>
              <div className="text-xs text-gray-400">
                {formatTime(timeLeft)} remaining
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${
                status === 'running' ? 'bg-green-500' :
                status === 'paused' ? 'bg-yellow-500' :
                'bg-gray-400'
              }`}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>

          {/* Lap Stats */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {currentLap.totalSolCollected.toFixed(6)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                SOL Collected
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {currentLap.totalTokensCollected.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Tokens Collected
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Active Lap
          </h4>
          <p className="text-gray-600 dark:text-gray-400">
            Start trading to begin monitoring lap progress
          </p>
        </div>
      )}

      {/* Recent Laps */}
      {laps.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Recent Laps
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {laps.slice(-5).reverse().map((lap) => (
              <div
                key={lap.lapNumber}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(lap.status)}
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Lap #{lap.lapNumber}
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {lap.totalSolCollected.toFixed(4)} SOL
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {lap.endTime ? new Date(lap.endTime).toLocaleTimeString() : 'Running...'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TradingLapMonitor