import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface SessionData {
  admin: {
    number: number
    address: string
    privateKey: string
  }
  wallets: Array<{
    number: number
    address: string
    privateKey: string
    generationTimestamp?: string
  }>
  tokenAddress: string
  poolKeys: any
  tokenName: string
  timestamp: string
}

interface SessionState {
  currentSession: SessionData | null
  sessionFiles: string[]
  isLoading: boolean
  error: string | null
  sessionTimestamp: string | null
}

const initialState: SessionState = {
  currentSession: null,
  sessionFiles: [],
  isLoading: false,
  error: null,
  sessionTimestamp: null,
}

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setCurrentSession: (state, action: PayloadAction<SessionData | null>) => {
      state.currentSession = action.payload
      state.error = null
    },
    setSessionFiles: (state, action: PayloadAction<string[]>) => {
      state.sessionFiles = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setSessionTimestamp: (state, action: PayloadAction<string>) => {
      state.sessionTimestamp = action.payload
    },
    updateSessionWallets: (state, action: PayloadAction<SessionData['wallets']>) => {
      if (state.currentSession) {
        state.currentSession.wallets = action.payload
      }
    },
    clearSession: (state) => {
      state.currentSession = null
      state.error = null
      state.sessionTimestamp = null
    },
  },
})

export const {
  setCurrentSession,
  setSessionFiles,
  setLoading,
  setError,
  setSessionTimestamp,
  updateSessionWallets,
  clearSession,
} = sessionSlice.actions

export default sessionSlice.reducer