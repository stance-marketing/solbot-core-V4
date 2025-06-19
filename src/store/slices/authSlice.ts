import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface AuthState {
  isAuthenticated: boolean
  user: {
    username: string
    email: string
  } | null
}

const getInitialAuthState = (): AuthState => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('auth')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        // If parsing fails, return default state
      }
    }
  }
  return {
    isAuthenticated: false,
    user: null
  }
}

const initialState: AuthState = getInitialAuthState()

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ username: string; password: string }>) => {
      // Accept any username/password combination
      state.isAuthenticated = true
      state.user = {
        username: action.payload.username,
        email: `${action.payload.username}@example.com`
      }
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth', JSON.stringify(state))
      }
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.user = null
      
      // Remove from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth')
      }
    },
    initializeAuth: (state) => {
      // This action is handled by the initial state loading
      // but we keep it for consistency
    }
  }
})

export const { login, logout, initializeAuth } = authSlice.actions
export default authSlice.reducer