import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
  Sun, 
  Moon, 
  Monitor, 
  Bell, 
  User, 
  Settings,
  LogOut,
  ChevronDown,
  X
} from 'lucide-react'
import { RootState } from '../store/store'
import { setTheme, Theme } from '../store/slices/themeSlice'
import { motion, AnimatePresence } from 'framer-motion'

const Header: React.FC = () => {
  const dispatch = useDispatch()
  const { theme } = useSelector((state: RootState) => state.theme)
  const { messages } = useSelector((state: RootState) => state.websocket)
  
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  const unreadCount = messages.filter(msg => 
    msg.type === 'error' || msg.type === 'warning'
  ).length

  const handleThemeChange = (newTheme: Theme) => {
    dispatch(setTheme(newTheme))
  }

  const themeOptions = [
    { value: 'light' as Theme, icon: Sun, label: 'Light' },
    { value: 'dark' as Theme, icon: Moon, label: 'Dark' },
    { value: 'system' as Theme, icon: Monitor, label: 'System' },
  ]

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
    if (showUserMenu) setShowUserMenu(false)
  }

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu)
    if (showNotifications) setShowNotifications(false)
  }

  return (
    <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-secondary">
            Trading Dashboard
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme Selector */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const isActive = theme === option.value
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    isActive
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title={option.label}
                >
                  <Icon className="w-5 h-5" />
                </button>
              )
            })}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button 
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
              onClick={toggleNotifications}
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  className="absolute right-0 mt-2 w-80 bg-card rounded-xl border border-border shadow-lg overflow-hidden z-50"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">Notifications</h3>
                    <button 
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNotifications(false)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {messages.filter(msg => msg.type === 'error' || msg.type === 'warning').length > 0 ? (
                      messages
                        .filter(msg => msg.type === 'error' || msg.type === 'warning')
                        .slice(0, 5)
                        .map((msg, index) => (
                          <div 
                            key={msg.id} 
                            className="p-4 border-b border-border hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-start">
                              <div className={`w-2 h-2 rounded-full mt-1.5 mr-2 ${
                                msg.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                              }`}></div>
                              <div>
                                <p className="text-sm text-foreground">
                                  {msg.type === 'error' ? 'Error' : 'Warning'}: {msg.data.message || 'System notification'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-muted-foreground">No notifications</p>
                      </div>
                    )}
                  </div>
                  
                  {messages.filter(msg => msg.type === 'error' || msg.type === 'warning').length > 0 && (
                    <div className="p-3 border-t border-border">
                      <button 
                        className="w-full text-center text-sm text-primary hover:text-primary/80"
                        onClick={() => navigate('/monitoring')}
                      >
                        View All Notifications
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button 
              className="flex items-center space-x-2 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
              onClick={toggleUserMenu}
            >
              <User className="w-6 h-6" />
              <span className="text-sm font-medium hidden md:block">Admin</span>
              <ChevronDown className="w-4 h-4 hidden md:block" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div 
                  className="absolute right-0 mt-2 w-56 bg-card rounded-xl border border-border shadow-lg overflow-hidden z-50"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-4 border-b border-border">
                    <p className="font-semibold text-foreground">Admin User</p>
                    <p className="text-sm text-muted-foreground">admin@example.com</p>
                  </div>
                  
                  <div className="p-2">
                    <button className="flex items-center space-x-2 w-full p-2 text-left rounded-lg hover:bg-muted transition-colors">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">Settings</span>
                    </button>
                    
                    <button className="flex items-center space-x-2 w-full p-2 text-left rounded-lg hover:bg-muted transition-colors">
                      <LogOut className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header