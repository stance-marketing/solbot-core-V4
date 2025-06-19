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
  private baseUrl = '/api'

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If parsing fails, use the default error message
      }
      throw new Error(errorMessage);
    }
    return response;
  }

  // Test backend connection
  async testConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('Backend connection test timed out after 5 seconds');
        } else if (error.message.includes('fetch')) {
          console.error('Backend server is not running or not accessible at', this.baseUrl);
        } else {
          console.error('Backend connection test failed:', error.message);
        }
      } else {
        console.error('Backend connection test failed:', error);
      }
      return false;
    }
  }

  // Session Management - Maps directly to your utility functions
  async getSessionFiles(): Promise<SessionFile[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const files = await response.json();
      
      // Convert lastModified strings to Date objects
      return files.map((file: any) => ({
        ...file,
        lastModified: new Date(file.lastModified)
      }));
    } catch (error) {
      console.error('❌ Failed to fetch session files:', error);
      throw new Error(`Failed to fetch session files: ${this.getErrorMessage(error)}`);
    }
  }

  async loadSession(filename: string): Promise<SessionData> {
    try {
      console.log('🔍 Loading session from backend:', filename);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/sessions/${encodeURIComponent(filename)}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const sessionData = await response.json();
      console.log('✅ Session loaded successfully');
      return sessionData;
    } catch (error) {
      console.error('❌ Failed to load session:', error);
      throw new Error(`Failed to load session: ${this.getErrorMessage(error)}`);
    }
  }

  // Maps to your saveSession function in utility.ts
  async saveSession(sessionData: SessionData): Promise<string> {
    try {
      console.log('💾 Saving session to backend...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${this.baseUrl}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const result = await response.json();
      console.log('✅ Session saved successfully:', result.filename);
      return result.filename;
    } catch (error) {
      console.error('❌ Failed to save session:', error);
      throw new Error(`Failed to save session: ${this.getErrorMessage(error)}`);
    }
  }

  // Maps to your appendWalletsToSession function in utility.ts
  async appendWalletsToSession(wallets: WalletData[], sessionFileName: string): Promise<void> {
    try {
      console.log('📝 Appending wallets to session...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${this.baseUrl}/sessions/append-wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallets, sessionFileName }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      console.log('✅ Wallets appended successfully');
    } catch (error) {
      console.error('❌ Failed to append wallets to session:', error);
      throw new Error(`Failed to append wallets to session: ${this.getErrorMessage(error)}`);
    }
  }

  async deleteSession(filename: string): Promise<void> {
    try {
      console.log('🗑️ Deleting session:', filename);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/sessions/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      console.log('✅ Session deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete session:', error);
      throw new Error(`Failed to delete session: ${this.getErrorMessage(error)}`);
    }
  }

  // Token Management - Maps to your DexScreener integration and pool-keys functions
  async validateTokenAddress(address: string): Promise<TokenValidationResult> {
    try {
      console.log('🔍 Validating token address with backend:', address);
      
      // First test if backend is reachable
      const isConnected = await this.testConnection();
      if (!isConnected) {
        throw new Error('Backend server is not running. Please start the backend with: npm run start-backend');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${this.baseUrl}/tokens/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress: address }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const result = await response.json();
      console.log('✅ Token validation result:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to validate token:', error);
      throw new Error(`Failed to validate token: ${this.getErrorMessage(error)}`);
    }
  }

  // Maps to your getPoolKeysForTokenAddress function in pool-keys.ts
  async getPoolKeys(tokenAddress: string): Promise<any> {
    try {
      console.log('🔍 Getting pool keys from backend:', tokenAddress);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${this.baseUrl}/tokens/pool-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const poolKeys = await response.json();
      console.log('✅ Pool keys received:', poolKeys);
      return poolKeys;
    } catch (error) {
      console.error('❌ Failed to get pool keys:', error);
      throw new Error(`Failed to get pool keys: ${this.getErrorMessage(error)}`);
    }
  }

  // Maps to your getMarketIdForTokenAddress function in pool-keys.ts
  async getMarketId(tokenAddress: string): Promise<string> {
    try {
      console.log('🔍 Getting market ID from backend:', tokenAddress);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/tokens/market-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const result = await response.json();
      console.log('✅ Market ID received:', result.marketId);
      return result.marketId;
    } catch (error) {
      console.error('❌ Failed to get market ID:', error);
      throw new Error(`Failed to get market ID: ${this.getErrorMessage(error)}`);
    }
  }

  // Wallet Management - Maps to your WalletWithNumber class
  async createAdminWallet(): Promise<WalletData> {
    try {
      console.log('👤 Creating admin wallet...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/wallets/admin`, {
        method: 'POST',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const wallet = await response.json();
      console.log('✅ Admin wallet created:', wallet.publicKey);
      return wallet;
    } catch (error) {
      console.error('❌ Failed to create admin wallet:', error);
      throw new Error(`Failed to create admin wallet: ${this.getErrorMessage(error)}`);
    }
  }

  // Maps to your createWalletWithNumber function in utility.ts
  async importAdminWallet(privateKey: string): Promise<WalletData> {
    try {
      console.log('📥 Importing admin wallet...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/wallets/admin/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privateKey }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const wallet = await response.json();
      console.log('✅ Admin wallet imported:', wallet.publicKey);
      return wallet;
    } catch (error) {
      console.error('❌ Failed to import admin wallet:', error);
      throw new Error(`Failed to import admin wallet: ${this.getErrorMessage(error)}`);
    }
  }

  // Maps to your Array.from({ length: numWallets }, () => new WalletWithNumber())
  async generateTradingWallets(count: number): Promise<WalletData[]> {
    try {
      console.log('🏭 Generating trading wallets:', count);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${this.baseUrl}/wallets/trading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const wallets = await response.json();
      console.log('✅ Trading wallets generated:', wallets.length);
      return wallets;
    } catch (error) {
      console.error('❌ Failed to generate trading wallets:', error);
      throw new Error(`Failed to generate trading wallets: ${this.getErrorMessage(error)}`);
    }
  }

  // Maps to your getSolBalance and getTokenBalance functions
  async getWalletBalances(wallets: WalletData[]): Promise<WalletData[]> {
    try {
      console.log('💰 Getting wallet balances...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${this.baseUrl}/wallets/balances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallets }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const updatedWallets = await response.json();
      console.log('✅ Wallet balances updated');
      return updatedWallets;
    } catch (error) {
      console.error('❌ Failed to get wallet balances:', error);
      throw new Error(`Failed to get wallet balances: ${this.getErrorMessage(error)}`);
    }
  }

  // Maps to your getTokenBalance function for admin wallet
  async getAdminTokenBalance(adminWallet: WalletData, tokenAddress: string): Promise<number> {
    try {
      console.log('💰 Getting admin token balance...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/wallets/admin/token-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminWallet, tokenAddress }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const result = await response.json();
      console.log('✅ Admin token balance:', result.balance);
      return result.balance;
    } catch (error) {
      console.error('❌ Failed to get admin token balance:', error);
      throw new Error(`Failed to get admin token balance: ${this.getErrorMessage(error)}`);
    }
  }

  // Distribution - Maps to your distributeSol function in utility.ts
  async distributeSol(adminWallet: WalletData, tradingWallets: WalletData[], totalAmount: number): Promise<WalletData[]> {
    try {
      console.log('💸 Distributing SOL to wallets...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(`${this.baseUrl}/distribution/sol`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminWallet, tradingWallets, totalAmount }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const result = await response.json();
      console.log('✅ SOL distributed successfully');
      return Array.isArray(result) ? result : result.successWallets || result;
    } catch (error) {
      console.error('❌ Failed to distribute SOL:', error);
      throw new Error(`Failed to distribute SOL: ${this.getErrorMessage(error)}`);
    }
  }

  // Maps to your distributeTokens function in utility.ts
  async distributeTokens(adminWallet: WalletData, tradingWallets: WalletData[], tokenAddress: string, amountPerWallet: number): Promise<WalletData[]> {
    try {
      console.log('🪙 Distributing tokens to wallets...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(`${this.baseUrl}/distribution/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminWallet, tradingWallets, tokenAddress, amountPerWallet }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const updatedWallets = await response.json();
      console.log('✅ Tokens distributed successfully');
      return updatedWallets;
    } catch (error) {
      console.error('❌ Failed to distribute tokens:', error);
      throw new Error(`Failed to distribute tokens: ${this.getErrorMessage(error)}`);
    }
  }

  // Trading - Maps to your dynamicTrade function in dynamicTrade.ts
  async startTrading(strategy: string, sessionData: SessionData): Promise<void> {
    try {
      console.log('🚀 Starting trading with strategy:', strategy);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${this.baseUrl}/trading/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy, sessionData }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      console.log('✅ Trading started successfully');
    } catch (error) {
      console.error('❌ Failed to start trading:', error);
      throw new Error(`Failed to start trading: ${this.getErrorMessage(error)}`);
    }
  }

  async pauseTrading(): Promise<void> {
    try {
      console.log('⏸️ Pausing trading...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/trading/pause`, {
        method: 'POST',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      console.log('✅ Trading paused');
    } catch (error) {
      console.error('❌ Failed to pause trading:', error);
      throw new Error(`Failed to pause trading: ${this.getErrorMessage(error)}`);
    }
  }

  async resumeTrading(): Promise<void> {
    try {
      console.log('▶️ Resuming trading...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/trading/resume`, {
        method: 'POST',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      console.log('✅ Trading resumed');
    } catch (error) {
      console.error('❌ Failed to resume trading:', error);
      throw new Error(`Failed to resume trading: ${this.getErrorMessage(error)}`);
    }
  }

  async stopTrading(): Promise<void> {
    try {
      console.log('⏹️ Stopping trading...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/trading/stop`, {
        method: 'POST',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      console.log('✅ Trading stopped');
    } catch (error) {
      console.error('❌ Failed to stop trading:', error);
      throw new Error(`Failed to stop trading: ${this.getErrorMessage(error)}`);
    }
  }

  // Restart Points - Maps to your index.ts restart options (1-6)
  async restartFromPoint(point: number, sessionData: SessionData): Promise<void> {
    try {
      console.log('🔄 Restarting from point:', point);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      
      const response = await fetch(`${this.baseUrl}/restart/${point}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionData }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      console.log('✅ Restart initiated successfully');
    } catch (error) {
      console.error('❌ Failed to restart from point:', error);
      throw new Error(`Failed to restart from point: ${this.getErrorMessage(error)}`);
    }
  }

  // Cleanup - Maps to your closeTokenAccountsAndSendBalance function in addedOptions.ts
  async closeTokenAccountsAndSendBalance(sessionData: SessionData): Promise<void> {
    try {
      console.log('🧹 Closing token accounts...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(`${this.baseUrl}/cleanup/close-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionData }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      console.log('✅ Token accounts closed successfully');
    } catch (error) {
      console.error('❌ Failed to close token accounts:', error);
      throw new Error(`Failed to close token accounts: ${this.getErrorMessage(error)}`);
    }
  }

  // Environment File Generation - Maps to your updateEnvFile function in utility.ts
  async generateEnvFile(sessionData: SessionData): Promise<string> {
    try {
      console.log('📄 Generating environment file...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/sessions/export-env`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionData }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const envContent = await response.text();
      console.log('✅ Environment file generated');
      return envContent;
    } catch (error) {
      console.error('❌ Failed to generate env file:', error);
      throw new Error(`Failed to generate env file: ${this.getErrorMessage(error)}`);
    }
  }

  // Configuration Management
  async saveSwapConfig(config: any): Promise<void> {
    try {
      console.log('💾 Saving swap configuration...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/config/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      console.log('✅ Swap configuration saved');
    } catch (error) {
      console.error('❌ Failed to save swap configuration:', error);
      throw new Error(`Failed to save swap configuration: ${this.getErrorMessage(error)}`);
    }
  }

  async getSwapConfig(): Promise<any> {
    try {
      console.log('🔍 Getting swap configuration...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/config/swap`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const config = await response.json();
      console.log('✅ Swap configuration retrieved');
      return config;
    } catch (error) {
      console.error('❌ Failed to get swap configuration:', error);
      throw new Error(`Failed to get swap configuration: ${this.getErrorMessage(error)}`);
    }
  }

  async testRpcConnection(rpcUrl: string): Promise<{ success: boolean, latency: number }> {
    try {
      console.log('🔍 Testing RPC connection:', rpcUrl);
      const startTime = Date.now();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${this.baseUrl}/config/test-rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rpcUrl }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ RPC connection test successful:', result);
        return { success: result.success, latency };
      } else {
        console.error('❌ RPC connection test failed');
        return { success: false, latency };
      }
    } catch (error) {
      console.error('❌ RPC connection test failed:', error);
      return { success: false, latency: 0 };
    }
  }

  // Health check
  async checkHealth(): Promise<{ status: string; timestamp: string; tradingActive: boolean }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      return await response.json();
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw new Error(`Health check failed: ${this.getErrorMessage(error)}`);
    }
  }
}

export const backendService = new BackendService()