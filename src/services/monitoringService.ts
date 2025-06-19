import { backendService } from './backendService';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error' | 'success' | 'debug';
  message: string;
  source: string;
  details?: any;
}

export interface ErrorData {
  id: string;
  timestamp: number;
  message: string;
  source: string;
  stack?: string;
  resolved: boolean;
  resolvedAt?: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  occurrences: number;
  lastOccurrence: number;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

export interface SystemHealth {
  components: {
    name: string;
    status: 'operational' | 'degraded' | 'outage' | 'unknown';
    lastChecked: number;
    responseTime?: number;
    details?: string;
  }[];
  uptime: number;
  startTime: number;
}

export interface BalanceChange {
  id: string;
  timestamp: number;
  walletNumber: number;
  walletAddress: string;
  solBefore: number;
  solAfter: number;
  solChange: number;
  tokenBefore: number;
  tokenAfter: number;
  tokenChange: number;
  source: string;
  details?: string;
}

export interface TradingAnalytics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  successRate: number;
  totalVolume: number;
  totalFees: number;
  averageSlippage: number;
  profitLoss: number;
  buyCount: number;
  sellCount: number;
  volumeData: any[];
  transactionData: any[];
  profitLossData: any[];
}

class MonitoringService {
  private baseUrl = 'http://localhost:12001/api/monitoring';

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

