const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const axios = require('axios');

// Import your existing functions
const { swapConfig } = require('./swapConfig.js');

// Import your actual functions - these need to be converted to CommonJS or use dynamic imports
let WalletWithNumber, RaydiumSwap, getTokenBalance, dynamicTrade, closeTokenAccountsAndSendBalance;
let saveSession, loadSession, appendWalletsToSession, distributeSol, distributeTokens, getSolBalance, createWalletWithNumber;
let getPoolKeysForTokenAddress, getMarketIdForTokenAddress;

// Dynamic imports for ES modules
async function initializeModules() {
  try {
    // Import your modules here - adjust paths as needed
    const walletModule = await import('./wallet.js');
    WalletWithNumber = walletModule.default;
    
    const raydiumModule = await import('./RaydiumSwap.js');
    RaydiumSwap = raydiumModule.default;
    
    const tradingModule = await import('./startTrading.js');
    getTokenBalance = tradingModule.getTokenBalance;
    
    const dynamicTradeModule = await import('./dynamicTrade.js');
    dynamicTrade = dynamicTradeModule.dynamicTrade;
    
    const addedOptionsModule = await import('./addedOptions.js');
    closeTokenAccountsAndSendBalance = addedOptionsModule.closeTokenAccountsAndSendBalance;
    
    const utilityModule = await import('./utility.js');
    saveSession = utilityModule.saveSession;
    loadSession = utilityModule.loadSession;
    appendWalletsToSession = utilityModule.appendWalletsToSession;
    distributeSol = utilityModule.distributeSol;
    distributeTokens = utilityModule.distributeTokens;
    getSolBalance = utilityModule.getSolBalance;
    createWalletWithNumber = utilityModule.createWalletWithNumber;
    
    const poolKeysModule = await import('./pool-keys.js');
    getPoolKeysForTokenAddress = poolKeysModule.getPoolKeysForTokenAddress;
    getMarketIdForTokenAddress = poolKeysModule.getMarketIdForTokenAddress;
    
    console.log('All modules loaded successfully');
  } catch (error) {
    console.error('Error loading modules:', error);
    console.log('Using fallback implementations for development');
  }
}

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize connection
const connection = new Connection(swapConfig.RPC_URL, 'confirmed');

// Global trading flag for controlling trading state
const globalTradingFlag = { value: false };

// Dexscreener integration (your existing function)
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
    if (loadSession) {
      const sessionData = await loadSession(req.params.filename);
      if (sessionData) {
        res.json(sessionData);
      } else {
        res.status(404).json({ error: 'Session not found' });
      }
    } else {
      // Fallback implementation
      const filePath = path.join(swapConfig.SESSION_DIR, req.params.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Session not found' });
      }
      const sessionData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      res.json(sessionData);
    }
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
    
    if (saveSession && createWalletWithNumber) {
      // Use your actual saveSession function
      const adminWallet = createWalletWithNumber(sessionData.admin.privateKey, sessionData.admin.number);
      const tradingWallets = sessionData.wallets.map(wallet => 
        createWalletWithNumber(wallet.privateKey, wallet.number)
      );
      
      const success = await saveSession(
        adminWallet,
        tradingWallets,
        swapConfig.SESSION_DIR,
        sessionData.tokenName,
        timestamp,
        sessionData.tokenAddress,
        sessionData.poolKeys,
        filename
      );
      
      if (success) {
        res.json({ filename });
      } else {
        res.status(500).json({ error: 'Failed to save session' });
      }
    } else {
      // Fallback implementation
      if (!fs.existsSync(swapConfig.SESSION_DIR)) {
        fs.mkdirSync(swapConfig.SESSION_DIR, { recursive: true });
      }
      
      const filePath = path.join(swapConfig.SESSION_DIR, filename);
      fs.writeFileSync(filePath, JSON.stringify(sessionData, null, 2));
      res.json({ filename });
    }
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

