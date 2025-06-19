import React, { useState } from 'react'
import { Users, Plus, Loader2, Search, Filter, Download } from 'lucide-react'
import { backendService } from '../../services/backendService'
import { WalletData } from '../../store/slices/walletSlice'
import WalletCard from './WalletCard'
import toast from 'react-hot-toast'

interface TradingWalletPanelProps {
  tradingWallets: WalletData[]
  showPrivateKeys: boolean
  onWalletsGenerated: (wallets: WalletData[]) => void
  onCopy: (text: string, label: string) => void
  tokenSymbol?: string
}

const TradingWalletPanel: React.FC<TradingWalletPanelProps> = ({
  tradingWallets,
  showPrivateKeys,
  onWalletsGenerated,
  onCopy,
  tokenSymbol = 'Tokens'
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [walletCount, setWalletCount] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  const generateWallets = async () => {
    if (walletCount < 1 || walletCount > 100) {
      toast.error('Wallet count must be between 1 and 100')
      return
    }

    setIsGenerating(true)
    try {
      const wallets = await backendService.generateTradingWallets(walletCount)
      onWalletsGenerated([...tradingWallets, ...wallets])
      toast.success(`Generated ${wallets.length} trading wallets`)
    } catch (error) {
      toast.error(`Failed to generate wallets: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const exportWallets = () => {
    try {
      const walletData = tradingWallets.map(wallet => ({
        number: wallet.number,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
        solBalance: wallet.solBalance,
        tokenBalance: wallet.tokenBalance,
        isActive: wallet.isActive,
        generationTimestamp: wallet.generationTimestamp
      }))

      const blob = new Blob([JSON.stringify(walletData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trading_wallets_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Trading wallets exported successfully')
    } catch (error) {
      toast.error('Failed to export wallets')
    }
  }

  // Filter wallets based on search and status
  const filteredWallets = tradingWallets.filter(wallet => {
    const matchesSearch = wallet.publicKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wallet.number.toString().includes(searchTerm)
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && wallet.isActive) ||
                         (filterStatus === 'inactive' && !wallet.isActive)
    
    return matchesSearch && matchesStatus
  })

  const activeWallets = tradingWallets.filter(w => w.isActive).length
  const totalSolBalance = tradingWallets.reduce((sum, w) => sum + w.solBalance, 0)
  const totalTokenBalance = tradingWallets.reduce((sum, w) => sum + w.tokenBalance, 0)

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Wallets</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
            {tradingWallets.length}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Active Wallets</span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
            {activeWallets}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Total SOL</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
            {totalSolBalance.toFixed(6)}
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Total {tokenSymbol}</span>
          </div>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">
            {totalTokenBalance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search wallets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-solana-500 focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-solana-500 focus:border-transparent"
            >
              <option value="all">All Wallets</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {tradingWallets.length > 0 && (
            <button
              onClick={exportWallets}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Generate Wallets Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Generate Trading Wallets
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Number of Wallets (1-100)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={walletCount}
              onChange={(e) => setWalletCount(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-solana-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={generateWallets}
            disabled={isGenerating}
            className="flex items-center px-6 py-2 bg-solana-600 hover:bg-solana-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Wallets'}
          </button>
        </div>
      </div>

      {/* Wallets Grid */}
      {filteredWallets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWallets.map((wallet) => (
            <WalletCard
              key={wallet.publicKey}
              wallet={wallet}
              isAdmin={false}
              showPrivateKey={showPrivateKeys}
              onCopy={onCopy}
              tokenSymbol={tokenSymbol}
            />
          ))}
        </div>
      ) : tradingWallets.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Trading Wallets
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Generate trading wallets to start automated trading operations
          </p>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No wallets match your search criteria
          </p>
        </div>
      )}
    </div>
  )
}

export default TradingWalletPanel