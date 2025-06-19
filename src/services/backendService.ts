import { SessionData } from '../store/slices/sessionSlice'
import { WalletData } from '../store/slices/walletSlice'

interface TokenValidationResult {
  isValid: boolean
  tokenData?: {
    name: string
    symbol: string
    price: string
    volume24h: string
    priceChange24h: string
  }
}

interface SessionFile {
  filename: string
  tokenName: string
  timestamp: string
  walletCount: number
  size: number
  lastModified: Date
}

class BackendService {
  private baseUrl = 'http://localhost:3001/api' // Your backend URL

  // Session Management
  async getSessionFiles(): Promise<SessionFile[]> {
    const response = await fetch(`${this.baseUrl}/sessions`)
    if (!response.ok) throw new Error('Failed to fetch session files')
    return response.json()
  }

  async loadSession(filename: string): Promise<SessionData> {
    const response = await fetch(`${this.baseUrl}/sessions/${filename}`)
    if (!response.ok) throw new Error('Failed to load session')
    return response.json()
  }

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

  async deleteSession(filename: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sessions/${filename}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete session')
  }

  // Token Operations
  async validateTokenAddress(address: string): Promise<TokenValidationResult> {
    const response = await fetch(`${this.baseUrl}/token/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    })
    if (!response.ok) throw new Error('Failed to validate token')
    return response.json()
  }

  async getPoolKeys(tokenAddress: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/token/pool-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenAddress })
    })
    if (!response.ok) throw new Error('Failed to get pool keys')
    return response.json()
  }

  // Wallet Operations
  async generateWallets(count: number): Promise<WalletData[]> {
    const response = await fetch(`${this.baseUrl}/wallets/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count })
    })
    if (!response.ok) throw new Error('Failed to generate wallets')
    return response.json()
  }

  async createAdminWallet(privateKey?: string): Promise<WalletData> {
    const response = await fetch(`${this.baseUrl}/wallets/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ privateKey })
    })
    if (!response.ok) throw new Error('Failed to create admin wallet')
    return response.json()
  }

  async getWalletBalances(wallets: WalletData[]): Promise<WalletData[]> {
    const response = await fetch(`${this.baseUrl}/wallets/balances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallets })
    })
    if (!response.ok) throw new Error('Failed to get wallet balances')
    return response.json()
  }

  // Distribution Operations
  async distributeSol(adminWallet: WalletData, wallets: WalletData[], totalAmount: number): Promise<WalletData[]> {
    const response = await fetch(`${this.baseUrl}/distribution/sol`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminWallet, wallets, totalAmount })
    })
    if (!response.ok) throw new Error('Failed to distribute SOL')
    return response.json()
  }

  async distributeTokens(adminWallet: WalletData, wallets: WalletData[], tokenAddress: string, totalAmount: number): Promise<WalletData[]> {
    const response = await fetch(`${this.baseUrl}/distribution/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminWallet, wallets, tokenAddress, totalAmount })
    })
    if (!response.ok) throw new Error('Failed to distribute tokens')
    return response.json()
  }

  // Trading Operations
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

  // Restart Operations
  async restartSession(filename: string, restartPoint: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sessions/restart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, restartPoint })
    })
    if (!response.ok) throw new Error('Failed to restart session')
  }

  // Cleanup Operations
  async closeTokenAccountsAndSendBalance(sessionData: SessionData): Promise<void> {
    const response = await fetch(`${this.baseUrl}/cleanup/close-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionData })
    })
    if (!response.ok) throw new Error('Failed to close token accounts')
  }

  // Export Operations
  async exportToEnv(sessionData: SessionData): Promise<string> {
    const response = await fetch(`${this.baseUrl}/export/env`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionData })
    })
    if (!response.ok) throw new Error('Failed to export to env')
    return response.text()
  }
}

export const backendService = new BackendService()