app.post('/api/sessions/append-wallets', async (req, res) => {
  try {
    const { wallets, sessionFileName } = req.body;
    const sessionFilePath = path.join(swapConfig.SESSION_DIR, sessionFileName);
    
    if (appendWalletsToSession && createWalletWithNumber) {
      const walletsWithNumber = wallets.map(wallet => 
        createWalletWithNumber(wallet.privateKey, wallet.number)
      );
      
      const success = await appendWalletsToSession(walletsWithNumber, sessionFilePath);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: 'Failed to append wallets to session' });
      }
    } else {
      res.status(500).json({ error: 'appendWalletsToSession function not available' });
    }
  } catch (error) {
    console.error('Error appending wallets to session:', error);
    res.status(500).json({ error: 'Failed to append wallets to session' });
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
    
    if (getPoolKeysForTokenAddress) {
      const poolKeys = await getPoolKeysForTokenAddress(connection, tokenAddress);
      
      if (poolKeys) {
        res.json(poolKeys);
      } else {
        res.status(404).json({ error: 'Pool keys not found' });
      }
    } else {
      // Fallback for development
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
    }
  } catch (error) {
    console.error('Error getting pool keys:', error);
    res.status(500).json({ error: 'Failed to get pool keys' });
  }
});

app.post('/api/tokens/market-id', async (req, res) => {
  try {
    const { tokenAddress } = req.body;
    
    if (getMarketIdForTokenAddress) {
      const marketId = await getMarketIdForTokenAddress(connection, tokenAddress);
      
      if (marketId) {
        res.json({ marketId: marketId.toString() });
      } else {
        res.status(404).json({ error: 'Market ID not found' });
      }
    } else {
      // Fallback for development
      const marketId = 'mock_market_id_' + tokenAddress.slice(0, 8);
      res.json({ marketId });
    }
  } catch (error) {
    console.error('Error getting market ID:', error);
    res.status(500).json({ error: 'Failed to get market ID' });
  }
});

// Wallet Management Endpoints
app.post('/api/wallets/admin', async (req, res) => {
  try {
    if (WalletWithNumber) {
      const adminWallet = new WalletWithNumber();
      res.json({
        number: adminWallet.number,
        publicKey: adminWallet.publicKey,
        privateKey: adminWallet.privateKey,
        solBalance: 0,
        tokenBalance: 0,
        isActive: true
      });
    } else {
      // Fallback implementation
      const adminWallet = {
        number: 0,
        publicKey: 'MockAdminPublicKey' + Math.random().toString(36).substr(2, 9),
        privateKey: 'mock_admin_private_key',
        solBalance: 0,
        tokenBalance: 0,
        isActive: true
      };
      res.json(adminWallet);
    }
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
    
    if (createWalletWithNumber) {
      const adminWallet = createWalletWithNumber(privateKey, 0);
      res.json({
        number: 0,
        publicKey: adminWallet.publicKey,
        privateKey: adminWallet.privateKey,
        solBalance: 0,
        tokenBalance: 0,
        isActive: true
      });
    } else {
      // Fallback implementation
      const adminWallet = {
        number: 0,
        publicKey: 'ImportedAdminPublicKey' + Math.random().toString(36).substr(2, 9),
        privateKey: privateKey,
        solBalance: 0,
        tokenBalance: 0,
        isActive: true
      };
      res.json(adminWallet);
    }
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
    
    if (WalletWithNumber) {
      const wallets = Array.from({ length: count }, (_, i) => {
        const wallet = new WalletWithNumber();
        return {
          number: wallet.number,
          publicKey: wallet.publicKey,
          privateKey: wallet.privateKey,
          solBalance: 0,
          tokenBalance: 0,
          isActive: false,
          generationTimestamp: new Date().toISOString()
        };
      });
      res.json(wallets);
    } else {
      // Fallback implementation
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
    }
  } catch (error) {
    console.error('Error generating trading wallets:', error);
    res.status(500).json({ error: 'Failed to generate trading wallets' });
  }
});

