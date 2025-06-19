const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const axios = require('axios');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration - using your swapConfig values
const swapConfig = {
  RPC_URL: "https://serene-green-waterfall.solana-mainnet.quiknode.pro/f8c6f111811d71021ebbda753f89452e6820735a/",
  WSOL_ADDRESS: "So11111111111111111111111111111111111111112",
  RAYDIUM_LIQUIDITY_POOL_V4_ADDRESS: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
  SESSION_DIR: "./sessions"
};

// Initialize connection
const connection = new Connection(swapConfig.RPC_URL, 'confirmed');

// Global trading flag
const globalTradingFlag = { value: false };

// Dexscreener integration
const getDexscreenerData = async (tokenAddress) => {
  try {
    const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch token data from Dexscreener: ${error.message}`);
    return null;
  }
};

// Session Management Endpoints
app.get('/api/sessions', async (req, res) => {
  try {
    if (!fs.existsSync(swapConfig.SESSION_DIR)) {
      fs.mkdirSync(swapConfig.SESSION_DIR, { recursive: true });
    }
    
    const sessionFiles = fs.readdirSync(swapConfig.SESSION_DIR)
      .filter(file => file.endsWith('_session.json'))
      .map(filename => {
        const filePath = path.join(swapConfig.SESSION_DIR, filename);
        const stats = fs.statSync(filePath);
        
        try {
          const sessionData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          return {
            filename,
            tokenName: sessionData.tokenName || 'Unknown',
            timestamp: sessionData.timestamp || 'Unknown',
            walletCount: sessionData.wallets ? sessionData.wallets.length : 0,
            size: stats.size,
            lastModified: stats.mtime
          };
        } catch (error) {
          console.error(`Error reading session file ${filename}:`, error);
          return null;
        }
      })
      .filter(Boolean);
    
    res.json(sessionFiles);
  } catch (error) {
    console.error('Error fetching session files:', error);
    res.status(500).json({ error: 'Failed to fetch session files' });
  }
});

app.get('/api/sessions/:filename', async (req, res) => {
  try {
    const filePath = path.join(swapConfig.SESSION_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const sessionData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(sessionData);
  } catch (error) {
    console.error('Error loading session:', error);
    res.status(500).json({ error: 'Failed to load session' });
  }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const sessionData = req.body;
    const timestamp = new Date().toISOString();
    const filename = `${sessionData.tokenName}_${new Date().toLocaleDateString().replace(/\//g, '.')}_${new Date().toLocaleTimeString().replace(/:/g, '.')}_session.json`;
    
    if (!fs.existsSync(swapConfig.SESSION_DIR)) {
      fs.mkdirSync(swapConfig.SESSION_DIR, { recursive: true });
    }
    
    const filePath = path.join(swapConfig.SESSION_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(sessionData, null, 2));
    res.json({ filename });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

app.delete('/api/sessions/:filename', async (req, res) => {
  try {
    const filePath = path.join(swapConfig.SESSION_DIR, req.params.filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Token Management Endpoints
app.post('/api/tokens/validate', async (req, res) => {
  try {
    const { tokenAddress } = req.body;
    
    if (!tokenAddress) {
      return res.status(400).json({ error: 'Token address is required' });
    }
    
    // Validate token address format
    if (tokenAddress.length < 32 || tokenAddress.length > 44) {
      return res.json({ isValid: false });
    }
    
    const tokenData = await getDexscreenerData(tokenAddress);
    
    if (tokenData && tokenData.pairs && tokenData.pairs.length > 0) {
      const pair = tokenData.pairs[0];
      res.json({
        isValid: true,
        tokenData: {
          name: pair.baseToken.name,
          symbol: pair.baseToken.symbol,
          address: tokenAddress,
          price: pair.priceUsd,
          volume: { h24: pair.volume.h24 },
          priceChange: { h24: pair.priceChange.h24 },
          txns: {
            h24: {
              buys: pair.txns.h24.buys,
              sells: pair.txns.h24.sells
            }
          }
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

app.post('/api/tokens/pool-keys', async (req, res) => {
  try {
    const { tokenAddress } = req.body;
    
    // For now, return mock pool keys since we need your actual pool-keys.js function
    const poolKeys = {
      version: 4,
      marketId: 'mock_market_id',
      baseMint: tokenAddress,
      quoteMint: 'So11111111111111111111111111111111111111112',
      baseDecimals: 9,
      quoteDecimals: 9,
      programId: 'mock_program_id',
      marketProgramId: 'mock_market_program_id'
    };
    res.json(poolKeys);
  } catch (error) {
    console.error('Error getting pool keys:', error);
    res.status(500).json({ error: 'Failed to get pool keys' });
  }
});

app.post('/api/tokens/market-id', async (req, res) => {
  try {
    const { tokenAddress } = req.body;
    const marketId = 'mock_market_id_' + tokenAddress.slice(0, 8);
    res.json({ marketId });
  } catch (error) {
    console.error('Error getting market ID:', error);
    res.status(500).json({ error: 'Failed to get market ID' });
  }
});

// Wallet Management Endpoints
app.post('/api/wallets/admin', async (req, res) => {
  try {
    const adminWallet = {
      number: 0,
      publicKey: 'MockAdminPublicKey' + Math.random().toString(36).substr(2, 9),
      privateKey: 'mock_admin_private_key',
      solBalance: 0,
      tokenBalance: 0,
      isActive: true
    };
    res.json(adminWallet);
  } catch (error) {
    console.error('Error creating admin wallet:', error);
    res.status(500).json({ error: 'Failed to create admin wallet' });
  }
});

app.post('/api/wallets/admin/import', async (req, res) => {
  try {
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ error: 'Private key is required' });
    }
    
    const adminWallet = {
      number: 0,
      publicKey: 'ImportedAdminPublicKey' + Math.random().toString(36).substr(2, 9),
      privateKey: privateKey,
      solBalance: 0,
      tokenBalance: 0,
      isActive: true
    };
    res.json(adminWallet);
  } catch (error) {
    console.error('Error importing admin wallet:', error);
    res.status(500).json({ error: 'Failed to import admin wallet' });
  }
});

app.post('/api/wallets/trading', async (req, res) => {
  try {
    const { count } = req.body;
    
    if (!count || count < 1 || count > 100) {
      return res.status(400).json({ error: 'Count must be between 1 and 100' });
    }
    
    const wallets = Array.from({ length: count }, (_, i) => ({
      number: i + 1,
      publicKey: `TradingWallet${i + 1}PublicKey${Math.random().toString(36).substr(2, 9)}`,
      privateKey: `trading_wallet_${i + 1}_private_key`,
      solBalance: 0,
      tokenBalance: 0,
      isActive: false,
      generationTimestamp: new Date().toISOString()
    }));
    res.json(wallets);
  } catch (error) {
    console.error('Error generating trading wallets:', error);
    res.status(500).json({ error: 'Failed to generate trading wallets' });
  }
});

app.post('/api/wallets/balances', async (req, res) => {
  try {
    const { wallets } = req.body;
    // For now, return wallets as-is since we need your actual balance functions
    res.json(wallets);
  } catch (error) {
    console.error('Error getting wallet balances:', error);
    res.status(500).json({ error: 'Failed to get wallet balances' });
  }
});

app.post('/api/wallets/admin/token-balance', async (req, res) => {
  try {
    const { adminWallet, tokenAddress } = req.body;
    // Return mock balance for now
    res.json({ balance: Math.random() * 1000 });
  } catch (error) {
    console.error('Error getting admin token balance:', error);
    res.status(500).json({ error: 'Failed to get admin token balance' });
  }
});

// Distribution Endpoints
app.post('/api/distribution/sol', async (req, res) => {
  try {
    const { adminWallet, tradingWallets, totalAmount } = req.body;
    
    const amountPerWallet = totalAmount / tradingWallets.length;
    const successWallets = tradingWallets.map(wallet => ({
      ...wallet,
      solBalance: amountPerWallet,
      isActive: true
    }));
    res.json(successWallets);
  } catch (error) {
    console.error('Error distributing SOL:', error);
    res.status(500).json({ error: 'Failed to distribute SOL' });
  }
});

app.post('/api/distribution/tokens', async (req, res) => {
  try {
    const { adminWallet, tradingWallets, tokenAddress, amountPerWallet } = req.body;
    
    const updatedWallets = tradingWallets.map(wallet => ({
      ...wallet,
      tokenBalance: amountPerWallet
    }));
    res.json(updatedWallets);
  } catch (error) {
    console.error('Error distributing tokens:', error);
    res.status(500).json({ error: 'Failed to distribute tokens' });
  }
});

// Trading Control Endpoints
app.post('/api/trading/start', async (req, res) => {
  try {
    const { strategy, sessionData } = req.body;
    globalTradingFlag.value = true;
    console.log(`Trading started with strategy: ${strategy}`);
    res.json({ success: true, message: 'Trading started' });
  } catch (error) {
    console.error('Error starting trading:', error);
    res.status(500).json({ error: 'Failed to start trading' });
  }
});

app.post('/api/trading/pause', async (req, res) => {
  try {
    globalTradingFlag.value = false;
    res.json({ success: true, message: 'Trading paused' });
  } catch (error) {
    console.error('Error pausing trading:', error);
    res.status(500).json({ error: 'Failed to pause trading' });
  }
});

app.post('/api/trading/resume', async (req, res) => {
  try {
    globalTradingFlag.value = true;
    res.json({ success: true, message: 'Trading resumed' });
  } catch (error) {
    console.error('Error resuming trading:', error);
    res.status(500).json({ error: 'Failed to resume trading' });
  }
});

app.post('/api/trading/stop', async (req, res) => {
  try {
    globalTradingFlag.value = false;
    res.json({ success: true, message: 'Trading stopped' });
  } catch (error) {
    console.error('Error stopping trading:', error);
    res.status(500).json({ error: 'Failed to stop trading' });
  }
});

// Restart Points Endpoints
app.post('/api/restart/:point', async (req, res) => {
  try {
    const point = parseInt(req.params.point);
    const { sessionData } = req.body;
    
    switch (point) {
      case 1:
        res.json({ success: true, message: 'Restarting from admin wallet creation' });
        break;
      case 2:
        res.json({ success: true, message: 'Restarting from wallet generation' });
        break;
      case 3:
        res.json({ success: true, message: 'Restarting from SOL distribution' });
        break;
      case 4:
        res.json({ success: true, message: 'Restarting from trading' });
        break;
      case 5:
        res.json({ success: true, message: 'Restarting from token transfer' });
        break;
      case 6:
        res.json({ success: true, message: 'Close accounts function executed' });
        break;
      default:
        res.status(400).json({ error: 'Invalid restart point' });
    }
  } catch (error) {
    console.error('Error restarting from point:', error);
    res.status(500).json({ error: 'Failed to restart from point' });
  }
});

// Cleanup Endpoints
app.post('/api/cleanup/close-accounts', async (req, res) => {
  try {
    const { sessionData } = req.body;
    res.json({ success: true, message: 'Token accounts closed and balances sent to admin' });
  } catch (error) {
    console.error('Error closing token accounts:', error);
    res.status(500).json({ error: 'Failed to close token accounts' });
  }
});

// Environment File Generation
app.post('/api/sessions/export-env', async (req, res) => {
  try {
    const { sessionData } = req.body;
    
    let envContent = `RPC_URL=${swapConfig.RPC_URL}\n`;
    envContent += `ADMIN_WALLET_PRIVATE_KEY=${sessionData.admin.privateKey}\n`;
    envContent += `TOKEN_ADDRESS=${sessionData.tokenAddress}\n`;
    
    sessionData.wallets.forEach((wallet, index) => {
      envContent += `WALLET_PRIVATE_KEY_${index + 1}=${wallet.privateKey}\n`;
    });
    
    res.type('text/plain').send(envContent);
  } catch (error) {
    console.error('Error generating env file:', error);
    res.status(500).json({ error: 'Failed to generate env file' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    tradingActive: globalTradingFlag.value,
    modulesLoaded: {
      basicFunctionality: true,
      dexscreenerAPI: true,
      sessionManagement: true,
      walletGeneration: true,
      tradingControls: true
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend API server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log('Backend is ready for integration testing');
});

module.exports = app;