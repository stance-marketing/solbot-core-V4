// CommonJS version of swapConfig for backend compatibility
module.exports = {
  swapConfig: {
    RPC_URL: process.env.RPC_URL || "https://floral-capable-sun.solana-mainnet.quiknode.pro/569466c8ec8e71909ae64117473d0bd3327e133a/",
    WS_URL: process.env.WS_URL || "wss://floral-capable-sun.solana-mainnet.quiknode.pro/569466c8ec8e71909ae64117473d0bd3327e133a/",
    
    // Addresses
    WSOL_ADDRESS: "So11111111111111111111111111111111111111112",
    RAYDIUM_LIQUIDITY_POOL_V4_ADDRESS: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",

    // Swap Configuration
    SLIPPAGE_PERCENT: 5,
    initialAmount: 0.00001,
    TOKEN_TRANSFER_THRESHOLD: 0,

    // Retry Configuration
    poolSearchMaxRetries: 10,
    poolSearchRetryInterval: 2000,
    retryInterval: 1000,
    maxRetries: 15,

    // Fees and Limits
    RENT_EXEMPT_FEE: 900000,
    maxLamports: 6000,

    // Trading Durations
    TRADE_DURATION_VOLUME: 1200000000,
    TRADE_DURATION_MAKER: 181000,
    loopInterval: 8000,
    RENT_EXEMPT_SWAP_FEE: 0,
    
    // Percentage Configuration
    minPercentage: 5,
    maxPercentage: 15,
    minSellPercentage: 50,
    maxSellPercentage: 100,
    buyDuration: 61000,
    sellDuration: 30000,
    
    // Session Configuration
    SESSION_DIR: process.env.SESSION_DIR || "./sessions"
  }
};