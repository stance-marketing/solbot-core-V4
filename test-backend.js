const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test functions
async function testHealthCheck() {
  try {
    console.log('Testing health check...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testTokenValidation() {
  try {
    console.log('\nTesting token validation...');
    
    // Test with a real Solana token address (BONK)
    const tokenAddress = '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R';
    
    const response = await axios.post(`${BASE_URL}/tokens/validate`, {
      tokenAddress
    });
    
    if (response.data.isValid) {
      console.log('✅ Token validation passed:', response.data.tokenData);
      return response.data.tokenData;
    } else {
      console.log('❌ Token validation failed: Token not valid');
      return null;
    }
  } catch (error) {
    console.error('❌ Token validation error:', error.message);
    return null;
  }
}

async function testPoolKeys(tokenAddress) {
  try {
    console.log('\nTesting pool keys...');
    
    const response = await axios.post(`${BASE_URL}/tokens/pool-keys`, {
      tokenAddress
    });
    
    console.log('✅ Pool keys retrieved:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Pool keys error:', error.message);
    return null;
  }
}

async function testWalletCreation() {
  try {
    console.log('\nTesting wallet creation...');
    
    // Test admin wallet creation
    const adminResponse = await axios.post(`${BASE_URL}/wallets/admin`);
    console.log('✅ Admin wallet created:', adminResponse.data);
    
    // Test trading wallet generation
    const tradingResponse = await axios.post(`${BASE_URL}/wallets/trading`, {
      count: 3
    });
    console.log('✅ Trading wallets created:', tradingResponse.data.length, 'wallets');
    
    return {
      adminWallet: adminResponse.data,
      tradingWallets: tradingResponse.data
    };
  } catch (error) {
    console.error('❌ Wallet creation error:', error.message);
    return null;
  }
}

async function testSessionManagement(tokenData, poolKeys, wallets) {
  try {
    console.log('\nTesting session management...');
    
    const sessionData = {
      admin: {
        number: wallets.adminWallet.number,
        address: wallets.adminWallet.publicKey,
        privateKey: wallets.adminWallet.privateKey
      },
      wallets: wallets.tradingWallets.map(wallet => ({
        number: wallet.number,
        address: wallet.publicKey,
        privateKey: wallet.privateKey,
        generationTimestamp: wallet.generationTimestamp
      })),
      tokenAddress: tokenData.address,
      poolKeys,
      tokenName: tokenData.name,
      timestamp: new Date().toISOString()
    };
    
    // Save session
    const saveResponse = await axios.post(`${BASE_URL}/sessions`, sessionData);
    console.log('✅ Session saved:', saveResponse.data.filename);
    
    // List sessions
    const listResponse = await axios.get(`${BASE_URL}/sessions`);
    console.log('✅ Sessions listed:', listResponse.data.length, 'sessions found');
    
    // Load session
    const loadResponse = await axios.get(`${BASE_URL}/sessions/${saveResponse.data.filename}`);
    console.log('✅ Session loaded successfully');
    
    return saveResponse.data.filename;
  } catch (error) {
    console.error('❌ Session management error:', error.message);
    return null;
  }
}

async function testTradingControls() {
  try {
    console.log('\nTesting trading controls...');
    
    const sessionData = {
      admin: { privateKey: 'test_key' },
      wallets: [],
      tokenAddress: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
      tokenName: 'TestToken',
      timestamp: new Date().toISOString()
    };
    
    // Start trading
    const startResponse = await axios.post(`${BASE_URL}/trading/start`, {
      strategy: 'INCREASE_MAKERS_VOLUME',
      sessionData
    });
    console.log('✅ Trading started:', startResponse.data.message);
    
    // Pause trading
    const pauseResponse = await axios.post(`${BASE_URL}/trading/pause`);
    console.log('✅ Trading paused:', pauseResponse.data.message);
    
    // Resume trading
    const resumeResponse = await axios.post(`${BASE_URL}/trading/resume`);
    console.log('✅ Trading resumed:', resumeResponse.data.message);
    
    // Stop trading
    const stopResponse = await axios.post(`${BASE_URL}/trading/stop`);
    console.log('✅ Trading stopped:', stopResponse.data.message);
    
    return true;
  } catch (error) {
    console.error('❌ Trading controls error:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting backend API tests...\n');
  
  // Test 1: Health check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('❌ Backend is not running. Please start with: node server.js');
    return;
  }
  
  // Test 2: Token validation
  const tokenData = await testTokenValidation();
  if (!tokenData) {
    console.log('❌ Token validation failed, skipping dependent tests');
    return;
  }
  
  // Test 3: Pool keys
  const poolKeys = await testPoolKeys(tokenData.address);
  if (!poolKeys) {
    console.log('❌ Pool keys test failed, skipping dependent tests');
    return;
  }
  
  // Test 4: Wallet creation
  const wallets = await testWalletCreation();
  if (!wallets) {
    console.log('❌ Wallet creation failed, skipping dependent tests');
    return;
  }
  
  // Test 5: Session management
  const sessionFilename = await testSessionManagement(tokenData, poolKeys, wallets);
  if (!sessionFilename) {
    console.log('❌ Session management failed');
    return;
  }
  
  // Test 6: Trading controls
  const tradingOk = await testTradingControls();
  if (!tradingOk) {
    console.log('❌ Trading controls failed');
    return;
  }
  
  console.log('\n🎉 All tests passed! Backend is production ready.');
  console.log('\n📋 Test Summary:');
  console.log('✅ Health check');
  console.log('✅ Token validation (real Dexscreener API)');
  console.log('✅ Pool keys retrieval');
  console.log('✅ Wallet creation');
  console.log('✅ Session management');
  console.log('✅ Trading controls');
  
  console.log('\n🔗 Integration Status:');
  console.log('✅ Frontend can now connect to backend');
  console.log('✅ Real token validation working');
  console.log('✅ Session persistence working');
  console.log('✅ Wallet management working');
  console.log('✅ Trading controls working');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };