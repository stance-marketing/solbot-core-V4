// Backend Service - Direct mapping to your existing functions
import { SessionData } from '../store/slices/sessionSlice'
import { WalletData } from '../store/slices/walletSlice'

// These interfaces match your actual backend data structures
export interface TokenValidationResult {
  isValid: boolean
  tokenData?: {
    name: string
    symbol: string
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

  // Session Management - Maps directly to your utility functions
  async getSessionFiles(): Promise<SessionFile[]> {
    const response = await fetch(`${this.baseUrl}/sessions`)
    if (!response.ok) throw new Error('Failed to fetch session files')
    return await response.json()
  }

  async loadSession(filename: string): Promise<SessionData> {
    const response = await fetch(`${this.baseUrl}/sessions/${filename}`)
    if (!response.ok) throw new Error('Failed to load session')
    return await response.json()
  }

  // Maps to your saveSession function in utility.ts
  async saveSession(sessionData: SessionData): Promise<string> {
    const response = await fetch(`${this.baseUrl}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    })
    if (!response.ok) throw new Error('Failed to save session')
    const result = await response.json()
    return result.filename
  }

  // Maps to your appendWalletsToSession function in utility.ts
  async appendWalletsToSession(wallets: WalletData[], sessionFileName: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sessions/append-wallets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallets, sessionFileName })
    })
    if (!response.ok) throw new Error('Failed to append wallets to session')
  }

  async deleteSession(filename: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sessions/${filename}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete session')
  }

  // Token Management - Maps to your DexScreener integration and pool-keys functions
  async validateTokenAddress(address: string): Promise<TokenValidationResult> {
    const response = await fetch(`${this.baseUrl}/tokens/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenAddress: address })
    })
    if (!response.ok) throw new Error('Failed to validate token')
    return await response.json()
  }

  // Maps to your getPoolKeysForTokenAddress function in pool-keys.ts
  async getPoolKeys(tokenAddress: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/tokens/pool-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenAddress })
    })
    if (!response.ok) throw new Error('Failed to get pool keys')
    return await response.json()
  }

  // Maps to your getMarketIdForTokenAddress function in pool-keys.ts
  async getMarketId(tokenAddress: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/tokens/market-id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenAddress })
    })
    if (!response.ok) throw new Error('Failed to get market ID')
    const result = await response.json()
    return result.marketId
  }

  // Wallet Management - Maps to your WalletWithNumber class
  async createAdminWallet(): Promise<WalletData> {
    const response = await fetch(`${this.baseUrl}/wallets/admin`, {
      method: 'POST'
    })
    if (!response.ok) throw new Error('Failed to create admin wallet')
    return await response.json()
  }

  // Maps to your createWalletWithNumber function in utility.ts
  async importAdminWallet(privateKey: string): Promise<WalletData> {
    const response = await fetch(`${this.baseUrl}/wallets/admin/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ privateKey })
    })
    if (!response.ok) throw new Error('Failed to import admin wallet')
    return await response.json()
  }

  // Maps to your Array.from({ length: numWallets }, () => new WalletWithNumber())
  async generateTradingWallets(count: number): Promise<WalletData[]> {
    const response = await fetch(`${this.baseUrl}/wallets/trading`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count })
    })
    if (!response.ok) throw new Error('Failed to generate trading wallets')
    return await response.json()
  }

  // Maps to your getSolBalance and getTokenBalance functions
  async getWalletBalances(wallets: WalletData[]): Promise<WalletData[]> {
    const response = await fetch(`${this.baseUrl}/wallets/balances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallets })
    })
    if (!response.ok) throw new Error('Failed to get wallet balances')
    return await response.json()
  }

  // Maps to your getTokenBalance function for admin wallet
  async getAdminTokenBalance(adminWallet: WalletData, tokenAddress: string): Promise<number> {
    const response = await fetch(`${this.baseUrl}/wallets/admin/token-balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminWallet, tokenAddress })
    })
    if (!response.ok) throw new Error('Failed to get admin token balance')
    const result = await response.json()
    return result.balance
  }

  // Distribution - Maps to your distributeSol function in utility.ts
  async distributeSol(adminWallet: WalletData, tradingWallets: WalletData[], totalAmount: number): Promise<{ successWallets: WalletData[] }> {
    const response = await fetch(`${this.baseUrl}/distribution/sol`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminWallet, tradingWallets, totalAmount })
    })
    if (!response.ok) throw new Error('Failed to distribute SOL')
    return await response.json()
  }

  // Maps to your distributeTokens function in utility.ts
  async distributeTokens(adminWallet: WalletData, tradingWallets: WalletData[], tokenAddress: string, amountPerWallet: number): Promise<WalletData[]> {
    const response = await fetch(`${this.baseUrl}/distribution/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminWallet, tradingWallets, tokenAddress, amountPerWallet })
    })
    if (!response.ok) throw new Error('Failed to distribute tokens')
    return await response.json()
  }

  // Trading - Maps to your dynamicTrade function in dynamicTrade.ts
  async startTrading(strategy: string, sessionData: SessionData): Promise<void> {
    const response = await fetch(`${this.baseUrl}/trading/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategy, sessionData })
    })
    if (!response.ok) throw new Error('Failed to start trading')
  }

  async pauseTrading(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/trading/pause`, {
      method: 'POST'
    })
    if (!response.ok) throw new Error('Failed to pause trading')
  }

  async resumeTrading(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/trading/resume`, {
      method: 'POST'
    })
    if (!response.ok) throw new Error('Failed to resume trading')
  }

  async stopTrading(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/trading/stop`, {
      method: 'POST'
    })
    if (!response.ok) throw new Error('Failed to stop trading')
  }

  // Restart Points - Maps to your index.ts restart options (1-6)
  async restartFromPoint(point: number, sessionData: SessionData): Promise<void> {
    const response = await fetch(`${this.baseUrl}/restart/${point}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionData })
    })
    if (!response.ok) throw new Error('Failed to restart from point')
  }

  // Cleanup - Maps to your closeTokenAccountsAndSendBalance function in addedOptions.ts
  async closeTokenAccountsAndSendBalance(sessionData: SessionData): Promise<void> {
    const response = await fetch(`${this.baseUrl}/cleanup/close-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionData })
    })
    if (!response.ok) throw new Error('Failed to close token accounts')
  }

  // Environment File Generation - Maps to your updateEnvFile function in utility.ts
  async generateEnvFile(sessionData: SessionData): Promise<string> {
    const response = await fetch(`${this.baseUrl}/sessions/export-env`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionData })
    })
    if (!response.ok) throw new Error('Failed to generate env file')
    return await response.text()
  }
}

export const backendService = new BackendService()