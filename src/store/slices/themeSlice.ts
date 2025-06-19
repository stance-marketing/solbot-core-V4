import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  isDark: boolean
}

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme') as Theme
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored
    }
  }
  return 'system'
}

const getIsDark = (theme: Theme): boolean => {
  if (theme === 'system') {
    return typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  }
  return theme === 'dark'
}

const initialState: ThemeState = {
  theme: getInitialTheme(),
  isDark: false,
}

initialState.isDark = getIsDark(initialState.theme)

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload
      state.isDark = getIsDark(action.payload)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', action.payload)
        
        if (state.isDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    },
    toggleTheme: (state) => {
      const newTheme = state.isDark ? 'light' : 'dark'
      state.theme = newTheme
      state.isDark = !state.isDark
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme)
        
        if (state.isDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    },
    initializeTheme: (state) => {
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        
        if (state.theme === 'system') {
          state.isDark = mediaQuery.matches
        }
        
        if (state.isDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        
        // Listen for system theme changes
        mediaQuery.addEventListener('change', (e) => {
          if (state.theme === 'system') {
            state.isDark = e.matches
            if (e.matches) {
              document.documentElement.classList.add('dark')
            } else {
              document.documentElement.classList.remove('dark')
            }
          }
        })
      }
    },
  },
})

export const { setTheme, toggleTheme, initializeTheme } = themeSlice.actions
export default themeSlice.reducer