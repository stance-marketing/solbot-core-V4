import React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { 
  LayoutDashboard, 
  FolderOpen, 
  TrendingUp, 
  Wallet, 
  Settings,
  Activity,
  Zap,
  Terminal,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import { RootState } from '../store/store'
import ConnectionStatus from './ConnectionStatus'
import { motion } from 'framer-motion'
import { useState } from 'react'

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
  const navigate = useNavigate()
  const { status } = useSelector((state: RootState) => state.websocket)
  const { currentSession } = useSelector((state: RootState) => state.session)
  const { status: tradingStatus } = useSelector((state: RootState) => state.trading)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <>
      <motion.div 
        className={`hidden lg:flex bg-card border-r border-border flex-col transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
        initial={false}
        animate={{ width: isCollapsed ? 80 : 288 }}
      >
        {/* Logo */}
        <div className="flex items-center px-6 py-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold gradient-text">
                  Solana Bot
                </h1>
                <p className="text-xs text-muted-foreground">
                  Trading Dashboard
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <div className={`px-6 py-4 border-b border-border ${isCollapsed ? 'hidden' : 'block'}`}>
          <ConnectionStatus />
        </div>

        {/* Session Info */}
        {currentSession && !isCollapsed && (
          <div className="px-6 py-4 border-b border-border">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Active Session
            </div>
            <div className="bg-muted/20 rounded-lg p-3 border border-border">
              <div className="text-sm font-medium text-foreground truncate">
                {currentSession.tokenName}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {currentSession.wallets.length} wallets
              </div>
            </div>
          </div>
        )}

        {/* Trading Status */}
        {tradingStatus !== 'idle' && !isCollapsed && (
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center space-x-2 bg-muted/20 rounded-lg p-3 border border-border">
              <Activity className={`w-5 h-5 ${
                tradingStatus === 'running' ? 'text-secondary animate-pulse' :
                tradingStatus === 'paused' ? 'text-yellow-500' :
                tradingStatus === 'error' ? 'text-red-500' :
                'text-muted-foreground'
              }`} />
              <div>
                <span className="text-sm font-medium text-foreground capitalize">
                  {tradingStatus}
                </span>
                <p className="text-xs text-muted-foreground">
                  {tradingStatus === 'running' ? 'Trading active' : 
                   tradingStatus === 'paused' ? 'Trading paused' : 
                   tradingStatus === 'error' ? 'Error occurred' : 
                   'Trading stopped'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-primary/10 text-primary border-r-2 border-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon
                  className={`${isCollapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3'} transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                />
                {!isCollapsed && item.name}
              </NavLink>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="text-xs text-muted-foreground">
                v1.0.0 • Built with React
              </div>
            )}
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-lg bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default Sidebar