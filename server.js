const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Connection, PublicKey } = require('@solana/web3.js');

// Import your existing functions
const { getDexscreenerData } = require('./index.js');
const { getPoolKeysForTokenAddress, getMarketIdForTokenAddress } = require('./pool-keys.js');
const { swapConfig } = require('./swapConfig.js');
const { 
  saveSession, 
  loadSession, 
  appendWalletsToSession, 
  distributeSol, 
  distributeTokens,
  getSolBalance,
  createWalletWithNumber
} = require('./utility.js');
const WalletWithNumber = require('./wallet.js');
const RaydiumSwap = require('./RaydiumSwap.js');
const { getTokenBalance } = require('./startTrading.js');
const { dynamicTrade } = require('./dynamicTrade.js');
const { closeTokenAccountsAndSendBalance } = require('./addedOptions.js');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize connection
const connection = new Connection(swapConfig.RPC_URL, 'confirmed');

// Global trading flag for controlling trading state
const globalTradingFlag = { value: false };

// Session Management Endpoints
app.get('/api/sessions', async (req, res) => {
  try {
    const sessionFiles = fs.readdirSync(swapConfig.SESSION_DIR)
      .filter(file => file.endsWith('_session.json'))
      .map(filename => {
        const filePath = path.join(swapConfig.SESSION_DIR, filename);
        const stats = fs.statSync(filePath);
        const sessionData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        return {
          filename,
          tokenName: sessionData.tokenName,
          timestamp: sessionData.timestamp,
          walletCount: sessionData.wallets.length,
          size: stats.size,
          lastModified: stats.mtime
        };
      });
    
    res.json(sessionFiles);
  } catch (error) {
    console.error('Error fetching session files:', error);
    res.status(500).json({ error: 'Failed to fetch session files' });
  }
});

