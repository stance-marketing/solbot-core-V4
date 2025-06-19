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
  Zap,
  Terminal
} from 'lucide-react'
import { RootState } from '../store/store'
import ConnectionStatus from './ConnectionStatus'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Sessions', href: '/sessions', icon: FolderOpen },
  { name: 'Trading', href: '/trading', icon: TrendingUp },
  { name: 'Wallets', href: '/wallets', icon: Wallet },
  { name: 'Monitoring', href: '/monitoring', icon: Terminal },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const Sidebar: React.FC = () => {
  const location = useLocation()
  const { status } = useSelector((state: RootState) => state.websocket)
  const { currentSession } = useSelector((state: RootState) => state.session)
  const { status: tradingStatus } = useSelector((state: RootState) => state.trading)

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">
              Solana Bot
            </h1>
            <p className="text-xs text-muted-foreground">
              Trading Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="px-6 py-3 border-b border-border">
        <ConnectionStatus />
      </div>

      {/* Session Info */}
      {currentSession && (
        <div className="px-6 py-3 border-b border-border">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Active Session
          </div>
          <div className="text-sm font-medium text-foreground truncate">
            {currentSession.tokenName}
          </div>
          <div className="text-xs text-muted-foreground">
            {currentSession.wallets.length} wallets
          </div>
        </div>
      )}

      {/* Trading Status */}
      {tradingStatus !== 'idle' && (
        <div className="px-6 py-3 border-b border-border">
          <div className="flex items-center space-x-2">
            <Activity className={`w-4 h-4 ${
              tradingStatus === 'running' ? 'text-secondary animate-pulse' :
              tradingStatus === 'paused' ? 'text-yellow-500' :
              tradingStatus === 'error' ? 'text-red-500' :
              'text-muted-foreground'
            }`} />
            <span className="text-sm font-medium text-foreground capitalize">
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
                  ? 'bg-primary/10 text-primary border-r-2 border-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground group-hover:text-foreground'
                }`}
              />
              {item.name}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          v1.0.0 • Built with React
        </div>
      </div>
    </div>
  )
}

export default Sidebar