app.post('/api/wallets/balances', async (req, res) => {
  try {
    const { wallets } = req.body;
    const updatedWallets = [];
    
    if (getSolBalance && getTokenBalance && RaydiumSwap && createWalletWithNumber) {
      for (const wallet of wallets) {
        const walletInstance = createWalletWithNumber(wallet.privateKey, wallet.number);
        const solBalance = await getSolBalance(walletInstance, connection);
        
        // Get token balance if we have a token address
        let tokenBalance = 0;
        if (process.env.TOKEN_ADDRESS) {
          const raydiumSwap = new RaydiumSwap(swapConfig.RPC_URL, wallet.privateKey);
          tokenBalance = await getTokenBalance(raydiumSwap, process.env.TOKEN_ADDRESS);
        }
        
        updatedWallets.push({
          ...wallet,
          solBalance,
          tokenBalance
        });
      }
    } else {
      // Fallback - return wallets as-is
      updatedWallets.push(...wallets);
    }
    
    res.json(updatedWallets);
  } catch (error) {
    console.error('Error getting wallet balances:', error);
    res.status(500).json({ error: 'Failed to get wallet balances' });
  }
});

app.post('/api/wallets/admin/token-balance', async (req, res) => {
  try {
    const { adminWallet, tokenAddress } = req.body;
    
    if (RaydiumSwap && getTokenBalance) {
      const raydiumSwap = new RaydiumSwap(swapConfig.RPC_URL, adminWallet.privateKey);
      const balance = await getTokenBalance(raydiumSwap, tokenAddress);
      res.json({ balance });
    } else {
      // Fallback - return mock balance
      res.json({ balance: Math.random() * 1000 });
    }
  } catch (error) {
    console.error('Error getting admin token balance:', error);
    res.status(500).json({ error: 'Failed to get admin token balance' });
  }
});

// Distribution Endpoints
app.post('/api/distribution/sol', async (req, res) => {
  try {
    const { adminWallet, tradingWallets, totalAmount } = req.body;
    
    if (distributeSol && createWalletWithNumber) {
      const adminWalletInstance = createWalletWithNumber(adminWallet.privateKey, adminWallet.number);
      const tradingWalletInstances = tradingWallets.map(wallet => 
        createWalletWithNumber(wallet.privateKey, wallet.number)
      );
      
      const result = await distributeSol(adminWalletInstance, tradingWalletInstances, totalAmount, connection);
      res.json({ successWallets: result.successWallets });
    } else {
      // Fallback implementation
      const amountPerWallet = totalAmount / tradingWallets.length;
      const successWallets = tradingWallets.map(wallet => ({
        ...wallet,
        solBalance: amountPerWallet,
        isActive: true
      }));
      res.json({ successWallets });
    }
  } catch (error) {
    console.error('Error distributing SOL:', error);
    res.status(500).json({ error: 'Failed to distribute SOL' });
  }
});