app.get('/api/sessions/:filename', async (req, res) => {
  try {
    const sessionData = await loadSession(req.params.filename);
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
    const sessionData = req.body;
    const timestamp = new Date().toISOString();
    const filename = `${sessionData.tokenName}_${new Date().toLocaleDateString().replace(/\//g, '.')}_${new Date().toLocaleTimeString().replace(/:/g, '.')}_session.json`;
    
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
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

app.delete('/api/sessions/:filename', async (req, res) => {
  try {
    const filePath = path.join(swapConfig.SESSION_DIR, req.params.filename);
    fs.unlinkSync(filePath);
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
    
    const walletsWithNumber = wallets.map(wallet => 
      createWalletWithNumber(wallet.privateKey, wallet.number)
    );
    
    const success = await appendWalletsToSession(walletsWithNumber, sessionFilePath);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to append wallets to session' });
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
    
    // Use your existing getDexscreenerData function
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
    const poolKeys = await getPoolKeysForTokenAddress(connection, tokenAddress);
    
    if (poolKeys) {
      res.json(poolKeys);
    } else {
      res.status(404).json({ error: 'Pool keys not found' });
    }
  } catch (error) {
    console.error('Error getting pool keys:', error);
    res.status(500).json({ error: 'Failed to get pool keys' });
  }
});

app.post('/api/tokens/market-id', async (req, res) => {
  try {
    const { tokenAddress } = req.body;
    const marketId = await getMarketIdForTokenAddress(connection, tokenAddress);
    
    if (marketId) {
      res.json({ marketId: marketId.toString() });
    } else {
      res.status(404).json({ error: 'Market ID not found' });
    }
  } catch (error) {
    console.error('Error getting market ID:', error);
    res.status(500).json({ error: 'Failed to get market ID' });
  }
});

// Wallet Management Endpoints
app.post('/api/wallets/admin', async (req, res) => {
  try {
    const adminWallet = new WalletWithNumber();
    res.json({
      number: adminWallet.number,
      publicKey: adminWallet.publicKey,
      privateKey: adminWallet.privateKey,
      solBalance: 0,
      tokenBalance: 0,
      isActive: true
    });
  } catch (error) {
    console.error('Error creating admin wallet:', error);
    res.status(500).json({ error: 'Failed to create admin wallet' });
  }
});

app.post('/api/wallets/admin/import', async (req, res) => {
  try {
    const { privateKey } = req.body;
    const adminWallet = createWalletWithNumber(privateKey, 0);
    
    res.json({
      number: 0,
      publicKey: adminWallet.publicKey,
      privateKey: adminWallet.privateKey,
      solBalance: 0,
      tokenBalance: 0,
      isActive: true
    });
  } catch (error) {
    console.error('Error importing admin wallet:', error);
    res.status(500).json({ error: 'Failed to import admin wallet' });
  }
});

app.post('/api/wallets/trading', async (req, res) => {
  try {
    const { count } = req.body;
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
  } catch (error) {
    console.error('Error generating trading wallets:', error);
    res.status(500).json({ error: 'Failed to generate trading wallets' });
  }
});

app.post('/api/wallets/balances', async (req, res) => {
  try {
    const { wallets } = req.body;
    const updatedWallets = [];
    
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
    
    res.json(updatedWallets);
  } catch (error) {
    console.error('Error getting wallet balances:', error);
    res.status(500).json({ error: 'Failed to get wallet balances' });
  }
});

app.post('/api/wallets/admin/token-balance', async (req, res) => {
  try {
    const { adminWallet, tokenAddress } = req.body;
    const raydiumSwap = new RaydiumSwap(swapConfig.RPC_URL, adminWallet.privateKey);
    const balance = await getTokenBalance(raydiumSwap, tokenAddress);
    
    res.json({ balance });
  } catch (error) {
    console.error('Error getting admin token balance:', error);
    res.status(500).json({ error: 'Failed to get admin token balance' });
  }
});

// Distribution Endpoints
app.post('/api/distribution/sol', async (req, res) => {
  try {
    const { adminWallet, tradingWallets, totalAmount } = req.body;
    
    const adminWalletInstance = createWalletWithNumber(adminWallet.privateKey, adminWallet.number);
    const tradingWalletInstances = tradingWallets.map(wallet => 
      createWalletWithNumber(wallet.privateKey, wallet.number)
    );
    
    const result = await distributeSol(adminWalletInstance, tradingWalletInstances, totalAmount, connection);
    
    res.json(result);
  } catch (error) {
    console.error('Error distributing SOL:', error);
    res.status(500).json({ error: 'Failed to distribute SOL' });
  }
});

app.post('/api/distribution/tokens', async (req, res) => {
  try {
    const { adminWallet, tradingWallets, tokenAddress, amountPerWallet } = req.body;
    
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
  } catch (error) {
    console.error('Error distributing tokens:', error);
    res.status(500).json({ error: 'Failed to distribute tokens' });
  }
});

// Trading Control Endpoints
app.post('/api/trading/start', async (req, res) => {
  try {
    const { strategy, sessionData } = req.body;
    
    const adminWallet = createWalletWithNumber(sessionData.admin.privateKey, sessionData.admin.number);
    const tradingWallets = sessionData.wallets.map(wallet => 
      createWalletWithNumber(wallet.privateKey, wallet.number)
    );
    
    // Start trading in background
    globalTradingFlag.value = true;
    
    // Don't await this - let it run in background
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
        const adminWallet = createWalletWithNumber(sessionData.admin.privateKey, sessionData.admin.number);
        const tradingWallets = sessionData.wallets.map(wallet => 
          createWalletWithNumber(wallet.privateKey, wallet.number)
        );
        
        await closeTokenAccountsAndSendBalance(adminWallet, tradingWallets, sessionData.tokenAddress, connection);
        res.json({ success: true, message: 'Token accounts closed and balances sent to admin' });
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
    
    const adminWallet = createWalletWithNumber(sessionData.admin.privateKey, sessionData.admin.number);
    const tradingWallets = sessionData.wallets.map(wallet => 
      createWalletWithNumber(wallet.privateKey, wallet.number)
    );
    
    await closeTokenAccountsAndSendBalance(adminWallet, tradingWallets, sessionData.tokenAddress, connection);
    
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
    tradingActive: globalTradingFlag.value
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
});

module.exports = app;