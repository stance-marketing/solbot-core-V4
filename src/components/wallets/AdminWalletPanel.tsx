import React, { useState } from 'react'
import { Shield, Plus, Upload, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { backendService } from '../../services/backendService'
import { WalletData } from '../../store/slices/walletSlice'
import WalletCard from './WalletCard'
import toast from 'react-hot-toast'

interface AdminWalletPanelProps {
  adminWallet: WalletData | null
  showPrivateKey: boolean
  onWalletCreated: (wallet: WalletData) => void
  onCopy: (text: string, label: string) => void
}

const AdminWalletPanel: React.FC<AdminWalletPanelProps> = ({
  adminWallet,
  showPrivateKey,
  onWalletCreated,
  onCopy
}) => {
  const [isCreating, setIsCreating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importPrivateKey, setImportPrivateKey] = useState('')
  const [showImportKey, setShowImportKey] = useState(false)
  const [mode, setMode] = useState<'create' | 'import' | null>(null)

  const createAdminWallet = async () => {
    setIsCreating(true)
    try {
      const wallet = await backendService.createAdminWallet()
      onWalletCreated(wallet)
      toast.success('Admin wallet created successfully!')
      setMode(null)
    } catch (error) {
      toast.error(`Failed to create admin wallet: ${error.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  const importAdminWallet = async () => {
    if (!importPrivateKey.trim()) {
      toast.error('Please enter a private key')
      return
    }

    setIsImporting(true)
    try {
      const wallet = await backendService.importAdminWallet(importPrivateKey)
      onWalletCreated(wallet)
      toast.success('Admin wallet imported successfully!')
      setImportPrivateKey('')
      setMode(null)
    } catch (error) {
      toast.error(`Failed to import admin wallet: ${error.message}`)
    } finally {
      setIsImporting(false)
    }
  }

  if (adminWallet) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Admin Wallet Active
          </h3>
        </div>

        <WalletCard
          wallet={adminWallet}
          isAdmin={true}
          showPrivateKey={showPrivateKey}
          onCopy={onCopy}
        />

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-300">
                Admin Wallet Security
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                This wallet controls your trading session and holds your funds. Keep the private key secure and never share it.
                Make sure to fund this wallet with SOL before starting trading operations.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Set Up Admin Wallet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Create a new admin wallet or import an existing one to control your trading session
        </p>
      </div>

      {!mode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setMode('create')}
            className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-left hover:border-solana-500 hover:bg-solana-50 dark:hover:bg-solana-900/20 transition-colors"
          >
            <Plus className="w-8 h-8 text-solana-600 dark:text-solana-400 mb-3" />
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Create New Wallet
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate a fresh admin wallet with a new private key
            </p>
          </button>

          <button
            onClick={() => setMode('import')}
            className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-left hover:border-solana-500 hover:bg-solana-50 dark:hover:bg-solana-900/20 transition-colors"
          >
            <Upload className="w-8 h-8 text-solana-600 dark:text-solana-400 mb-3" />
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Import Existing Wallet
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Use an existing wallet by importing its private key
            </p>
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">
            Create New Admin Wallet
          </h4>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-medium text-yellow-800 dark:text-yellow-300">
                  Important Security Notice
                </h5>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  A new wallet will be generated with a unique private key. Make sure to save this private key securely 
                  as it cannot be recovered if lost. You'll need to fund this wallet with SOL before trading.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={createAdminWallet}
              disabled={isCreating}
              className="flex items-center px-6 py-2 bg-solana-600 hover:bg-solana-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {isCreating ? 'Creating...' : 'Create Admin Wallet'}
            </button>

            <button
              onClick={() => setMode(null)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === 'import' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">
            Import Existing Admin Wallet
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Private Key
              </label>
              <div className="relative">
                <input
                  type={showImportKey ? "text" : "password"}
                  value={importPrivateKey}
                  onChange={(e) => setImportPrivateKey(e.target.value)}
                  placeholder="Enter your wallet private key..."
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-solana-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowImportKey(!showImportKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showImportKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-medium text-red-800 dark:text-red-300">
                    Security Warning
                  </h5>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    Only import private keys from wallets you own and trust. Never share your private key with anyone.
                    Make sure this connection is secure before entering sensitive information.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={importAdminWallet}
                disabled={isImporting || !importPrivateKey.trim()}
                className="flex items-center px-6 py-2 bg-solana-600 hover:bg-solana-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isImporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {isImporting ? 'Importing...' : 'Import Wallet'}
              </button>

              <button
                onClick={() => {
                  setMode(null)
                  setImportPrivateKey('')
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminWalletPanel