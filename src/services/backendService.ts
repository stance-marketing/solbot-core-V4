// Backend Service - Production ready with real API calls
import { SessionData } from '../store/slices/sessionSlice'
import { WalletData } from '../store/slices/walletSlice'

// These interfaces match your actual backend data structures
export interface TokenValidationResult {
  isValid: boolean
  tokenData?: {
    name: string
    symbol: string
    address: string
    price: string
    volume: { h24: string }
    priceChange: { h24: string }
    txns: {
      h24: {
        buys: number
        sells: number
      }
    }
  }
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
  private baseUrl = 'http://localhost:3001/api'

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }
    return response
  }

  // Session Management - Maps directly to your utility functions
  async getSessionFiles(): Promise<SessionFile[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions`)
      await this.handleResponse(response)
      const files = await response.json()
      
      // Convert lastModified strings to Date objects
      return files.map((file: any) => ({
        ...file,
        lastModified: new Date(file.lastModified)
      }))
    } catch (error) {
      console.error('Failed to fetch session files:', error)
      throw new Error(`Failed to fetch session files: ${error.message}`)
    }
  }

  async loadSession(filename: string): Promise<SessionData> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${encodeURIComponent(filename)}`)
      await this.handleResponse(response)
      return await response.json()
    } catch (error) {
      console.error('Failed to load session:', error)
      throw new Error(`Failed to load session: ${error.message}`)
    }
  }

  // Maps to your saveSession function in utility.ts
  async saveSession(sessionData: SessionData): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      })
      await this.handleResponse(response)
      const result = await response.json()
      return result.filename
    } catch (error) {
      console.error('Failed to save session:', error)
      throw new Error(`Failed to save session: ${error.message}`)
    }
  }

  // Maps to your appendWalletsToSession function in utility.ts
  async appendWalletsToSession(wallets: WalletData[], sessionFileName: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/append-wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallets, sessionFileName })
      })
      await this.handleResponse(response)
    } catch (error) {
      console.error('Failed to append wallets to session:', error)
      throw new Error(`Failed to append wallets to session: ${error.message}`)
    }
  }

  async deleteSession(filename: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      })
      await this.handleResponse(response)
    } catch (error) {
      console.error('Failed to delete session:', error)
      throw new Error(`Failed to delete session: ${error.message}`)
    }
  }

  // Token Management - Maps to your DexScreener integration and pool-keys functions
  async validateTokenAddress(address: string): Promise<TokenValidationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/tokens/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress: address })
      })
      await this.handleResponse(response)
      return await response.json()
    } catch (error) {
      console.error('Failed to validate token:', error)
      throw new Error(`Failed to validate token: ${error.message}`)
    }
  }

  // Maps to your getPoolKeysForTokenAddress function in pool-keys.ts
  async getPoolKeys(tokenAddress: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/tokens/pool-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress })
      })
      await this.handleResponse(response)
      return await response.json()
    } catch (error) {
      console.error('Failed to get pool keys:', error)
      throw new Error(`Failed to get pool keys: ${error.message}`)
    }
  }

  // Maps to your getMarketIdForTokenAddress function in pool-keys.ts
  async getMarketId(tokenAddress: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/tokens/market-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress })
      })
      await this.handleResponse(response)
      const result = await response.json()
      return result.marketId
    } catch (error) {
      console.error('Failed to get market ID:', error)
      throw new Error(`Failed to get market ID: ${error.message}`)
    }
  }

  // Wallet Management - Maps to your WalletWithNumber class
  async createAdminWallet(): Promise<WalletData> {
    try {
      const response = await fetch(`${this.baseUrl}/wallets/admin`, {
        method: 'POST'
      })
      await this.handleResponse(response)
      return await response.json()
    } catch (error) {
      console.error('Failed to create admin wallet:', error)
      throw new Error(`Failed to create admin wallet: ${error.message}`)
    }
  }

  // Maps to your createWalletWithNumber function in utility.ts
  async importAdminWallet(privateKey: string): Promise<WalletData> {
    try {
      const response = await fetch(`${this.baseUrl}/wallets/admin/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privateKey })
      })
      await this.handleResponse(response)
      return await response.json()
    } catch (error) {
      console.error('Failed to import admin wallet:', error)
      throw new Error(`Failed to import admin wallet: ${error.message}`)
    }
  }

  // Maps to your Array.from({ length: numWallets }, () => new WalletWithNumber())
  async generateTradingWallets(count: number): Promise<WalletData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/wallets/trading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      })
      await this.handleResponse(response)
      return await response.json()
    } catch (error) {
      console.error('Failed to generate trading wallets:', error)
      throw new Error(`Failed to generate trading wallets: ${error.message}`)
    }
  }

  // Maps to your getSolBalance and getTokenBalance functions
  async getWalletBalances(wallets: WalletData[]): Promise<WalletData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/wallets/balances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallets })
      })
      await this.handleResponse(response)
      return await response.json()
    } catch (error) {
      console.error('Failed to get wallet balances:', error)
      throw new Error(`Failed to get wallet balances: ${error.message}`)
    }
  }

  // Maps to your getTokenBalance function for admin wallet
  async getAdminTokenBalance(adminWallet: WalletData, tokenAddress: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/wallets/admin/token-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminWallet, tokenAddress })
      })
      await this.handleResponse(response)
      const result = await response.json()
      return result.balance
    } catch (error) {
      console.error('Failed to get admin token balance:', error)
      throw new Error(`Failed to get admin token balance: ${error.message}`)
    }
  }

  // Distribution - Maps to your distributeSol function in utility.ts
  async distributeSol(adminWallet: WalletData, tradingWallets: WalletData[], totalAmount: number): Promise<WalletData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/distribution/sol`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminWallet, tradingWallets, totalAmount })
      })
      await this.handleResponse(response)
      const result = await response.json()
      return result.successWallets || result
    } catch (error) {
      console.error('Failed to distribute SOL:', error)
      throw new Error(`Failed to distribute SOL: ${error.message}`)
    }
  }

  // Maps to your distributeTokens function in utility.ts
  async distributeTokens(adminWallet: WalletData, tradingWallets: WalletData[], tokenAddress: string, amountPerWallet: number): Promise<WalletData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/distribution/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminWallet, tradingWallets, tokenAddress, amountPerWallet })
      })
      await this.handleResponse(response)
      return await response.json()
    } catch (error) {
      console.error('Failed to distribute tokens:', error)
      throw new Error(`Failed to distribute tokens: ${error.message}`)
    }
  }

  // Trading - Maps to your dynamicTrade function in dynamicTrade.ts
  async startTrading(strategy: string, sessionData: SessionData): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/trading/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy, sessionData })
      })
      await this.handleResponse(response)
    } catch (error) {
      console.error('Failed to start trading:', error)
      throw new Error(`Failed to start trading: ${error.message}`)
    }
  }

  async pauseTrading(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/trading/pause`, {
        method: 'POST'
      })
      await this.handleResponse(response)
    } catch (error) {
      console.error('Failed to pause trading:', error)
      throw new Error(`Failed to pause trading: ${error.message}`)
    }
  }

  async resumeTrading(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/trading/resume`, {
        method: 'POST'
      })
      await this.handleResponse(response)
    } catch (error) {
      console.error('Failed to resume trading:', error)
      throw new Error(`Failed to resume trading: ${error.message}`)
    }
  }

  async stopTrading(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/trading/stop`, {
        method: 'POST'
      })
      await this.handleResponse(response)
    } catch (error) {
      console.error('Failed to stop trading:', error)
      throw new Error(`Failed to stop trading: ${error.message}`)
    }
  }

  // Restart Points - Maps to your index.ts restart options (1-6)
  async restartFromPoint(point: number, sessionData: SessionData): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/restart/${point}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionData })
      })
      await this.handleResponse(response)
    } catch (error) {
      console.error('Failed to restart from point:', error)
      throw new Error(`Failed to restart from point: ${error.message}`)
    }
  }

  // Cleanup - Maps to your closeTokenAccountsAndSendBalance function in addedOptions.ts
  async closeTokenAccountsAndSendBalance(sessionData: SessionData): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/cleanup/close-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionData })
      })
      await this.handleResponse(response)
    } catch (error) {
      console.error('Failed to close token accounts:', error)
      throw new Error(`Failed to close token accounts: ${error.message}`)
    }
  }

  // Environment File Generation - Maps to your updateEnvFile function in utility.ts
  async generateEnvFile(sessionData: SessionData): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/export-env`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionData })
      })
      await this.handleResponse(response)
      return await response.text()
    } catch (error) {
      console.error('Failed to generate env file:', error)
      throw new Error(`Failed to generate env file: ${error.message}`)
    }
  }

  // Health check
  async checkHealth(): Promise<{ status: string; timestamp: string; tradingActive: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      await this.handleResponse(response)
      return await response.json()
    } catch (error) {
      console.error('Health check failed:', error)
      throw new Error(`Health check failed: ${error.message}`)
    }
  }
}

export const backendService = new BackendService()