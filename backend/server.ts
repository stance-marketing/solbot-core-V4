import express from 'express';
import cors from 'cors';
import { Connection, PublicKey } from '@solana/web3.js';
import { getPoolKeysForTokenAddress, getMarketIdForTokenAddress } from '../pool-keys';
import { swapConfig } from '../swapConfig';
import { 
  getSolBalance, 
  distributeSol, 
  distributeTokens, 
  saveSession, 
  loadSession, 
  appendWalletsToSession,
  createWalletWithNumber,
  getOrCreateAssociatedTokenAccount
} from '../utility';
import { dynamicTrade } from '../dynamicTrade';
import { closeTokenAccountsAndSendBalance } from '../addedOptions';
import { getTokenBalance } from '../startTrading';
import RaydiumSwap from '../RaydiumSwap';
import WalletWithNumber from '../wallet';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Solana connection
const connection = new Connection(swapConfig.RPC_URL, 'confirmed');

// Global trading flag for session management
const globalTradingFlags = new Map<string, { value: boolean }>();

// Session Management Routes
app.get('/api/sessions', async (req, res) => {
  try {
    const sessionDir = swapConfig.SESSION_DIR;
    await fs.promises.mkdir(sessionDir, { recursive: true });
    
    const files = await fs.promises.readdir(sessionDir);
    const sessionFiles = files.filter(file => file.endsWith('_session.json'));
    
    const sessionData = await Promise.all(
      sessionFiles.map(async (filename) => {
        const filePath = path.join(sessionDir, filename);
        const stats = await fs.promises.stat(filePath);
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const session = JSON.parse(content);
        
        return {
          filename,
          tokenName: session.tokenName,
          timestamp: session.timestamp,
          walletCount: session.wallets.length,
          size: stats.size,
          lastModified: stats.mtime
        };
      })
    );
    
    res.json(sessionData);
  } catch (error) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

app.get('/api/sessions/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const sessionData = await loadSession(filename);
    
    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(sessionData);
  } catch (error) {
    console.error('Error loading session:', error);
    res.status(500).json({ error: 'Failed to load session' });
  }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const { sessionData, filename } = req.body;
    
    const adminWallet = createWalletWithNumber(sessionData.admin.privateKey, sessionData.admin.number);
    const tradingWallets = sessionData.wallets.map((w: any) => 
      createWalletWithNumber(w.privateKey, w.number)
    );
    
    const success = await saveSession(
      adminWallet,
      tradingWallets,
      swapConfig.SESSION_DIR,
      sessionData.tokenName,
      sessionData.timestamp,
      sessionData.tokenAddress,
      sessionData.poolKeys,
      filename || `${sessionData.tokenName}_${sessionData.timestamp}_session.json`
    );
    
    if (success) {
      res.json({ success: true, filename });
    } else {
      res.status(500).json({ error: 'Failed to save session' });
    }
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

app.delete('/api/sessions/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(swapConfig.SESSION_DIR, filename);
    
    await fs.promises.unlink(filePath);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Token Validation Routes
app.post('/api/token/validate', async (req, res) => {
  try {
    const { tokenAddress } = req.body;
    
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    const data = await response.json();
    
    if (data.pairs && data.pairs.length > 0) {
      const pair = data.pairs[0];
      res.json({
        isValid: true,
        tokenData: {
          name: pair.baseToken.name,
          symbol: pair.baseToken.symbol,
          price: pair.priceUsd,
          volume24h: pair.volume.h24,
          priceChange24h: pair.priceChange.h24
        }
      });
    } else {
      res.json({ isValid: false });
    }
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({ error: 'Failed to validate token' });
  }
});

app.post('/api/token/pool-keys', async (req, res) => {
  try {
    const { tokenAddress } = req.body;
    
    const marketId = await getMarketIdForTokenAddress(connection, tokenAddress);
    if (!marketId) {
      return res.status(404).json({ error: 'Market ID not found' });
    }
    
    const poolKeys = await getPoolKeysForTokenAddress(connection, tokenAddress);
    if (!poolKeys) {
      return res.status(404).json({ error: 'Pool keys not found' });
    }
    
    res.json({ poolKeys, marketId: marketId.toString() });
  } catch (error) {
    console.error('Error fetching pool keys:', error);
    res.status(500).json({ error: 'Failed to fetch pool keys' });
  }
});

// Wallet Operations Routes
app.post('/api/wallets/generate', async (req, res) => {
  try {
    const { count } = req.body;
    
    const wallets = Array.from({ length: count }, () => new WalletWithNumber());
    
    const walletData = wallets.map(wallet => ({
      number: wallet.number,
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey,
      solBalance: 0,
      tokenBalance: 0,
      isActive: false,
      generationTimestamp: new Date().toISOString()
    }));
    
    res.json(walletData);
  } catch (error) {
    console.error('Error generating wallets:', error);
    res.status(500).json({ error: 'Failed to generate wallets' });
  }
});

app.post('/api/wallets/admin', async (req, res) => {
  try {
    const { option, privateKey } = req.body;
    
    let adminWallet: WalletWithNumber;
    
    if (option === 'import' && privateKey) {
      adminWallet = createWalletWithNumber(privateKey, 0);
    } else {
      adminWallet = new WalletWithNumber();
    }
    
    const walletData = {
      number: adminWallet.number,
      publicKey: adminWallet.publicKey,
      privateKey: adminWallet.privateKey,
      solBalance: 0,
      tokenBalance: 0,
      isActive: true
    };
    
    res.json(walletData);
  } catch (error) {
    console.error('Error creating admin wallet:', error);
    res.status(500).json({ error: 'Failed to create admin wallet' });
  }
});

app.post('/api/wallets/balances', async (req, res) => {
  try {
    const { wallets, tokenAddress } = req.body;
    
    const balances = await Promise.all(
      wallets.map(async (walletData: any) => {
        const wallet = createWalletWithNumber(walletData.privateKey, walletData.number);
        const solBalance = await getSolBalance(wallet, connection);
        
        let tokenBalance = 0;
        if (tokenAddress) {
          const raydiumSwap = new RaydiumSwap(swapConfig.RPC_URL, wallet.privateKey);
          tokenBalance = await getTokenBalance(raydiumSwap, tokenAddress);
        }
        
        return {
          ...walletData,
          solBalance,
          tokenBalance,
          lastActivity: Date.now()
        };
      })
    );
    
    res.json(balances);
  } catch (error) {
    console.error('Error fetching balances:', error);
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

// Distribution Routes
app.post('/api/distribution/sol', async (req, res) => {
  try {
    const { adminWallet, tradingWallets, totalAmount } = req.body;
    
    const admin = createWalletWithNumber(adminWallet.privateKey, adminWallet.number);
    const wallets = tradingWallets.map((w: any) => createWalletWithNumber(w.privateKey, w.number));
    
    const result = await distributeSol(admin, wallets, totalAmount, connection);
    
    res.json({
      success: true,
      successWallets: result.successWallets.map(w => ({
        number: w.number,
        publicKey: w.publicKey,
        privateKey: w.privateKey,
        solBalance: totalAmount / wallets.length,
        tokenBalance: 0,
        isActive: true
      }))
    });
  } catch (error) {
    console.error('Error distributing SOL:', error);
    res.status(500).json({ error: 'Failed to distribute SOL' });
  }
});

app.post('/api/distribution/tokens', async (req, res) => {
  try {
    const { adminWallet, tradingWallets, tokenAddress, totalAmount, decimals } = req.body;
    
    const admin = createWalletWithNumber(adminWallet.privateKey, adminWallet.number);
    const wallets = tradingWallets.map((w: any) => createWalletWithNumber(w.privateKey, w.number));
    
    await distributeTokens(
      admin,
      new PublicKey(admin.publicKey),
      wallets,
      new PublicKey(tokenAddress),
      totalAmount,
      decimals,
      connection
    );
    
    const amountPerWallet = totalAmount / wallets.length;
    const updatedWallets = wallets.map(w => ({
      number: w.number,
      publicKey: w.publicKey,
      privateKey: w.privateKey,
      solBalance: 0, // This would need to be fetched
      tokenBalance: amountPerWallet,
      isActive: true
    }));
    
    res.json({ success: true, wallets: updatedWallets });
  } catch (error) {
    console.error('Error distributing tokens:', error);
    res.status(500).json({ error: 'Failed to distribute tokens' });
  }
});

// Trading Routes
app.post('/api/trading/start', async (req, res) => {
  try {
    const { adminWallet, tradingWallets, tokenAddress, strategy, sessionTimestamp, tokenName } = req.body;
    
    const admin = createWalletWithNumber(adminWallet.privateKey, adminWallet.number);
    const wallets = tradingWallets.map((w: any) => createWalletWithNumber(w.privateKey, w.number));
    
    const sessionId = `${tokenName}_${sessionTimestamp}`;
    const globalTradingFlag = { value: true };
    globalTradingFlags.set(sessionId, globalTradingFlag);
    
    // Start trading in background
    dynamicTrade(
      admin,
      wallets,
      tokenAddress,
      strategy,
      connection,
      sessionTimestamp,
      tokenName,
      globalTradingFlag
    ).catch(error => {
      console.error('Trading error:', error);
    });
    
    res.json({ success: true, sessionId });
  } catch (error) {
    console.error('Error starting trading:', error);
    res.status(500).json({ error: 'Failed to start trading' });
  }
});

app.post('/api/trading/stop', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    const globalTradingFlag = globalTradingFlags.get(sessionId);
    if (globalTradingFlag) {
      globalTradingFlag.value = false;
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Trading session not found' });
    }
  } catch (error) {
    console.error('Error stopping trading:', error);
    res.status(500).json({ error: 'Failed to stop trading' });
  }
});

// Restart Routes
app.post('/api/sessions/restart', async (req, res) => {
  try {
    const { filename, restartPoint, sessionData } = req.body;
    
    // Implementation would depend on the specific restart point
    // This is a placeholder for the restart functionality
    
    res.json({ success: true, message: `Restarting from point ${restartPoint}` });
  } catch (error) {
    console.error('Error restarting session:', error);
    res.status(500).json({ error: 'Failed to restart session' });
  }
});

// Cleanup Routes
app.post('/api/cleanup/close-accounts', async (req, res) => {
  try {
    const { adminWallet, tradingWallets, tokenAddress } = req.body;
    
    const admin = createWalletWithNumber(adminWallet.privateKey, adminWallet.number);
    const wallets = tradingWallets.map((w: any) => createWalletWithNumber(w.privateKey, w.number));
    
    await closeTokenAccountsAndSendBalance(admin, wallets, tokenAddress, connection);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error closing accounts:', error);
    res.status(500).json({ error: 'Failed to close accounts' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});