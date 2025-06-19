import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Sun, Moon, Monitor, Bell, User } from 'lucide-react'
import { RootState } from '../store/store'
import { setTheme, Theme } from '../store/slices/themeSlice'

const Header: React.FC = () => {
  const dispatch = useDispatch()
  const { theme, isDark } = useSelector((state: RootState) => state.theme)
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
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Trading Dashboard
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme Selector */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const isActive = theme === option.value
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    isActive
                      ? 'bg-white dark:bg-gray-600 text-solana-600 dark:text-solana-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  title={option.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              )
            })}
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Menu */}
          <button className="flex items-center space-x-2 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <User className="w-5 h-5" />
            <span className="text-sm font-medium">Admin</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header