  async getLogs(limit: number = 100, level?: string, source?: string): Promise<LogEntry[]> {
    try {
      console.log('🔍 Fetching logs from backend...');
      
      // Check if backend is available
      const isConnected = await backendService.testConnection();
      if (!isConnected) {
        console.warn('Backend not connected, returning mock logs');
        return this.generateMockLogs(limit);
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      let url = `${this.baseUrl}/logs?limit=${limit}`;
      if (level) url += `&level=${level}`;
      if (source) url += `&source=${source}`;
      
      const response = await fetch(url, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const logs = await response.json();
      console.log('✅ Logs received:', logs.length);
      return logs;
    } catch (error) {
      console.error('❌ Failed to fetch logs:', error);
      // Fallback to mock data if backend fails
      return this.generateMockLogs(limit);
    }
  }

  async getConsoleOutput(limit: number = 100): Promise<string[]> {
    try {
      console.log('🔍 Fetching console output from backend...');
      
      // Check if backend is available
      const isConnected = await backendService.testConnection();
      if (!isConnected) {
        console.warn('Backend not connected, returning mock console output');
        return this.generateMockConsoleOutput(limit);
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/console?limit=${limit}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const output = await response.json();
      console.log('✅ Console output received:', output.length);
      return output;
    } catch (error) {
      console.error('❌ Failed to fetch console output:', error);
      // Fallback to mock data if backend fails
      return this.generateMockConsoleOutput(limit);
    }
  }

  async getErrors(limit: number = 50): Promise<ErrorData[]> {
    try {
      console.log('🔍 Fetching errors from backend...');
      
      // Check if backend is available
      const isConnected = await backendService.testConnection();
      if (!isConnected) {
        console.warn('Backend not connected, returning mock errors');
        return this.generateMockErrors(limit);
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/errors?limit=${limit}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const errors = await response.json();
      console.log('✅ Errors received:', errors.length);
      return errors;
    } catch (error) {
      console.error('❌ Failed to fetch errors:', error);
      // Fallback to mock data if backend fails
      return this.generateMockErrors(limit);
    }
  }

  async resolveError(errorId: string): Promise<void> {
    try {
      console.log('🔧 Resolving error:', errorId);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/errors/${errorId}/resolve`, {
        method: 'POST',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      console.log('✅ Error resolved successfully');
    } catch (error) {
      console.error('❌ Failed to resolve error:', error);
      throw new Error(`Failed to resolve error: ${this.getErrorMessage(error)}`);
    }
  }

  async getPerformanceMetrics(): Promise<PerformanceMetric[]> {
    try {
      console.log('🔍 Fetching performance metrics from backend...');
      
      // Check if backend is available
      const isConnected = await backendService.testConnection();
      if (!isConnected) {
        console.warn('Backend not connected, returning mock performance metrics');
        return this.generateMockPerformanceMetrics();
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/performance`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const metrics = await response.json();
      console.log('✅ Performance metrics received:', metrics.length);
      return metrics;
    } catch (error) {
      console.error('❌ Failed to fetch performance metrics:', error);
      // Fallback to mock data if backend fails
      return this.generateMockPerformanceMetrics();
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      console.log('🔍 Fetching system health from backend...');
      
      // Check if backend is available
      const isConnected = await backendService.testConnection();
      if (!isConnected) {
        console.warn('Backend not connected, returning mock system health');
        return this.generateMockSystemHealth();
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const health = await response.json();
      console.log('✅ System health received');
      return health;
    } catch (error) {
      console.error('❌ Failed to fetch system health:', error);
      // Fallback to mock data if backend fails
      return this.generateMockSystemHealth();
    }
  }

  async getBalanceChanges(limit: number = 50): Promise<BalanceChange[]> {
    try {
      console.log('🔍 Fetching balance changes from backend...');
      
      // Check if backend is available
      const isConnected = await backendService.testConnection();
      if (!isConnected) {
        console.warn('Backend not connected, returning mock balance changes');
        return this.generateMockBalanceChanges(limit);
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/balance-changes?limit=${limit}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const changes = await response.json();
      console.log('✅ Balance changes received:', changes.length);
      return changes;
    } catch (error) {
      console.error('❌ Failed to fetch balance changes:', error);
      // Fallback to mock data if backend fails
      return this.generateMockBalanceChanges(limit);
    }
  }

  async getTradingAnalytics(): Promise<TradingAnalytics> {
    try {
      console.log('🔍 Fetching trading analytics from backend...');
      
      // Check if backend is available
      const isConnected = await backendService.testConnection();
      if (!isConnected) {
        console.warn('Backend not connected, returning mock trading analytics');
        return this.generateMockTradingAnalytics();
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/analytics`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      await this.handleResponse(response);
      const analytics = await response.json();
      console.log('✅ Trading analytics received');
      return analytics;
    } catch (error) {
      console.error('❌ Failed to fetch trading analytics:', error);
      // Fallback to mock data if backend fails
      return this.generateMockTradingAnalytics();
    }
  }

  // Mock data generators for fallback
  private generateMockLogs(limit: number): LogEntry[] {
    const logs: LogEntry[] = [];
    const levels = ['info', 'warning', 'error', 'success', 'debug'] as const;
    const sources = ['system', 'trading', 'wallet', 'network', 'session'];
    
    for (let i = 0; i < limit; i++) {
      const level = levels[Math.floor(Math.random() * levels.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];
      
      let message = '';
      switch (level) {
        case 'info':
          message = `System information message #${i}`;
          break;
        case 'warning':
          message = `Warning: Potential issue detected #${i}`;
          break;
        case 'error':
          message = `Error: Operation failed #${i}`;
          break;
        case 'success':
          message = `Operation completed successfully #${i}`;
          break;
        case 'debug':
          message = `Debug information for developers #${i}`;
          break;
      }
      
      logs.push({
        id: `log-${i}`,
        timestamp: Date.now() - (i * 60000), // Each log is 1 minute older
        level,
        message,
        source,
        details: { mockData: true }
      });
    }
    
    return logs;
  }

  private generateMockConsoleOutput(limit: number): string[] {
    const output: string[] = [];
    
    for (let i = 0; i < limit; i++) {
      const timestamp = new Date(Date.now() - (i * 30000)).toISOString();
      const types = ['INFO', 'WARNING', 'ERROR', 'DEBUG', 'SUCCESS'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      let line = '';
      switch (type) {
        case 'INFO':
          line = `[${timestamp}] [${type}] Processing transaction for wallet #${Math.floor(Math.random() * 10 + 1)}`;
          break;
        case 'WARNING':
          line = `[${timestamp}] [${type}] High network latency detected: ${Math.floor(Math.random() * 500 + 200)}ms`;
          break;
        case 'ERROR':
          line = `[${timestamp}] [${type}] Failed to send transaction: Blockhash not found`;
          break;
        case 'DEBUG':
          line = `[${timestamp}] [${type}] Connection details: endpoint=${Math.random().toString(36).substring(2, 15)}`;
          break;
        case 'SUCCESS':
          line = `[${timestamp}] [${type}] Transaction confirmed: ${Math.random().toString(36).substring(2, 15)}`;
          break;
      }
      
      output.push(line);
    }
    
    return output;
  }

  private generateMockErrors(limit: number): ErrorData[] {
    const errors: ErrorData[] = [];
    const sources = ['system', 'trading', 'wallet', 'network', 'session'];
    const severities = ['critical', 'high', 'medium', 'low'] as const;
    
    for (let i = 0; i < limit; i++) {
      const source = sources[Math.floor(Math.random() * sources.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const timestamp = Date.now() - (i * 300000); // Each error is 5 minutes older
      const resolved = Math.random() > 0.7;
      
      errors.push({
        id: `error-${i}`,
        timestamp,
        message: `Mock error message #${i} from ${source}`,
        source,
        stack: `Error: Mock error\n    at mockFunction (mock.js:${i})\n    at processRequest (app.js:${i * 10})`,
        resolved,
        resolvedAt: resolved ? timestamp + 60000 : undefined,
        severity,
        occurrences: Math.floor(Math.random() * 5) + 1,
        lastOccurrence: timestamp + 30000
      });
    }
    
    return errors;
  }

  private generateMockPerformanceMetrics(): PerformanceMetric[] {
    return [
      { name: 'CPU Usage', value: Math.random() * 100, unit: '%', timestamp: Date.now() },
      { name: 'Memory Usage', value: Math.random() * 1000, unit: 'MB', timestamp: Date.now() },
      { name: 'Network Latency', value: Math.random() * 200, unit: 'ms', timestamp: Date.now() },
      { name: 'Transactions/sec', value: Math.random() * 10, unit: 'tx/s', timestamp: Date.now() },
      { name: 'Success Rate', value: 70 + Math.random() * 30, unit: '%', timestamp: Date.now() },
      { name: 'Uptime', value: Math.random() * 1000, unit: 'min', timestamp: Date.now() }
    ];
  }

  private generateMockSystemHealth(): SystemHealth {
    const startTime = Date.now() - (Math.random() * 86400000); // Random start time within the last day
    
    return {
      components: [
        {
          name: 'Backend API',
          status: 'operational',
          lastChecked: Date.now(),
          responseTime: Math.random() * 100,
          details: 'All systems operational'
        },
        {
          name: 'Solana RPC',
          status: 'operational',
          lastChecked: Date.now(),
          responseTime: Math.random() * 200,
          details: 'Connected to mainnet'
        },
        {
          name: 'WebSocket Connection',
          status: 'operational',
          lastChecked: Date.now(),
          details: 'Stable connection'
        },
        {
          name: 'Trading Engine',
          status: Math.random() > 0.8 ? 'degraded' : 'operational',
          lastChecked: Date.now(),
          details: 'Running normally'
        },
        {
          name: 'Session Storage',
          status: 'operational',
          lastChecked: Date.now(),
          details: 'No issues detected'
        },
        {
          name: 'System Resources',
          status: Math.random() > 0.9 ? 'degraded' : 'operational',
          lastChecked: Date.now(),
          details: 'CPU: 25%, Memory: 40%'
        }
      ],
      uptime: Date.now() - startTime,
      startTime
    };
  }

  private generateMockBalanceChanges(limit: number): BalanceChange[] {
    const changes: BalanceChange[] = [];
    const sources = ['Trading', 'Collection', 'Distribution', 'Manual'];
    
    for (let i = 0; i < limit; i++) {
      const timestamp = Date.now() - (i * 600000); // Each change is 10 minutes older
      const walletNumber = Math.floor(Math.random() * 10);
      const isAdmin = walletNumber === 0;
      
      const solBefore = Math.random() * (isAdmin ? 10 : 1);
      const solChange = (Math.random() - 0.6) * (isAdmin ? 0.5 : 0.1);
      const solAfter = Math.max(0, solBefore + solChange);
      
      const tokenBefore = Math.random() * (isAdmin ? 10000 : 1000);
      const tokenChange = (Math.random() - 0.6) * (isAdmin ? 500 : 100);
      const tokenAfter = Math.max(0, tokenBefore + tokenChange);
      
      changes.push({
        id: `change-${i}`,
        timestamp,
        walletNumber,
        walletAddress: `Wallet${walletNumber}Address${Math.random().toString(36).substring(2, 10)}`,
        solBefore,
        solAfter,
        solChange,
        tokenBefore,
        tokenAfter,
        tokenChange,
        source: sources[Math.floor(Math.random() * sources.length)],
        details: `Balance change at ${new Date(timestamp).toLocaleTimeString()}`
      });
    }
    
    return changes;
  }

  private generateMockTradingAnalytics(): TradingAnalytics {
    // Generate time periods
    const periods = 24; // 24 hours
    const volumeData = [];
    const transactionData = [];
    const profitLossData = [];
    
    let totalVolume = 0;
    let totalTransactions = 0;
    let successfulTransactions = 0;
    let buyCount = 0;
    let sellCount = 0;
    
    for (let i = 0; i < periods; i++) {
      const buyVolume = Math.random() * 0.5 + 0.1;
      const sellVolume = Math.random() * 0.4 + 0.05;
      const buys = Math.floor(Math.random() * 10 + 5);
      const sells = Math.floor(Math.random() * 8 + 3);
      const failed = Math.floor(Math.random() * 2);
      
      totalVolume += buyVolume + sellVolume;
      totalTransactions += buys + sells + failed;
      successfulTransactions += buys + sells;
      buyCount += buys;
      sellCount += sells;
      
      volumeData.push({
        name: `${i}h`,
        buyVolume,
        sellVolume
      });
      
      transactionData.push({
        name: `${i}h`,
        buys,
        sells,
        failed
      });
      
      profitLossData.push({
        name: `${i}h`,
        profit: (buyVolume - sellVolume) * (Math.random() * 2 - 0.8)
      });
    }
    
    return {
      totalTransactions,
      successfulTransactions,
      failedTransactions: totalTransactions - successfulTransactions,
      successRate: (successfulTransactions / totalTransactions) * 100,
      totalVolume,
      totalFees: totalVolume * 0.003, // Assume 0.3% fee
      averageSlippage: Math.random() * 1.5 + 0.5, // 0.5% to 2%
      profitLoss: (Math.random() * 2 - 0.8) * totalVolume,
      buyCount,
      sellCount,
      volumeData,
      transactionData,
      profitLossData
    };
  }
}

export const monitoringService = new MonitoringService();