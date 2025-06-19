import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { X, Play, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { backendService } from '../../services/backendService'
import { RootState } from '../../store/store'
import toast from 'react-hot-toast'

interface RestartPointSelectorProps {
  isOpen: boolean
  onClose: () => void
  sessionFilename: string
}

// These match your EXACT restart points from index.ts
interface RestartPoint {
  id: number
  name: string
  description: string
  available: boolean
}

const RESTART_POINTS: RestartPoint[] = [
  {
    id: 1,
    name: 'After Token Discovery',
    description: 'Restart from token validation and pool discovery',
    available: true
  },
  {
    id: 2,
    name: 'After Admin Wallet Creation',
    description: 'Restart from admin wallet setup and funding',
    available: true
  },
  {
    id: 3,
    name: 'After Wallet Generation',
    description: 'Restart from trading wallet creation',
    available: true
  },
  {
    id: 4,
    name: 'After Wallet Funding',
    description: 'Restart from SOL distribution to wallets',
    available: true
  },
  {
    id: 5,
    name: 'Token Transfer to Wallets',
    description: 'Restart from token distribution phase',
    available: true
  },
  {
    id: 6,
    name: 'Close Token Account & Send Balance to Admin',
    description: 'Clean up and consolidate all balances',
    available: true
  }
]

const RestartPointSelector: React.FC<RestartPointSelectorProps> = ({
  isOpen,
  onClose,
  sessionFilename
}) => {
  const dispatch = useDispatch()
  const { currentSession } = useSelector((state: RootState) => state.session)
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleRestart = async () => {
    if (!selectedPoint || !currentSession) {
      toast.error('Please select a restart point')
      return
    }

    setIsLoading(true)
    
    try {
      // Call your backend restart function with the selected point
      // This maps to your exact restart logic in index.ts
      await backendService.restartFromPoint(selectedPoint, currentSession)
      
      const pointName = RESTART_POINTS.find(p => p.id === selectedPoint)?.name
      toast.success(`Restarting from: ${pointName}`)
      onClose()
    } catch (error) {
      toast.error(`Failed to restart session: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Select Restart Point
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Choose where to restart the session: {sessionFilename}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {currentSession && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                Current Session Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 dark:text-blue-400">Token:</span>
                  <span className="ml-2 text-blue-800 dark:text-blue-300">{currentSession.tokenName}</span>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-400">Wallets:</span>
                  <span className="ml-2 text-blue-800 dark:text-blue-300">{currentSession.wallets.length}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-blue-600 dark:text-blue-400">Admin:</span>
                  <span className="ml-2 text-blue-800 dark:text-blue-300 font-mono text-xs">
                    {currentSession.admin.address.slice(0, 8)}...{currentSession.admin.address.slice(-8)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {RESTART_POINTS.map((point) => (
              <div
                key={point.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedPoint === point.id
                    ? 'border-solana-500 bg-solana-50 dark:bg-solana-900/20'
                    : point.available
                    ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 opacity-50 cursor-not-allowed'
                }`}
                onClick={() => point.available && setSelectedPoint(point.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    selectedPoint === point.id
                      ? 'bg-solana-500 text-white'
                      : point.available
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}>
                    {point.id}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-medium ${
                        point.available
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {point.name}
                      </h3>
                      {point.available ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${
                      point.available
                        ? 'text-gray-600 dark:text-gray-400'
                        : 'text-gray-500 dark:text-gray-500'
                    }`}>
                      {point.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedPoint && (
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-300">
                    Important Notice
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    Restarting from this point will execute the corresponding backend function from your index.ts file. 
                    Make sure you have the necessary funds and configurations in place.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleRestart}
            disabled={!selectedPoint || isLoading}
            className="flex items-center px-6 py-2 bg-solana-600 hover:bg-solana-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Restarting...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Restart Session
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RestartPointSelector