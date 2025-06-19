import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface SwapConfig {
  RPC_URL: string
  WS_URL: string
  WSOL_ADDRESS: string
  RAYDIUM_LIQUIDITY_POOL_V4_ADDRESS: string
  SLIPPAGE_PERCENT: number
  initialAmount: number
  TOKEN_TRANSFER_THRESHOLD: number
  poolSearchMaxRetries: number
  poolSearchRetryInterval: number
  retryInterval: number
  maxRetries: number
  RENT_EXEMPT_FEE: number
  maxLamports: number
  TRADE_DURATION_VOLUME: number
  TRADE_DURATION_MAKER: number
  loopInterval: number
  RENT_EXEMPT_SWAP_FEE: number
  minPercentage: number
  maxPercentage: number
  minSellPercentage: number
  maxSellPercentage: number
  buyDuration: number
  sellDuration: number
  SESSION_DIR: string
}

interface ConfigState {
  swapConfig: SwapConfig
  isLoading: boolean
  error: string | null
  hasUnsavedChanges: boolean
}

const defaultSwapConfig: SwapConfig = {
  // Updated RPC URL with fallback
  RPC_URL: "https://floral-capable-sun.solana-mainnet.quiknode.pro/569466c8ec8e71909ae64117473d0bd3327e133a/",
  // Updated WebSocket URL with fallback
  WS_URL: "wss://floral-capable-sun.solana-mainnet.quiknode.pro/569466c8ec8e71909ae64117473d0bd3327e133a/",
  WSOL_ADDRESS: "So11111111111111111111111111111111111111112",
  RAYDIUM_LIQUIDITY_POOL_V4_ADDRESS: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
  SLIPPAGE_PERCENT: 5,
  initialAmount: 0.00001,
  TOKEN_TRANSFER_THRESHOLD: 0,
  poolSearchMaxRetries: 10,
  poolSearchRetryInterval: 2000,
  retryInterval: 1000,
  maxRetries: 15,
  RENT_EXEMPT_FEE: 900000,
  maxLamports: 6000,
  TRADE_DURATION_VOLUME: 1200000000,
  TRADE_DURATION_MAKER: 181000,
  loopInterval: 8000,
  RENT_EXEMPT_SWAP_FEE: 0,
  minPercentage: 5,
  maxPercentage: 15,
  minSellPercentage: 50,
  maxSellPercentage: 100,
  buyDuration: 61000,
  sellDuration: 30000,
  SESSION_DIR: "./sessions"
}

const initialState: ConfigState = {
  swapConfig: defaultSwapConfig,
  isLoading: false,
  error: null,
  hasUnsavedChanges: false,
}

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    updateSwapConfig: (state, action: PayloadAction<Partial<SwapConfig>>) => {
      state.swapConfig = { ...state.swapConfig, ...action.payload }
      state.hasUnsavedChanges = true
    },
    resetSwapConfig: (state) => {
      state.swapConfig = defaultSwapConfig
      state.hasUnsavedChanges = true
    },
    saveConfig: (state) => {
      state.hasUnsavedChanges = false
      state.error = null
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearUnsavedChanges: (state) => {
      state.hasUnsavedChanges = false
    },
  },
})

export const {
  updateSwapConfig,
  resetSwapConfig,
  saveConfig,
  setLoading,
  setError,
  clearUnsavedChanges,
} = configSlice.actions

export default configSlice.reducer