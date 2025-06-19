import React, { useState } from 'react'
import { 
  Eye, 
  Download, 
  Copy, 
  Wallet, 
  User, 
  Calendar, 
  Coins, 
  ChevronDown, 
  ChevronRight,
  ExternalLink,
  Shield,
  Key,
  Hash
} from 'lucide-react'
import { SessionData } from '../../store/slices/sessionSlice'
import { backendService } from '../../services/backendService'
import toast from 'react-hot-toast'

interface SessionViewerProps {
  sessionData: SessionData
  onClose: () => void
}

const SessionViewer: React.FC<SessionViewerProps> = ({ sessionData, onClose }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    admin: false,
    wallets: false,
    token: false
  })
  const [showPrivateKeys, setShowPrivateKeys] = useState(false)

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleDownloadSession = async () => {
    try {
      // Create a sanitized version without pool keys for download
      const sanitizedSession = {
        ...sessionData,
        poolKeys: '[HIDDEN FOR SECURITY]'
      }
      
      const blob = new Blob([JSON.stringify(sanitizedSession, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${sessionData.tokenName}_${sessionData.timestamp}_session.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Session file downloaded')
    } catch (error) {
      toast.error('Failed to download session')
    }
  }

  const handleDownloadEnv = async () => {
    try {
      const envContent = await backendService.generateEnvFile(sessionData)
      const blob = new Blob([envContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${sessionData.tokenName}_${sessionData.timestamp}.env`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Environment file downloaded')
    } catch (error) {
      toast.error('Failed to generate environment file')
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      // Handle different timestamp formats
      const date = new Date(timestamp.replace(/(\d{2})\.(\d{2})\.(\d{4})_(\d{2})\.(\d{2})\.(\d{2})(am|pm)/, 
        (match, month, day, year, hour, minute, second, ampm) => {
          let hour24 = parseInt(hour)
          if (ampm === 'pm' && hour24 !== 12) hour24 += 12
          if (ampm === 'am' && hour24 === 12) hour24 = 0
          return `${year}-${month}-${day}T${hour24.toString().padStart(2, '0')}:${minute}:${second}`
        }))
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date)
    } catch {
      return timestamp
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-solana-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">{sessionData.tokenName} Session</h2>
                <p className="text-purple-100">{formatTimestamp(sessionData.timestamp)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadSession}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>JSON</span>
              </button>
              <button
                onClick={handleDownloadEnv}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>.env</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Overview Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('overview')}
              className="flex items-center space-x-2 w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              {expandedSections.overview ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              <Coins className="w-5 h-5 text-solana-600" />
              <span className="font-semibold text-gray-900 dark:text-white">Session Overview</span>
            </button>
            
            {expandedSections.overview && (
              <div className="mt-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Token Name
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 dark:text-white font-mono">{sessionData.tokenName}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Token Address
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 dark:text-white font-mono text-sm">
                        {formatAddress(sessionData.tokenAddress)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(sessionData.tokenAddress, 'Token address')}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={`https://solscan.io/token/${sessionData.tokenAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-400 hover:text-solana-600"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Total Wallets
                    </label>
                    <span className="text-gray-900 dark:text-white font-mono">
                      {sessionData.wallets.length + 1} (1 admin + {sessionData.wallets.length} trading)
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Created
                    </label>
                    <span className="text-gray-900 dark:text-white">
                      {formatTimestamp(sessionData.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Admin Wallet Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('admin')}
              className="flex items-center space-x-2 w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              {expandedSections.admin ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              <User className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900 dark:text-white">Admin Wallet</span>
            </button>
            
            {expandedSections.admin && (
              <div className="mt-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Public Key
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 dark:text-white font-mono text-sm">
                        {sessionData.admin.address}
                      </span>
                      <button
                        onClick={() => copyToClipboard(sessionData.admin.address, 'Admin public key')}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={`https://solscan.io/account/${sessionData.admin.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-400 hover:text-solana-600"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                  
                  {showPrivateKeys && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Private Key
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-900 dark:text-white font-mono text-sm break-all">
                          {sessionData.admin.privateKey}
                        </span>
                        <button
                          onClick={() => copyToClipboard(sessionData.admin.privateKey, 'Admin private key')}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Trading Wallets Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('wallets')}
              className="flex items-center space-x-2 w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              {expandedSections.wallets ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              <Wallet className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900 dark:text-white">
                Trading Wallets ({sessionData.wallets.length})
              </span>
            </button>
            
            {expandedSections.wallets && (
              <div className="mt-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {sessionData.wallets.map((wallet, index) => (
                    <div key={wallet.number} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          Wallet #{wallet.number}
                        </span>
                        {wallet.generationTimestamp && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(wallet.generationTimestamp).toLocaleString()}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Public Key
                          </label>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-900 dark:text-white font-mono text-xs">
                              {formatAddress(wallet.address)}
                            </span>
                            <button
                              onClick={() => copyToClipboard(wallet.address, `Wallet #${wallet.number} public key`)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <a
                              href={`https://solscan.io/account/${wallet.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-gray-400 hover:text-solana-600"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                        
                        {showPrivateKeys && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Private Key
                            </label>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-900 dark:text-white font-mono text-xs break-all">
                                {wallet.privateKey}
                              </span>
                              <button
                                onClick={() => copyToClipboard(wallet.privateKey, `Wallet #${wallet.number} private key`)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Security Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('token')}
              className="flex items-center space-x-2 w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              {expandedSections.token ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              <Shield className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-gray-900 dark:text-white">Security & Pool Data</span>
            </button>
            
            {expandedSections.token && (
              <div className="mt-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="space-y-4">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800 dark:text-yellow-200">
                        Pool Keys Hidden
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Pool keys are hidden in this view for security reasons. They are included in the actual session file and .env downloads.
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Key className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-white">Show Private Keys</span>
                    </div>
                    <button
                      onClick={() => setShowPrivateKeys(!showPrivateKeys)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showPrivateKeys ? 'bg-solana-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showPrivateKeys ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SessionViewer