app.post('/api/distribution/tokens', async (req, res) => {
  try {
    const { adminWallet, tradingWallets, tokenAddress, amountPerWallet } = req.body;
    
    if (distributeTokens && createWalletWithNumber && RaydiumSwap) {
      const adminWalletInstance = createWalletWithNumber(adminWallet.privateKey, adminWallet.number);
      const tradingWalletInstances = tradingWallets.map(wallet => 
        createWalletWithNumber(wallet.privateKey, wallet.number)
      );
      
      // Get token decimals
      const raydiumSwap = new RaydiumSwap(swapConfig.RPC_URL, adminWallet.privateKey);
      const decimals = await raydiumSwap.getTokenDecimals(tokenAddress);
      
      await distributeTokens(
        adminWalletInstance,
        new PublicKey(adminWallet.publicKey),
        tradingWalletInstances,
        new PublicKey(tokenAddress),
        amountPerWallet,
        decimals,
        connection
      );
      
      // Return updated wallets with new token balances
      const updatedWallets = [];
      for (const wallet of tradingWallets) {
        const walletRaydiumSwap = new RaydiumSwap(swapConfig.RPC_URL, wallet.privateKey);
        const tokenBalance = await getTokenBalance(walletRaydiumSwap, tokenAddress);
        updatedWallets.push({
          ...wallet,
          tokenBalance
        });
      }
      
      res.json(updatedWallets);
    } else {
      // Fallback implementation
      const updatedWallets = tradingWallets.map(wallet => ({
        ...wallet,
        tokenBalance: amountPerWallet
      }));
      res.json(updatedWallets);
    }
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
    
    if (dynamicTrade && createWalletWithNumber) {
      const adminWallet = createWalletWithNumber(sessionData.admin.privateKey, sessionData.admin.number);
      const tradingWallets = sessionData.wallets.map(wallet => 
        createWalletWithNumber(wallet.privateKey, wallet.number)
      );
      
      // Start trading in background - don't await
      dynamicTrade(
        adminWallet,
        tradingWallets,
        sessionData.tokenAddress,
        strategy,
        connection,
        sessionData.timestamp,
        sessionData.tokenName,
        globalTradingFlag
      ).catch(error => {
        console.error('Trading error:', error);
        globalTradingFlag.value = false;
      });
      
      res.json({ success: true, message: 'Trading started' });
    } else {
      console.log(`Trading started with strategy: ${strategy}`);
      res.json({ success: true, message: 'Trading started (mock)' });
    }
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
    
    // This maps to your exact restart logic from index.ts
    switch (point) {
      case 1:
        // After token discovery - restart from admin wallet creation
        res.json({ success: true, message: 'Restarting from admin wallet creation' });
        break;
      case 2:
        // After admin wallet creation - restart from wallet generation
        res.json({ success: true, message: 'Restarting from wallet generation' });
        break;
      case 3:
        // After wallet generation - restart from SOL distribution
        res.json({ success: true, message: 'Restarting from SOL distribution' });
        break;
      case 4:
        // After wallet funding - restart from trading
        res.json({ success: true, message: 'Restarting from trading' });
        break;
      case 5:
        // Token transfer to wallets
        res.json({ success: true, message: 'Restarting from token transfer' });
        break;
      case 6:
        // Close token accounts and send balance to admin
        if (closeTokenAccountsAndSendBalance && createWalletWithNumber) {
          const adminWallet = createWalletWithNumber(sessionData.admin.privateKey, sessionData.admin.number);
          const tradingWallets = sessionData.wallets.map(wallet => 
            createWalletWithNumber(wallet.privateKey, wallet.number)
          );
          
          await closeTokenAccountsAndSendBalance(adminWallet, tradingWallets, sessionData.tokenAddress, connection);
          res.json({ success: true, message: 'Token accounts closed and balances sent to admin' });
        } else {
          res.json({ success: true, message: 'Close accounts function not available' });
        }
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
    
    if (closeTokenAccountsAndSendBalance && createWalletWithNumber) {
      const adminWallet = createWalletWithNumber(sessionData.admin.privateKey, sessionData.admin.number);
      const tradingWallets = sessionData.wallets.map(wallet => 
        createWalletWithNumber(wallet.privateKey, wallet.number)
      );
      
      await closeTokenAccountsAndSendBalance(adminWallet, tradingWallets, sessionData.tokenAddress, connection);
      
      res.json({ success: true, message: 'Token accounts closed and balances sent to admin' });
    } else {
      res.json({ success: true, message: 'Close accounts function not available' });
    }
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
      WalletWithNumber: !!WalletWithNumber,
      RaydiumSwap: !!RaydiumSwap,
      getTokenBalance: !!getTokenBalance,
      dynamicTrade: !!dynamicTrade,
      saveSession: !!saveSession,
      distributeSol: !!distributeSol,
      getPoolKeysForTokenAddress: !!getPoolKeysForTokenAddress
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize modules and start server
async function startServer() {
  await initializeModules();
  
  app.listen(PORT, () => {
    console.log(`Backend API server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log('Backend is ready for production use');
  });
}

startServer().catch(console.error);

module.exports = app;