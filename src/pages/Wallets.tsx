import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
  Wallet, 
  Plus, 
  Download, 
  Upload, 
  Eye, 
  EyeOff, 
  Copy, 
  RefreshCw,
  DollarSign,
  Users,
  Activity,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowRight,
  ArrowDown,
  Settings,
  Shield,
  Key
} from 'lucide-react'
import { RootState } from '../store/store'
import { backendService } from '../services/backendService'
import { setAdminWallet, setTradingWallets, updateWalletBalance, calculateTotals } from '../store/slices/walletSlice'
import { WalletData } from '../store/slices/walletSlice'
import WalletCard from '../components/wallets/WalletCard'
import AdminWalletPanel from '../components/wallets/AdminWalletPanel'
import TradingWalletPanel from '../components/wallets/TradingWalletPanel'
import SOLDistributionPanel from '../components/wallets/SOLDistributionPanel'
import TokenDistributionPanel from '../components/wallets/TokenDistributionPanel'
import WalletSecurityPanel from '../components/wallets/WalletSecurityPanel'
import toast from 'react-hot-toast'

const Wallets: React.FC = () => {
  const dispatch = useDispatch()
  const { adminWallet, tradingWallets, totalSolBalance, totalTokenBalance, isLoading } = useSelector((state: RootState) => state.wallet)
  const { currentSession } = useSelector((state: RootState) => state.session)
  
  const [activeTab, setActiveTab] = useState<'overview' | 'admin' | 'trading' | 'distribution' | 'security'>('overview')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showPrivateKeys, setShowPrivateKeys] = useState(false)

  // Calculate statistics
  const activeWallets = tradingWallets.filter(w => w.isActive).length
  const totalWallets = tradingWallets.length + (adminWallet ? 1 : 0)
  const averageBalance = totalWallets > 0 ? totalSolBalance / totalWallets : 0

  useEffect(() => {
    dispatch(calculateTotals())
  }, [adminWallet, tradingWallets, dispatch])

  const refreshAllBalances = async () => {
    if (!adminWallet && tradingWallets.length === 0) {
      toast.error('No wallets to refresh')
      return
    }

    setIsRefreshing(true)
    try {
      const allWallets = []
      if (adminWallet) allWallets.push(adminWallet)
      allWallets.push(...tradingWallets)

      const updatedWallets = await backendService.getWalletBalances(allWallets)
      
      // Update admin wallet
      const updatedAdmin = updatedWallets.find(w => w.number === 0)
      if (updatedAdmin) {
        dispatch(setAdminWallet(updatedAdmin))
      }

      // Update trading wallets
      const updatedTrading = updatedWallets.filter(w => w.number > 0)
      if (updatedTrading.length > 0) {
        dispatch(setTradingWallets(updatedTrading))
      }

      toast.success('Wallet balances refreshed')
    } catch (error) {
      toast.error(`Failed to refresh balances: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsRefreshing(false)
    }
  }

  const exportWalletData = () => {
    try {
      const walletData = {
        admin: adminWallet,
        trading: tradingWallets,
        session: currentSession?.tokenName || 'Unknown',
        exportedAt: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(walletData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wallets_${currentSession?.tokenName || 'export'}_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Wallet data exported successfully')
    } catch (error) {
      toast.error('Failed to export wallet data')
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'admin', name: 'Admin Wallet', icon: Shield },
    { id: 'trading', name: 'Trading Wallets', icon: Users },
    { id: 'distribution', name: 'Distribution', icon: ArrowDown },
    { id: 'security', name: 'Security', icon: Key }
  ]

  const stats = [
    {
      name: 'Total SOL Balance',
      value: totalSolBalance.toFixed(6),
      unit: 'SOL',
      icon: DollarSign,
      color: 'text-solana-600 dark:text-solana-400',
      bgColor: 'bg-solana-50 dark:bg-solana-900/20',
    },
    {
      name: 'Total Token Balance',
      value: totalTokenBalance.toFixed(2),
      unit: currentSession?.tokenName || 'Tokens',
      icon: Wallet,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      name: 'Active Wallets',
      value: activeWallets.toString(),
      unit: `of ${totalWallets}`,
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      name: 'Average Balance',
      value: averageBalance.toFixed(6),
      unit: 'SOL',
      icon: Activity,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Wallet Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your admin and trading wallets
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPrivateKeys(!showPrivateKeys)}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              showPrivateKeys
                ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {showPrivateKeys ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showPrivateKeys ? 'Hide Keys' : 'Show Keys'}
          </button>
          
          <button
            onClick={refreshAllBalances}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={exportWalletData}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stat.unit}
                    </p>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-solana-500 text-solana-600 dark:text-solana-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Admin Wallet Overview */}
              {adminWallet ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Admin Wallet
                  </h3>
                  <WalletCard
                    wallet={adminWallet}
                    isAdmin={true}
                    showPrivateKey={showPrivateKeys}
                    onCopy={copyToClipboard}
                    tokenSymbol={currentSession?.tokenName}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Admin Wallet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Create or import an admin wallet to get started
                  </p>
                  <button
                    onClick={() => setActiveTab('admin')}
                    className="inline-flex items-center px-4 py-2 bg-solana-600 hover:bg-solana-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Set Up Admin Wallet
                  </button>
                </div>
              )}

              {/* Trading Wallets Overview */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Trading Wallets ({tradingWallets.length})
                  </h3>
                  {tradingWallets.length > 0 && (
                    <button
                      onClick={() => setActiveTab('trading')}
                      className="text-solana-600 dark:text-solana-400 hover:text-solana-700 dark:hover:text-solana-300 text-sm font-medium"
                    >
                      View All <ArrowRight className="w-4 h-4 inline ml-1" />
                    </button>
                  )}
                </div>

                {tradingWallets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tradingWallets.slice(0, 6).map((wallet) => (
                      <WalletCard
                        key={wallet.publicKey}
                        wallet={wallet}
                        isAdmin={false}
                        showPrivateKey={showPrivateKeys}
                        onCopy={copyToClipboard}
                        tokenSymbol={currentSession?.tokenName}
                        compact={true}
                      />
                    ))}
                    {tradingWallets.length > 6 && (
                      <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <div className="text-center">
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            +{tradingWallets.length - 6} more wallets
                          </p>
                          <button
                            onClick={() => setActiveTab('trading')}
                            className="text-solana-600 dark:text-solana-400 hover:text-solana-700 dark:hover:text-solana-300 text-sm font-medium mt-1"
                          >
                            View All
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Trading Wallets
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Generate trading wallets to start automated trading
                    </p>
                    <button
                      onClick={() => setActiveTab('trading')}
                      className="inline-flex items-center px-4 py-2 bg-solana-600 hover:bg-solana-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Wallets
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <AdminWalletPanel
              adminWallet={adminWallet}
              showPrivateKey={showPrivateKeys}
              onWalletCreated={(wallet) => dispatch(setAdminWallet(wallet))}
              onCopy={copyToClipboard}
            />
          )}

          {activeTab === 'trading' && (
            <TradingWalletPanel
              tradingWallets={tradingWallets}
              showPrivateKeys={showPrivateKeys}
              onWalletsGenerated={(wallets) => dispatch(setTradingWallets(wallets))}
              onCopy={copyToClipboard}
              tokenSymbol={currentSession?.tokenName}
            />
          )}

          {activeTab === 'distribution' && (
            <div className="space-y-8">
              <SOLDistributionPanel
                adminWallet={adminWallet}
                tradingWallets={tradingWallets}
                onDistributionComplete={(wallets) => dispatch(setTradingWallets(wallets))}
              />
              
              {currentSession && (
                <TokenDistributionPanel
                  adminWallet={adminWallet}
                  tradingWallets={tradingWallets}
                  tokenAddress={currentSession.tokenAddress}
                  tokenSymbol={currentSession.tokenName}
                  onDistributionComplete={(wallets) => dispatch(setTradingWallets(wallets))}
                />
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <WalletSecurityPanel
              adminWallet={adminWallet}
              tradingWallets={tradingWallets}
              showPrivateKeys={showPrivateKeys}
              onTogglePrivateKeys={() => setShowPrivateKeys(!showPrivateKeys)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Wallets