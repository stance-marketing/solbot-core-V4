import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { 
  LayoutDashboard, 
  FolderOpen, 
  TrendingUp, 
  Wallet, 
  Settings,
  Activity,
  Zap
} from 'lucide-react'
import { RootState } from '../store/store'
import ConnectionStatus from './ConnectionStatus'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Sessions', href: '/sessions', icon: FolderOpen },
  { name: 'Trading', href: '/trading', icon: TrendingUp },
  { name: 'Wallets', href: '/wallets', icon: Wallet },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const Sidebar: React.FC = () => {
  const location = useLocation()
  const { status } = useSelector((state: RootState) => state.websocket)
  const { currentSession } = useSelector((state: RootState) => state.session)
  const { status: tradingStatus } = useSelector((state: RootState) => state.trading)

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-solana-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Solana Bot
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Trading Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <ConnectionStatus />
      </div>

      {/* Session Info */}
      {currentSession && (
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Active Session
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {currentSession.tokenName}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {currentSession.wallets.length} wallets
          </div>
        </div>
      )}

      {/* Trading Status */}
      {tradingStatus !== 'idle' && (
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Activity className={`w-4 h-4 ${
              tradingStatus === 'running' ? 'text-green-500 animate-pulse' :
              tradingStatus === 'paused' ? 'text-yellow-500' :
              tradingStatus === 'error' ? 'text-red-500' :
              'text-gray-400'
            }`} />
            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {tradingStatus}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-solana-50 dark:bg-solana-900/20 text-solana-700 dark:text-solana-300 border-r-2 border-solana-500'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 transition-colors ${
                  isActive
                    ? 'text-solana-600 dark:text-solana-400'
                    : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                }`}
              />
              {item.name}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          v1.0.0 • Built with React
        </div>
      </div>
    </div>
  )
}

export default Sidebar