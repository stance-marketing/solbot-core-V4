import React, { useState } from 'react'
import { 
  Shield, 
  Key, 
  Eye, 
  EyeOff, 
  Download, 
  AlertTriangle, 
  Lock, 
  Unlock,
  Copy,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { WalletData } from '../../store/slices/walletSlice'
import toast from 'react-hot-toast'

interface WalletSecurityPanelProps {
  adminWallet: WalletData | null
  tradingWallets: WalletData[]
  showPrivateKeys: boolean
  onTogglePrivateKeys: () => void
}

const WalletSecurityPanel: React.FC<WalletSecurityPanelProps> = ({
  adminWallet,
  tradingWallets,
  showPrivateKeys,
  onTogglePrivateKeys
}) => {
  const [selectedWallets, setSelectedWallets] = useState<Set<string>>(new Set())
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'txt'>('json')

  const allWallets = adminWallet ? [adminWallet, ...tradingWallets] : tradingWallets

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const exportSelectedWallets = () => {
    const walletsToExport = allWallets.filter(wallet => 
      selectedWallets.has(wallet.publicKey)
    )

    if (walletsToExport.length === 0) {
      toast.error('Please select wallets to export')
      return
    }

    let content = ''
    let filename = ''
    let mimeType = ''

    switch (exportFormat) {
      case 'json':
        content = JSON.stringify(walletsToExport.map(wallet => ({
          number: wallet.number,
          publicKey: wallet.publicKey,
          privateKey: wallet.privateKey,
          isAdmin: wallet.number === 0
        })), null, 2)
        filename = `wallet_keys_${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/json'
        break

      case 'csv':
        content = 'Number,Type,PublicKey,PrivateKey\n' + 
          walletsToExport.map(wallet => 
            `${wallet.number},${wallet.number === 0 ? 'Admin' : 'Trading'},"${wallet.publicKey}","${wallet.privateKey}"`
          ).join('\n')
        filename = `wallet_keys_${new Date().toISOString().split('T')[0]}.csv`
        mimeType = 'text/csv'
        break

      case 'txt':
        content = walletsToExport.map(wallet => 
          `${wallet.number === 0 ? 'Admin' : 'Trading'} Wallet #${wallet.number}\n` +
          `Public Key: ${wallet.publicKey}\n` +
          `Private Key: ${wallet.privateKey}\n\n`
        ).join('')
        filename = `wallet_keys_${new Date().toISOString().split('T')[0]}.txt`
        mimeType = 'text/plain'
        break
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success(`Exported ${walletsToExport.length} wallet keys`)
  }

  const toggleWalletSelection = (publicKey: string) => {
    const newSelection = new Set(selectedWallets)
    if (newSelection.has(publicKey)) {
      newSelection.delete(publicKey)
    } else {
      newSelection.add(publicKey)
    }
    setSelectedWallets(newSelection)
  }

  const selectAllWallets = () => {
    setSelectedWallets(new Set(allWallets.map(w => w.publicKey)))
  }

  const clearSelection = () => {
    setSelectedWallets(new Set())
  }

  const securityChecks = [
    {
      name: 'Private Key Visibility',
      status: !showPrivateKeys,
      description: showPrivateKeys 
        ? 'Private keys are currently visible' 
        : 'Private keys are hidden for security',
      action: onTogglePrivateKeys,
      actionText: showPrivateKeys ? 'Hide Keys' : 'Show Keys',
      icon: showPrivateKeys ? Unlock : Lock
    },
    {
      name: 'Admin Wallet Security',
      status: !!adminWallet,
      description: adminWallet 
        ? 'Admin wallet is configured' 
        : 'No admin wallet configured',
      icon: Shield
    },
    {
      name: 'Trading Wallets',
      status: tradingWallets.length > 0,
      description: `${tradingWallets.length} trading wallets configured`,
      icon: Key
    }
  ]

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {securityChecks.map((check) => {
          const Icon = check.icon
          return (
            <div
              key={check.name}
              className={`p-4 rounded-lg border ${
                check.status
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Icon className={`w-5 h-5 ${
                  check.status 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`} />
                <span className={`font-medium ${
                  check.status 
                    ? 'text-green-800 dark:text-green-300' 
                    : 'text-red-800 dark:text-red-300'
                }`}>
                  {check.name}
                </span>
              </div>
              <p className={`text-sm ${
                check.status 
                  ? 'text-green-700 dark:text-green-400' 
                  : 'text-red-700 dark:text-red-400'
              }`}>
                {check.description}
              </p>
              {check.action && (
                <button
                  onClick={check.action}
                  className={`mt-2 text-sm font-medium ${
                    check.status 
                      ? 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200' 
                      : 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200'
                  }`}
                >
                  {check.actionText}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Security Warnings */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-300 mb-2">
              Critical Security Guidelines
            </h3>
            <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
              <li>• Never share your private keys with anyone</li>
              <li>• Store private keys securely offline when not in use</li>
              <li>• Use secure connections when accessing wallet management</li>
              <li>• Regularly backup your wallet data</li>
              <li>• Monitor wallet balances for unauthorized transactions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Private Key Management */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Private Key Management
          </h3>
          <button
            onClick={onTogglePrivateKeys}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              showPrivateKeys
                ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/30'
                : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/30'
            }`}
          >
            {showPrivateKeys ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Private Keys
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show Private Keys
              </>
            )}
          </button>
        </div>

        {/* Wallet Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Select Wallets for Export ({selectedWallets.size} selected)
            </h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={selectAllWallets}
                className="text-sm text-solana-600 dark:text-solana-400 hover:text-solana-700 dark:hover:text-solana-300"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
            {allWallets.map((wallet) => (
              <div
                key={wallet.publicKey}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedWallets.has(wallet.publicKey)
                    ? 'border-solana-500 bg-solana-50 dark:bg-solana-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => toggleWalletSelection(wallet.publicKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedWallets.has(wallet.publicKey)
                        ? 'border-solana-500 bg-solana-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedWallets.has(wallet.publicKey) && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {wallet.number === 0 ? 'Admin Wallet' : `Trading Wallet #${wallet.number}`}
                      </span>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-8)}
                      </p>
                    </div>
                  </div>
                  
                  {showPrivateKeys && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(wallet.privateKey, 'Private key')
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'json', label: 'JSON', description: 'Structured data format' },
                { value: 'csv', label: 'CSV', description: 'Spreadsheet compatible' },
                { value: 'txt', label: 'Text', description: 'Plain text format' }
              ].map((format) => (
                <button
                  key={format.value}
                  onClick={() => setExportFormat(format.value as any)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    exportFormat === format.value
                      ? 'border-solana-500 bg-solana-50 dark:bg-solana-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {format.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {format.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={exportSelectedWallets}
            disabled={selectedWallets.size === 0}
            className="w-full flex items-center justify-center px-6 py-3 bg-solana-600 hover:bg-solana-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Export Selected Wallets ({selectedWallets.size})
          </button>
        </div>
      </div>
    </div>
  )
}

export default WalletSecurityPanel