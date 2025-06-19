const express = require('express')
const cors = require('cors')
const fs = require('fs').promises
const path = require('path')

// Import your existing backend functions
const { 
  getDexscreenerData,
  getPoolKeysForTokenAddress,
  getMarketIdForTokenAddress
} = require('../pool-keys')
const { 
  saveSession,
  loadSession,
  appendWalletsToSession,
  distributeSol,
  distributeTokens,
  getSolBalance
} = require('../utility')
const { dynamicTrade } = require('../dynamicTrade')
const { closeTokenAccountsAndSendBalance } = require('../addedOptions')
const WalletWithNumber = require('../wallet')
const { Connection } = require('@solana/web3.js')
const { swapConfig } = require('../swapConfig')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Initialize connection
const connection = new Connection(swapConfig.RPC_URL, 'confirmed')

// Session Management Routes
app.get('/api/sessions', async (req, res) => {
  try {
    const sessionDir = swapConfig.SESSION_DIR
    const files = await fs.readdir(sessionDir)
    const sessionFiles = files.filter(file => file.endsWith('_session.json'))
    
    const sessions = await Promise.all(
      sessionFiles.map(async (filename) => {
        const filePath = path.join(sessionDir, filename)
        const stats = await fs.stat(filePath)
        const content = await fs.readFile(filePath, 'utf-8')
        const sessionData = JSON.parse(content)
        
        return {
          filename,
          tokenName: sessionData.tokenName,
          timestamp: sessionData.timestamp,
          walletCount: sessionData.wallets.length,
          size: stats.size,
          lastModified: stats.mtime
        }
      })
    )
    
    res.json(sessions)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/sessions/:filename', async (req, res) => {
  try {
    const sessionData = await loadSession(req.params.filename)
    res.json(sessionData)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/sessions', async (req, res) => {
  try {
    const { sessionData } = req.body
    const filename = `${sessionData.tokenName}_${sessionData.timestamp}_session.json`
    
    const success = await saveSession(
      { privateKey: sessionData.admin.privateKey, publicKey: sessionData.admin.address, number: sessionData.admin.number },
      sessionData.wallets.map(w => ({ privateKey: w.privateKey, publicKey: w.address, number: w.number })),
      swapConfig.SESSION_DIR,
      sessionData.tokenName,
      sessionData.timestamp,
      sessionData.tokenAddress,
      sessionData.poolKeys,
      filename
    )
    
    if (success) {
      res.json({ filename })
    } else {
      throw new Error('Failed to save session')
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/sessions/:filename', async (req, res) => {
  try {
    const filePath = path.join(swapConfig.SESSION_DIR, req.params.filename)
    await fs.unlink(filePath)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Token Operations Routes
app.post('/api/token/validate', async (req, res) => {
  try {
    const { address } = req.body
    const tokenData = await getDexscreenerData(address)
    
    if (tokenData && tokenData.pairs && tokenData.pairs.length > 0) {
      const pair = tokenData.pairs[0]
      res.json({
        isValid: true,
        tokenData: {
          name: pair.baseToken.name,
          symbol: pair.baseToken.symbol,
          price: `$${pair.priceUsd}`,
          volume24h: `$${pair.volume.h24}`,
          priceChange24h: `${pair.priceChange.h24}%`
        }
      })
    } else {
      res.json({ isValid: false })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/token/pool-keys', async (req, res) => {
  try {
    const { tokenAddress } = req.body
    const poolKeys = await getPoolKeysForTokenAddress(connection, tokenAddress)
    res.json(poolKeys)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Wallet Operations Routes
app.post('/api/wallets/generate', async (req, res) => {
  try {
    const { count } = req.body
    const wallets = Array.from({ length: count }, (_, i) => {
      const wallet = new WalletWithNumber()
      return {
        number: wallet.number,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
        solBalance: 0,
        tokenBalance: 0,
        isActive: false,
        generationTimestamp: new Date().toISOString()
      }
    })
    res.json(wallets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/wallets/admin', async (req, res) => {
  try {
    const { privateKey } = req.body
    let wallet
    
    if (privateKey) {
      wallet = WalletWithNumber.fromPrivateKey(privateKey, 0)
    } else {
      wallet = new WalletWithNumber()
      wallet.number = 0
    }
    
    res.json({
      number: wallet.number,
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey,
      solBalance: 0,
      tokenBalance: 0,
      isActive: true
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/wallets/balances', async (req, res) => {
  try {
    const { wallets } = req.body
    const walletsWithBalances = await Promise.all(
      wallets.map(async (wallet) => {
        const walletInstance = WalletWithNumber.fromPrivateKey(wallet.privateKey, wallet.number)
        const solBalance = await getSolBalance(walletInstance, connection)
        
        return {
          ...wallet,
          solBalance,
          tokenBalance: 0 // Would need to implement token balance fetching
        }
      })
    )
    res.json(walletsWithBalances)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Distribution Operations Routes
app.post('/api/distribution/sol', async (req, res) => {
  try {
    const { adminWallet, wallets, totalAmount } = req.body
    
    const adminWalletInstance = WalletWithNumber.fromPrivateKey(adminWallet.privateKey, adminWallet.number)
    const walletInstances = wallets.map(w => WalletWithNumber.fromPrivateKey(w.privateKey, w.number))
    
    const { successWallets } = await distributeSol(adminWalletInstance, walletInstances, totalAmount, connection)
    
    const updatedWallets = successWallets.map(wallet => ({
      number: wallet.number,
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey,
      solBalance: totalAmount / wallets.length,
      tokenBalance: 0,
      isActive: true,
      generationTimestamp: wallet.generationTimestamp
    }))
    
    res.json(updatedWallets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/distribution/tokens', async (req, res) => {
  try {
    const { adminWallet, wallets, tokenAddress, totalAmount } = req.body
    
    const adminWalletInstance = WalletWithNumber.fromPrivateKey(adminWallet.privateKey, adminWallet.number)
    const walletInstances = wallets.map(w => WalletWithNumber.fromPrivateKey(w.privateKey, w.number))
    
    await distributeTokens(
      adminWalletInstance,
      new PublicKey(adminWallet.publicKey),
      walletInstances,
      new PublicKey(tokenAddress),
      totalAmount,
      9, // decimals
      connection
    )
    
    const updatedWallets = wallets.map(wallet => ({
      ...wallet,
      tokenBalance: totalAmount / wallets.length
    }))
    
    res.json(updatedWallets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Trading Operations Routes
app.post('/api/trading/start', async (req, res) => {
  try {
    const { strategy, sessionData } = req.body
    
    const adminWallet = WalletWithNumber.fromPrivateKey(sessionData.admin.privateKey, sessionData.admin.number)
    const tradingWallets = sessionData.wallets.map(w => WalletWithNumber.fromPrivateKey(w.privateKey, w.number))
    
    const globalTradingFlag = { value: true }
    
    // Start trading in background
    dynamicTrade(
      adminWallet,
      tradingWallets,
      sessionData.tokenAddress,
      strategy,
      connection,
      sessionData.timestamp,
      sessionData.tokenName,
      globalTradingFlag
    ).catch(console.error)
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Restart Operations Routes
app.post('/api/sessions/restart', async (req, res) => {
  try {
    const { filename, restartPoint } = req.body
    
    // Load session data
    const sessionData = await loadSession(filename)
    
    // Execute restart based on point
    switch (restartPoint) {
      case 1:
        // After token discovery - validate token again
        break
      case 2:
        // After admin wallet creation - setup admin wallet
        break
      case 3:
        // After wallet generation - generate new wallets
        break
      case 4:
        // After wallet funding - distribute SOL
        break
      case 5:
        // Token transfer to wallets - distribute tokens
        break
      case 6:
        // Close token accounts and send balance
        const adminWallet = WalletWithNumber.fromPrivateKey(sessionData.admin.privateKey, sessionData.admin.number)
        const tradingWallets = sessionData.wallets.map(w => WalletWithNumber.fromPrivateKey(w.privateKey, w.number))
        await closeTokenAccountsAndSendBalance(adminWallet, tradingWallets, sessionData.tokenAddress, connection)
        break
    }
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Export Operations Routes
app.post('/api/export/env', async (req, res) => {
  try {
    const { sessionData } = req.body
    
    let envContent = `RPC_URL=${swapConfig.RPC_URL}\n`
    envContent += `ADMIN_WALLET_PRIVATE_KEY=${sessionData.admin.privateKey}\n`
    envContent += `TOKEN_ADDRESS=${sessionData.tokenAddress}\n`
    
    sessionData.wallets.forEach((wallet, index) => {
      envContent += `WALLET_PRIVATE_KEY_${index + 1}=${wallet.privateKey}\n`
    })
    
    res.type('text/plain').send(envContent)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Cleanup Operations Routes
app.post('/api/cleanup/close-accounts', async (req, res) => {
  try {
    const { sessionData } = req.body
    
    const adminWallet = WalletWithNumber.fromPrivateKey(sessionData.admin.privateKey, sessionData.admin.number)
    const tradingWallets = sessionData.wallets.map(w => WalletWithNumber.fromPrivateKey(w.privateKey, w.number))
    
    await closeTokenAccountsAndSendBalance(adminWallet, tradingWallets, sessionData.tokenAddress, connection)
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`)
})

module.exports = app