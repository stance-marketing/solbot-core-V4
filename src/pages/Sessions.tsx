import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Plus, FolderOpen, RotateCcw, Eye } from 'lucide-react'
import { RootState } from '../store/store'
import SessionBrowser from '../components/sessions/SessionBrowser'
import RestartPointSelector from '../components/sessions/RestartPointSelector'
import MainSessionFlow from '../components/sessions/MainSessionFlow'
import SessionViewer from '../components/sessions/SessionViewer'

const Sessions: React.FC = () => {
  const { currentSession } = useSelector((state: RootState) => state.session)
  const [showMainFlow, setShowMainFlow] = useState(false)
  const [showRestartSelector, setShowRestartSelector] = useState(false)
  const [showSessionViewer, setShowSessionViewer] = useState(false)
  const [selectedSessionFile, setSelectedSessionFile] = useState<string | null>(null)

  const handleSelectSession = (filename: string) => {
    setSelectedSessionFile(filename)
  }

  const handleRestartSession = () => {
    if (currentSession) {
      setShowRestartSelector(true)
    }
  }

  const handleStartNewSession = () => {
    console.log('Starting new session flow...') // Debug log
    setShowMainFlow(true)
  }

  const handleCloseMainFlow = () => {
    console.log('Closing main flow...') // Debug log
    setShowMainFlow(false)
  }

  const handleViewSession = () => {
    setShowSessionViewer(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Session Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create, load, and manage your trading sessions
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {currentSession && (
            <>
              <button
                onClick={handleViewSession}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Session
              </button>
              <button
                onClick={handleRestartSession}
                className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart Session
              </button>
            </>
          )}
          
          <button
            onClick={handleStartNewSession}
            className="flex items-center px-4 py-2 bg-solana-600 hover:bg-solana-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </button>
        </div>
      </div>

      {/* Current Session Info */}
      {currentSession && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Active Session
            </h2>
            <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Loaded</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Token
              </h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentSession.tokenName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {currentSession.tokenAddress.slice(0, 8)}...{currentSession.tokenAddress.slice(-8)}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Admin Wallet
              </h3>
              <p className="text-sm text-gray-900 dark:text-white font-mono">
                {currentSession.admin.address.slice(0, 8)}...{currentSession.admin.address.slice(-8)}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Trading Wallets
              </h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentSession.wallets.length}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Created
              </h3>
              <p className="text-sm text-gray-900 dark:text-white">
                {currentSession.timestamp}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Session Browser */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <SessionBrowser onSelectSession={handleSelectSession} />
      </div>

      {/* Main Session Flow Modal */}
      <MainSessionFlow
        isOpen={showMainFlow}
        onClose={handleCloseMainFlow}
      />

      {/* Restart Point Selector Modal */}
      {currentSession && (
        <RestartPointSelector
          isOpen={showRestartSelector}
          onClose={() => setShowRestartSelector(false)}
          sessionFilename={selectedSessionFile || `${currentSession.tokenName}_${currentSession.timestamp}_session.json`}
        />
      )}

      {/* Session Viewer Modal */}
      {currentSession && showSessionViewer && (
        <SessionViewer
          sessionData={currentSession}
          onClose={() => setShowSessionViewer(false)}
        />
      )}
    </div>
  )
}

export default Sessions