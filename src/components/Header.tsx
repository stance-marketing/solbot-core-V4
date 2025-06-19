import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Sun, Moon, Monitor, Bell, User } from 'lucide-react'
import { RootState } from '../store/store'
import { setTheme, Theme } from '../store/slices/themeSlice'

const Header: React.FC = () => {
  const dispatch = useDispatch()
  const { theme } = useSelector((state: RootState) => state.theme)
  const { messages } = useSelector((state: RootState) => state.websocket)
  
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

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-foreground">
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
                  <Icon className="w-4 h-4" />
                </button>
              )
            })}
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Menu */}
          <button className="flex items-center space-x-2 p-2 text-muted-foreground hover:text-foreground transition-colors">
            <User className="w-5 h-5" />
            <span className="text-sm font-medium">Admin</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header