import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface WalletData {
  number: number
  publicKey: string
  privateKey: string
  solBalance: number
  tokenBalance: number
  isActive: boolean
  lastActivity?: number
  generationTimestamp?: string
}

interface WalletState {
  adminWallet: WalletData | null
  tradingWallets: WalletData[]
  isLoading: boolean
  error: string | null
  totalSolBalance: number
  totalTokenBalance: number
}

const initialState: WalletState = {
  adminWallet: null,
  tradingWallets: [],
  isLoading: false,
  error: null,
  totalSolBalance: 0,
  totalTokenBalance: 0,
}

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setAdminWallet: (state, action: PayloadAction<WalletData | null>) => {
      state.adminWallet = action.payload
    },
    setTradingWallets: (state, action: PayloadAction<WalletData[]>) => {
      state.tradingWallets = action.payload
    },
    addTradingWallet: (state, action: PayloadAction<WalletData>) => {
      state.tradingWallets.push(action.payload)
    },
    updateWalletBalance: (state, action: PayloadAction<{ publicKey: string; solBalance?: number; tokenBalance?: number }>) => {
      const { publicKey, solBalance, tokenBalance } = action.payload
      
      // Update admin wallet
      if (state.adminWallet && state.adminWallet.publicKey === publicKey) {
        if (solBalance !== undefined) state.adminWallet.solBalance = solBalance
        if (tokenBalance !== undefined) state.adminWallet.tokenBalance = tokenBalance
        state.adminWallet.lastActivity = Date.now()
      }
      
      // Update trading wallet
      const wallet = state.tradingWallets.find(w => w.publicKey === publicKey)
      if (wallet) {
        if (solBalance !== undefined) wallet.solBalance = solBalance
        if (tokenBalance !== undefined) wallet.tokenBalance = tokenBalance
        wallet.lastActivity = Date.now()
      }
    },
    updateWalletActivity: (state, action: PayloadAction<{ publicKey: string; isActive: boolean }>) => {
      const { publicKey, isActive } = action.payload
      
      const wallet = state.tradingWallets.find(w => w.publicKey === publicKey)
      if (wallet) {
        wallet.isActive = isActive
        wallet.lastActivity = Date.now()
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    calculateTotals: (state) => {
      state.totalSolBalance = state.tradingWallets.reduce((total, wallet) => total + wallet.solBalance, 0)
      state.totalTokenBalance = state.tradingWallets.reduce((total, wallet) => total + wallet.tokenBalance, 0)
      
      if (state.adminWallet) {
        state.totalSolBalance += state.adminWallet.solBalance
        state.totalTokenBalance += state.adminWallet.tokenBalance
      }
    },
    clearWallets: (state) => {
      state.adminWallet = null
      state.tradingWallets = []
      state.totalSolBalance = 0
      state.totalTokenBalance = 0
      state.error = null
    },
  },
})

export const {
  setAdminWallet,
  setTradingWallets,
  addTradingWallet,
  updateWalletBalance,
  updateWalletActivity,
  setLoading,
  setError,
  calculateTotals,
  clearWallets,
} = walletSlice.actions

export default walletSlice.reducer