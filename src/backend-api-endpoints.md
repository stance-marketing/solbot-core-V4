# Backend API Endpoints Required

This document outlines the API endpoints your Node.js backend needs to implement for the UI integration.

## Base URL: `http://localhost:3001/api`

### Session Management

#### GET `/sessions`
- **Purpose**: Get list of all session files
- **Returns**: Array of SessionFile objects
- **Maps to**: Your existing session directory scanning logic

#### GET `/sessions/:filename`
- **Purpose**: Load specific session file
- **Returns**: SessionData object
- **Maps to**: Your existing `loadSession()` function

#### POST `/sessions`
- **Purpose**: Save new session
- **Body**: SessionData object
- **Returns**: { filename: string }
- **Maps to**: Your existing `saveSession()` function

#### DELETE `/sessions/:filename`
- **Purpose**: Delete session file
- **Maps to**: File system deletion

#### POST `/sessions/export-env`
- **Purpose**: Generate .env file content
- **Body**: { sessionData: SessionData }
- **Returns**: String (env file content)
- **Maps to**: Your existing env file generation logic

### Token Management

#### POST `/tokens/validate`
- **Purpose**: Validate token address and get token data
- **Body**: { tokenAddress: string }
- **Returns**: { isValid: boolean, tokenData?: object }
- **Maps to**: Your existing Dexscreener integration

#### POST `/tokens/pool-keys`
- **Purpose**: Get pool keys for token
- **Body**: { tokenAddress: string }
- **Returns**: Pool keys object
- **Maps to**: Your existing `getPoolKeysForTokenAddress()` function

### Wallet Management

#### POST `/wallets/admin`
- **Purpose**: Create new admin wallet
- **Returns**: WalletData object
- **Maps to**: Your existing `WalletWithNumber` constructor

#### POST `/wallets/admin/import`
- **Purpose**: Import existing admin wallet
- **Body**: { privateKey: string }
- **Returns**: WalletData object
- **Maps to**: Your existing `WalletWithNumber.fromPrivateKey()`

#### POST `/wallets/trading`
- **Purpose**: Generate trading wallets
- **Body**: { count: number }
- **Returns**: Array of WalletData objects
- **Maps to**: Your existing wallet generation logic

#### POST `/wallets/balances`
- **Purpose**: Get current balances for wallets
- **Body**: { wallets: WalletData[] }
- **Returns**: Array of WalletData with updated balances
- **Maps to**: Your existing `getSolBalance()` and token balance functions

### Distribution

#### POST `/distribution/sol`
- **Purpose**: Distribute SOL to trading wallets
- **Body**: { adminWallet: WalletData, tradingWallets: WalletData[], totalAmount: number }
- **Returns**: Array of updated WalletData
- **Maps to**: Your existing `distributeSol()` function

#### POST `/distribution/tokens`
- **Purpose**: Distribute tokens to trading wallets
- **Body**: { adminWallet: WalletData, tradingWallets: WalletData[], tokenAddress: string, totalAmount: number }
- **Returns**: Array of updated WalletData
- **Maps to**: Your existing `distributeTokens()` function

### Trading Control

#### POST `/trading/start`
- **Purpose**: Start trading with strategy
- **Body**: { strategy: string, sessionData: SessionData }
- **Maps to**: Your existing `dynamicTrade()` function

#### POST `/trading/pause`
- **Purpose**: Pause trading
- **Maps to**: Your existing pause logic

#### POST `/trading/resume`
- **Purpose**: Resume trading
- **Maps to**: Your existing resume logic

#### POST `/trading/stop`
- **Purpose**: Stop trading
- **Maps to**: Your existing stop logic

### Restart Points

#### POST `/restart/:point`
- **Purpose**: Restart from specific point (1-6)
- **Body**: { sessionData: SessionData }
- **Maps to**: Your existing restart logic in `index.ts`

### Cleanup

#### POST `/cleanup/close-accounts`
- **Purpose**: Close token accounts and send balance to admin
- **Body**: { sessionData: SessionData }
- **Maps to**: Your existing `closeTokenAccountsAndSendBalance()` function

## Implementation Notes

1. **Error Handling**: All endpoints should return proper HTTP status codes and error messages
2. **CORS**: Enable CORS for frontend communication
3. **Validation**: Validate all input parameters
4. **Logging**: Log all operations for debugging
5. **Security**: Validate private keys and sensitive data

## Example Express.js Structure

```javascript
const express = require('express');
const app = express();

app.use(express.json());
app.use(cors());

// Session routes
app.get('/api/sessions', getSessionFiles);
app.get('/api/sessions/:filename', loadSession);
app.post('/api/sessions', saveSession);
app.delete('/api/sessions/:filename', deleteSession);

// Token routes
app.post('/api/tokens/validate', validateToken);
app.post('/api/tokens/pool-keys', getPoolKeys);

// Wallet routes
app.post('/api/wallets/admin', createAdminWallet);
app.post('/api/wallets/trading', generateTradingWallets);

// Distribution routes
app.post('/api/distribution/sol', distributeSol);
app.post('/api/distribution/tokens', distributeTokens);

// Trading routes
app.post('/api/trading/start', startTrading);
app.post('/api/trading/pause', pauseTrading);

// Restart routes
app.post('/api/restart/:point', restartFromPoint);

app.listen(3001, () => {
  console.log('Backend API running on port 3001');
});
```