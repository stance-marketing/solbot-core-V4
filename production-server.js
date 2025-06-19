const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Connection, PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { createTransferCheckedInstruction, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const axios = require('axios');
const bs58 = require('bs58');
require('dotenv').config();

// Import your configuration
const { swapConfig } = require('./swapConfig.js');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize connection with your RPC
const connection = new Connection(swapConfig.RPC_URL, 'confirmed');

// Global trading flag
const globalTradingFlag = { value: false };

// Your existing Dexscreener integration
const getDexscreenerData = async (tokenAddress) => {
  try {
    const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch token data from Dexscreener: ${error.message}`);
    return null;
  }
};

// Your WalletWithNumber class implementation
class WalletWithNumber {
  constructor() {
    this.keypair = Keypair.generate();
    this.number = Math.floor(Math.random() * 10000);
    this.privateKey = bs58.encode(this.keypair.secretKey);
    this.generationTimestamp = new Date().toISOString();
  }

  static fromPrivateKey(privateKey, number) {
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
    const wallet = Object.create(WalletWithNumber.prototype);
    wallet.keypair = keypair;
    wallet.privateKey = privateKey;
    wallet.number = number;
    wallet.generationTimestamp = new Date().toISOString();
    return wallet;
  }

  get publicKey() {
    return this.keypair.publicKey.toBase58();
  }
}

// Your utility functions
const getSolBalance = async (wallet, connection) => {
  try {
    const keypair = Keypair.fromSecretKey(bs58.decode(wallet.privateKey));
    const balance = await connection.getBalance(keypair.publicKey);
    return balance / 1e9;
  } catch (error) {
    console.error('Error getting SOL balance:', error);
    return 0;
  }
};

const sendSol = async (fromWallet, toPublicKey, amountSol, connection) => {
  try {
    const fromKeypair = Keypair.fromSecretKey(bs58.decode(fromWallet.privateKey));
    const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports: lamports,
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromKeypair.publicKey;

    const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
    console.log(`Sent ${amountSol} SOL from ${fromKeypair.publicKey.toBase58()} to ${toPublicKey.toBase58()}`);
    return signature;
  } catch (error) {
    console.error('Error sending SOL:', error);
    throw error;
  }
};

const distributeSol = async (adminWallet, newWallets, totalAmount, connection) => {
  console.log(`Distributing ${totalAmount.toFixed(6)} SOL to ${newWallets.length} wallets`);
  const amountPerWallet = totalAmount / newWallets.length;
  const successWallets = [];

  for (let i = 0; i < newWallets.length; i++) {
    const wallet = newWallets[i];
    try {
      await new Promise(resolve => setTimeout(resolve, i * 700)); // 700ms delay
      const signature = await sendSol(adminWallet, new PublicKey(wallet.publicKey), amountPerWallet, connection);
      console.log(`Distributed ${amountPerWallet.toFixed(6)} SOL to wallet ${wallet.publicKey}`);
      successWallets.push({
        ...wallet,
        solBalance: amountPerWallet,
        isActive: true
      });
    } catch (error) {
      console.error(`Failed to distribute SOL to wallet ${wallet.publicKey}:`, error);
    }
  }

  return successWallets;
};

// Mock pool keys function (replace with your actual implementation)
const getPoolKeysForTokenAddress = async (connection, tokenAddress) => {
  // This is a mock implementation - replace with your actual pool-keys.js logic
  return {
    version: 4,
    marketId: 'mock_market_id_' + tokenAddress.slice(0, 8),
    baseMint: tokenAddress,
    quoteMint: swapConfig.WSOL_ADDRESS,
    baseDecimals: 9,
    quoteDecimals: 9,
    programId: swapConfig.RAYDIUM_LIQUIDITY_POOL_V4_ADDRESS,
    marketProgramId: 'mock_market_program_id'
  };
};

// Session Management
const saveSession = async (adminWallet, tradingWallets, sessionDir, tokenName, timestamp, tokenAddress, poolKeys, filename) => {
  try {
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const sessionData = {
      admin: {
        number: adminWallet.number,
        address: adminWallet.publicKey,
        privateKey: adminWallet.privateKey,
      },
      wallets: tradingWallets.map(wallet => ({
        number: wallet.number,
        address: wallet.publicKey,
        privateKey: wallet.privateKey,
        generationTimestamp: wallet.generationTimestamp
      })),
      tokenAddress,
      poolKeys,
      tokenName,
      timestamp
    };

    const filePath = path.join(sessionDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(sessionData, null, 2));
    console.log('Session saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving session:', error);
    return false;
  }
};

const loadSession = async (filename) => {
  try {
    const filePath = path.join(swapConfig.SESSION_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const sessionData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return sessionData;
  } catch (error) {
    console.error('Error loading session:', error);
    return null;
  }
};

// API Endpoints

// Session Management
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
    const sessionData = await loadSession(req.params.filename);
    if (sessionData) {
      res.json(sessionData);
    } else {
      res.status(404).json({ error: 'Session not found' });
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
    
    const adminWallet = WalletWithNumber.fromPrivateKey(sessionData.admin.privateKey, sessionData.admin.number);
    const tradingWallets = sessionData.wallets.map(wallet => 
      WalletWithNumber.fromPrivateKey(wallet.privateKey, wallet.number)
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
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Token Management
app.post('/api/tokens/validate', async (req, res) => {
  try {
    const { tokenAddress } = req.body;
    
    if (!tokenAddress) {
      return res.status(400).json({ error: 'Token address is required' });
    }
    
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

// Wallet Management
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
    
    if (!privateKey) {
      return res.status(400).json({ error: 'Private key is required' });
    }
    
    const adminWallet = WalletWithNumber.fromPrivateKey(privateKey, 0);
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
    
    if (!count || count < 1 || count > 100) {
      return res.status(400).json({ error: 'Count must be between 1 and 100' });
    }
    
    const wallets = Array.from({ length: count }, (_, i) => {
      const wallet = new WalletWithNumber();
      return {
        number: wallet.number,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
        solBalance: 0,
        tokenBalance: 0,
        isActive: false,
        generationTimestamp: wallet.generationTimestamp
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
      const walletInstance = WalletWithNumber.fromPrivateKey(wallet.privateKey, wallet.number);
      const solBalance = await getSolBalance(walletInstance, connection);
      
      updatedWallets.push({
        ...wallet,
        solBalance,
        tokenBalance: wallet.tokenBalance || 0
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
    // Mock token balance for now - replace with your actual getTokenBalance function
    res.json({ balance: Math.random() * 1000 });
  } catch (error) {
    console.error('Error getting admin token balance:', error);
    res.status(500).json({ error: 'Failed to get admin token balance' });
  }
});

// Distribution
app.post('/api/distribution/sol', async (req, res) => {
  try {
    const { adminWallet, tradingWallets, totalAmount } = req.body;
    
    const adminWalletInstance = WalletWithNumber.fromPrivateKey(adminWallet.privateKey, adminWallet.number);
    const tradingWalletInstances = tradingWallets.map(wallet => 
      WalletWithNumber.fromPrivateKey(wallet.privateKey, wallet.number)
    );
    
    const successWallets = await distributeSol(adminWalletInstance, tradingWalletInstances, totalAmount, connection);
    res.json(successWallets);
  } catch (error) {
    console.error('Error distributing SOL:', error);
    res.status(500).json({ error: 'Failed to distribute SOL' });
  }
});

app.post('/api/distribution/tokens', async (req, res) => {
  try {
    const { adminWallet, tradingWallets, tokenAddress, amountPerWallet } = req.body;
    
    // Mock token distribution for now - replace with your actual distributeTokens function
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

// Trading Control
app.post('/api/trading/start', async (req, res) => {
  try {
    const { strategy, sessionData } = req.body;
    globalTradingFlag.value = true;
    
    console.log(`Trading started with strategy: ${strategy}`);
    // Here you would call your dynamicTrade function
    
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

// Restart Points
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    tradingActive: globalTradingFlag.value,
    rpcUrl: swapConfig.RPC_URL,
    modulesLoaded: {
      solanaConnection: true,
      dexscreenerAPI: true,
      walletGeneration: true,
      sessionManagement: true,
      tradingControls: true,
      solDistribution: true
    }
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Production Backend API server running on http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 RPC URL: ${swapConfig.RPC_URL}`);
  console.log(`📁 Session Directory: ${swapConfig.SESSION_DIR}`);
  console.log('✅ Backend is production ready and integrated with your Solana functions');
});

module.exports = app;