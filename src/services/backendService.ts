import { SessionData } from '../store/slices/sessionSlice'
import { WalletData } from '../store/slices/walletSlice'

export interface TokenValidationResult {
  isValid: boolean
  tokenData?: {
    name: string
    symbol: string
    price: string
    volume24h: string
    priceChange24h: string
  }
  poolKeys?: any
}

export interface SessionFile {
  filename: string
  tokenName: string
  timestamp: string
  walletCount: number
  size: number
  lastModified: Date
}

class BackendService {
  private baseUrl = 'http://localhost:3001/api' // Your backend URL

  // Session Management - Direct integration with your backend functions
  async getSessionFiles(): Promise<SessionFile[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions`)
      if (!response.ok) throw new Error('Failed to fetch session files')
      return await response.json()
    } catch (error) {
      console.error('Error fetching session files:', error)
      throw error
    }
  }

  async loadSession(filename: string): Promise<SessionData> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${filename}`)
      if (!response.ok) throw new Error('Failed to load session')
      return await response.json()
    } catch (error) {
      console.error('Error loading session:', error)
      throw error
    }
  }

  async saveSession(sessionData: SessionData): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      })
      if (!response.ok) throw new Error('Failed to save session')
      const result = await response.json()
      return result.filename
    } catch (error) {
      console.error('Error saving session:', error)
      throw error
    }
  }

  async deleteSession(filename: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${filename}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete session')
    } catch (error) {
      console.error('Error deleting session:', error)
      throw error
    }
  }

  // Token Management - Integrates with your existing token validation
  async validateTokenAddress(address: string): Promise<TokenValidationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/tokens/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress: address })
      })
      if (!response.ok) throw new Error('Failed to validate token')
      return await response.json()
    } catch (error) {
      console.error('Error validating token:', error)
      throw error
    }
  }

  async getPoolKeys(tokenAddress: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/tokens/pool-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress })
      })
      if (!response.ok) throw new Error('Failed to get pool keys')
      return await response.json()
    } catch (error) {
      console.error('Error getting pool keys:', error)
      throw error
    }
  }

  // Wallet Management - Integrates with your existing wallet functions
  async createAdminWallet(): Promise<WalletData> {
    try {
      const response = await fetch(`${this.baseUrl}/wallets/admin`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to create admin wallet')
      return await response.json()
    } catch (error) {
      console.error('Error creating admin wallet:', error)
      throw error
    }
  }

  async importAdminWallet(privateKey: string): Promise<WalletData> {
    try {
      const response = await fetch(`${this.baseUrl}/wallets/admin/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privateKey })
      })
      if (!response.ok) throw new Error('Failed to import admin wallet')
      return await response.json()
    } catch (error) {
      console.error('Error importing admin wallet:', error)
      throw error
    }
  }

  async generateTradingWallets(count: number): Promise<WalletData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/wallets/trading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      })
      if (!response.ok) throw new Error('Failed to generate trading wallets')
      return await response.json()
    } catch (error) {
      console.error('Error generating trading wallets:', error)
      throw error
    }
  }

  async getWalletBalances(wallets: WalletData[]): Promise<WalletData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/wallets/balances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallets })
      })
      if (!response.ok) throw new Error('Failed to get wallet balances')
      return await response.json()
    } catch (error) {
      console.error('Error getting wallet balances:', error)
      throw error
    }
  }

  // Distribution Functions - Integrates with your existing distribution logic
  async distributeSol(adminWallet: WalletData, tradingWallets: WalletData[], totalAmount: number): Promise<WalletData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/distribution/sol`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminWallet, tradingWallets, totalAmount })
      })
      if (!response.ok) throw new Error('Failed to distribute SOL')
      return await response.json()
    } catch (error) {
      console.error('Error distributing SOL:', error)
      throw error
    }
  }

  async distributeTokens(adminWallet: WalletData, tradingWallets: WalletData[], tokenAddress: string, totalAmount: number): Promise<WalletData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/distribution/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminWallet, tradingWallets, tokenAddress, totalAmount })
      })
      if (!response.ok) throw new Error('Failed to distribute tokens')
      return await response.json()
    } catch (error) {
      console.error('Error distributing tokens:', error)
      throw error
    }
  }

  // Trading Functions - Integrates with your existing trading logic
  async startTrading(strategy: string, sessionData: SessionData): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/trading/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy, sessionData })
      })
      if (!response.ok) throw new Error('Failed to start trading')
    } catch (error) {
      console.error('Error starting trading:', error)
      throw error
    }
  }

  async pauseTrading(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/trading/pause`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to pause trading')
    } catch (error) {
      console.error('Error pausing trading:', error)
      throw error
    }
  }

  async resumeTrading(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/trading/resume`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to resume trading')
    } catch (error) {
      console.error('Error resuming trading:', error)
      throw error
    }
  }

  async stopTrading(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/trading/stop`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to stop trading')
    } catch (error) {
      console.error('Error stopping trading:', error)
      throw error
    }
  }

  // Restart Functions - Maps to your existing restart points
  async restartFromPoint(point: number, sessionData: SessionData): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/restart/${point}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionData })
      })
      if (!response.ok) throw new Error('Failed to restart from point')
    } catch (error) {
      console.error('Error restarting from point:', error)
      throw error
    }
  }

  // Cleanup Functions - Integrates with your existing cleanup logic
  async closeTokenAccountsAndSendBalance(sessionData: SessionData): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/cleanup/close-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionData })
      })
      if (!response.ok) throw new Error('Failed to close token accounts')
    } catch (error) {
      console.error('Error closing token accounts:', error)
      throw error
    }
  }

  // Environment File Generation
  async generateEnvFile(sessionData: SessionData): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/export-env`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionData })
      })
      if (!response.ok) throw new Error('Failed to generate env file')
      return await response.text()
    } catch (error) {
      console.error('Error generating env file:', error)
      throw error
    }
  }
}

export const backendService = new BackendService()