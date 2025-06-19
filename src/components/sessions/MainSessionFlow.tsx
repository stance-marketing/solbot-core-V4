import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { X, ArrowRight, ArrowLeft, Check, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { backendService } from '../../services/backendService'
import { setCurrentSession } from '../../store/slices/sessionSlice'
import { setAdminWallet, setTradingWallets } from '../../store/slices/walletSlice'
import { WalletData } from '../../store/slices/walletSlice'
import toast from 'react-hot-toast'

interface MainSessionFlowProps {
  isOpen: boolean
  onClose: () => void
}

// This follows your EXACT index.ts flow
const MainSessionFlow: React.FC<MainSessionFlowProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Session data matching your backend structure
  const [tokenAddress, setTokenAddress] = useState('')
  const [tokenData, setTokenData] = useState<any>(null)
  const [poolKeys, setPoolKeys] = useState<any>(null)
  const [sessionFileName, setSessionFileName] = useState<string>('')
  const [adminWalletOption, setAdminWalletOption] = useState<'create' | 'import'>('create')
  const [adminPrivateKey, setAdminPrivateKey] = useState('')
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [adminWallet, setAdminWalletState] = useState<WalletData | null>(null)
  const [walletCount, setWalletCount] = useState(10)
  const [solAmount, setSolAmount] = useState(1.0)
  const [tradingWallets, setTradingWalletsState] = useState<WalletData[]>([])
  const [showTokenInfo, setShowTokenInfo] = useState(false)

  // Steps matching your EXACT index.ts flow
  const steps = [
    { id: 1, name: 'Token Discovery', description: 'Validate token and create session file' },
    { id: 2, name: 'Admin Wallet', description: 'Create/import admin wallet and update session' },
    { id: 3, name: 'Wallet Generation', description: 'Generate trading wallets and update session' },
    { id: 4, name: 'SOL Distribution', description: 'Distribute SOL to trading wallets' },
    { id: 5, name: 'Token Distribution', description: 'Optional: Distribute tokens to wallets' },
    { id: 6, name: 'Trading Strategy', description: 'Select strategy and start trading' }
  ]

  const resetFlow = () => {
    setCurrentStep(1)
    setTokenAddress('')
    setTokenData(null)
    setPoolKeys(null)
    setSessionFileName('')
    setAdminWalletOption('create')
    setAdminPrivateKey('')
    setShowPrivateKey(false)
    setAdminWalletState(null)
    setWalletCount(10)
    setSolAmount(1.0)
    setTradingWalletsState([])
    setShowTokenInfo(false)
    setError(null)
    setIsLoading(false)
  }

  const handleClose = () => {
    resetFlow()
    onClose()
  }

  // Step 1: Token Discovery + Session Creation (matches your exact flow)
  const validateTokenAndCreateSession = async () => {
    if (!tokenAddress.trim()) {
      setError('Please enter a token address')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // 1. Validate token using DexScreener (your getDexscreenerData function)
      const result = await backendService.validateTokenAddress(tokenAddress)
      
      if (!result.isValid || !result.tokenData) {
        setError('Invalid token address or token not found')
        return false
      }

      setTokenData(result.tokenData)

      // 2. Get pool keys (your getPoolKeysForTokenAddress function)
      const keys = await backendService.getPoolKeys(tokenAddress)
      if (!keys) {
        setError('Pool keys not found for this token')
        return false
      }
      setPoolKeys(keys)

      // 3. Create session file immediately with placeholder admin (your exact flow)
      const timestamp = new Date().toISOString()
      const fileName = `${result.tokenData.name}_${new Date().toLocaleDateString().replace(/\//g, '.')}_${new Date().toLocaleTimeString().replace(/:/g, '.')}_session.json`
      
      const initialSessionData = {
        admin: {
          number: 'to be created',
          address: 'to be created',
          privateKey: 'to be created'
        },
        wallets: [],
        tokenAddress,
        poolKeys: keys,
        tokenName: result.tokenData.name,
        timestamp
      }

      // Save initial session (your saveSession function)
      await backendService.saveSession(initialSessionData)
      setSessionFileName(fileName)
      
      toast.success(`Session file created: ${fileName}`)
      return true
    } catch (error) {
      setError(`Failed to validate token and create session: ${error.message}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Admin Wallet + Session Update (matches your exact flow)
  const createAdminWalletAndUpdateSession = async () => {
    setIsLoading(true)
    setError(null)

    try {
      let wallet: WalletData

      if (adminWalletOption === 'import') {
        if (!adminPrivateKey.trim()) {
          setError('Please enter admin wallet private key')
          return false
        }
        // Your createWalletWithNumber function for import
        wallet = await backendService.importAdminWallet(adminPrivateKey)
      } else {
        // Your new WalletWithNumber() constructor
        wallet = await backendService.createAdminWallet()
      }
      
      setAdminWalletState(wallet)

      // Update session file with admin wallet (your saveSession function)
      const sessionData = {
        admin: {
          number: wallet.number,
          address: wallet.publicKey,
          privateKey: wallet.privateKey
        },
        wallets: [],
        tokenAddress,
        poolKeys,
        tokenName: tokenData.name,
        timestamp: new Date().toISOString()
      }

      await backendService.saveSession(sessionData)
      toast.success('Session updated with admin wallet details')
      return true
    } catch (error) {
      setError(`Failed to create admin wallet: ${error.message}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Wallet Generation + Session Update (matches your exact flow)
  const generateWalletsAndUpdateSession = async () => {
    if (walletCount < 1 || walletCount > 100) {
      setError('Wallet count must be between 1 and 100')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // Generate wallets (your Array.from({ length: numWallets }, () => new WalletWithNumber()))
      const wallets = await backendService.generateTradingWallets(walletCount)
      setTradingWalletsState(wallets)

      // Update session file with wallets (your appendWalletsToSession function)
      await backendService.appendWalletsToSession(wallets, sessionFileName)
      
      toast.success(`Generated ${wallets.length} wallets and updated session`)
      return true
    } catch (error) {
      setError(`Failed to generate trading wallets: ${error.message}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Step 4: SOL Distribution (matches your distributeSol function)
  const distributeSolToWallets = async () => {
    if (!adminWallet || tradingWallets.length === 0) {
      setError('Admin wallet and trading wallets are required')
      return false
    }

    if (solAmount <= 0) {
      setError('SOL amount must be greater than 0')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // Your distributeSol function
      const { successWallets } = await backendService.distributeSol(adminWallet, tradingWallets, solAmount)
      setTradingWalletsState(successWallets)
      
      toast.success(`Successfully distributed SOL to ${successWallets.length} wallets`)
      return true
    } catch (error) {
      setError(`Failed to distribute SOL to wallets: ${error.message}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Step 5: Token Distribution (optional, matches your flow)
  const distributeTokensToWallets = async () => {
    if (!adminWallet || tradingWallets.length === 0) {
      setError('Admin wallet and trading wallets are required')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // Check if admin has tokens first (your getTokenBalance function)
      const adminTokenBalance = await backendService.getAdminTokenBalance(adminWallet, tokenAddress)
      
      if (adminTokenBalance > 0) {
        // Your distributeTokens function
        const amountPerWallet = adminTokenBalance / tradingWallets.length
        await backendService.distributeTokens(adminWallet, tradingWallets, tokenAddress, amountPerWallet)
        toast.success('Tokens distributed to wallets')
      } else {
        toast.info('Admin wallet has 0 tokens - skipping token distribution')
      }
      
      return true
    } catch (error) {
      setError(`Failed to distribute tokens: ${error.message}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Step 6: Start Trading (matches your dynamicTrade function)
  const startTradingWithStrategy = async (strategy: string) => {
    if (!tokenData || !adminWallet || tradingWallets.length === 0 || !poolKeys) {
      setError('All steps must be completed')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const sessionData = {
        admin: {
          number: adminWallet.number,
          address: adminWallet.publicKey,
          privateKey: adminWallet.privateKey
        },
        wallets: tradingWallets.map(wallet => ({
          number: wallet.number,
          address: wallet.publicKey,
          privateKey: wallet.privateKey,
          generationTimestamp: wallet.generationTimestamp
        })),
        tokenAddress,
        poolKeys,
        tokenName: tokenData.name,
        timestamp: new Date().toISOString()
      }

      // Start trading using your dynamicTrade function
      await backendService.startTrading(strategy, sessionData)
      
      // Update Redux store
      dispatch(setCurrentSession(sessionData))
      dispatch(setAdminWallet(adminWallet))
      dispatch(setTradingWallets(tradingWallets))

      toast.success(`Trading initiated with strategy: ${strategy}`)
      handleClose()
    } catch (error) {
      setError(`Failed to start trading: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = async () => {
    let canProceed = false

    switch (currentStep) {
      case 1:
        canProceed = await validateTokenAndCreateSession()
        break
      case 2:
        canProceed = await createAdminWalletAndUpdateSession()
        break
      case 3:
        canProceed = await generateWalletsAndUpdateSession()
        break
      case 4:
        canProceed = await distributeSolToWallets()
        break
      case 5:
        canProceed = await distributeTokensToWallets()
        break
      case 6:
        // This step handles strategy selection
        return
    }

    if (canProceed) {
      setCurrentStep(currentStep + 1)
      setError(null)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              New Trading Session
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Step {currentStep} of {steps.length}: {steps[currentStep - 1].name}
            </p>
            {sessionFileName && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Session: {sessionFileName}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep > step.id
                    ? 'bg-green-500 text-white'
                    : currentStep === step.id
                    ? 'bg-solana-500 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}>
                  {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-1 mx-1 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}

          {/* Step 1: Token Discovery + Session Creation */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Token Discovery & Session Creation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter the token address to validate, fetch pool keys, and create the session file.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token Address
                </label>
                <input
                  type="text"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  placeholder="Enter Solana token address..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-solana-500 focus:border-transparent"
                />
              </div>

              {tokenData && poolKeys && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-green-800 dark:text-green-300">
                      Token & Pool Validated Successfully
                    </h4>
                    <button
                      onClick={() => setShowTokenInfo(!showTokenInfo)}
                      className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                    >
                      {showTokenInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-600 dark:text-green-400">Name:</span>
                      <span className="ml-2 text-green-800 dark:text-green-300">{tokenData.name}</span>
                    </div>
                    <div>
                      <span className="text-green-600 dark:text-green-400">Symbol:</span>
                      <span className="ml-2 text-green-800 dark:text-green-300">{tokenData.symbol}</span>
                    </div>
                    <div>
                      <span className="text-green-600 dark:text-green-400">Pool:</span>
                      <span className="ml-2 text-green-800 dark:text-green-300">✓ Found</span>
                    </div>
                    <div>
                      <span className="text-green-600 dark:text-green-400">Session:</span>
                      <span className="ml-2 text-green-800 dark:text-green-300">✓ Created</span>
                    </div>
                  </div>

                  {showTokenInfo && (
                    <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-green-600 dark:text-green-400">Price:</span>
                          <span className="ml-2 text-green-800 dark:text-green-300">{tokenData.price}</span>
                        </div>
                        <div>
                          <span className="text-green-600 dark:text-green-400">24h Volume:</span>
                          <span className="ml-2 text-green-800 dark:text-green-300">{tokenData.volume?.h24}</span>
                        </div>
                        <div>
                          <span className="text-green-600 dark:text-green-400">24h Change:</span>
                          <span className="ml-2 text-green-800 dark:text-green-300">{tokenData.priceChange?.h24}%</span>
                        </div>
                        <div>
                          <span className="text-green-600 dark:text-green-400">24h Buys:</span>
                          <span className="ml-2 text-green-800 dark:text-green-300">{tokenData.txns?.h24?.buys}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Admin Wallet + Session Update */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Admin Wallet Setup & Session Update
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Create a new admin wallet or import an existing one, then update the session file.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setAdminWalletOption('create')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    adminWalletOption === 'create'
                      ? 'border-solana-500 bg-solana-50 dark:bg-solana-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <h4 className="font-medium text-gray-900 dark:text-white">Create New</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Generate a new admin wallet</p>
                </button>

                <button
                  onClick={() => setAdminWalletOption('import')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    adminWalletOption === 'import'
                      ? 'border-solana-500 bg-solana-50 dark:bg-solana-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <h4 className="font-medium text-gray-900 dark:text-white">Import Existing</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Use existing wallet private key</p>
                </button>
              </div>

              {adminWalletOption === 'import' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Private Key
                  </label>
                  <div className="relative">
                    <input
                      type={showPrivateKey ? "text" : "password"}
                      value={adminPrivateKey}
                      onChange={(e) => setAdminPrivateKey(e.target.value)}
                      placeholder="Enter admin wallet private key..."
                      className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-solana-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {adminWallet && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">
                    Admin Wallet Ready & Session Updated
                  </h4>
                  <p className="text-sm text-green-600 dark:text-green-400 font-mono">
                    {adminWallet.publicKey}
                  </p>
                  <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                    Deposit funds to this wallet and press Next to continue
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Wallet Generation + Session Update */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Trading Wallet Generation & Session Update
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Generate trading wallets and update the session file.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Wallets (1-100)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={walletCount}
                  onChange={(e) => setWalletCount(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-solana-500 focus:border-transparent"
                />
              </div>

              {tradingWallets.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">
                    {tradingWallets.length} Trading Wallets Generated & Session Updated
                  </h4>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Wallets are ready for SOL distribution in the next step.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: SOL Distribution */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  SOL Distribution
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Distribute SOL from admin wallet to trading wallets.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total SOL Amount to Distribute
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={solAmount}
                  onChange={(e) => setSolAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-solana-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Each wallet will receive approximately {(solAmount / walletCount).toFixed(6)} SOL
                </p>
              </div>

              {tradingWallets.some(w => w.solBalance > 0) && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">
                    SOL Distribution Complete
                  </h4>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {tradingWallets.filter(w => w.solBalance > 0).length} wallets funded successfully
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Token Distribution (Optional) */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Token Distribution (Optional)
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  If admin wallet has tokens, they will be distributed to trading wallets.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                  Automatic Token Distribution
                </h4>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  The system will check if your admin wallet has any {tokenData?.symbol} tokens and distribute them automatically.
                  If no tokens are found, this step will be skipped.
                </p>
              </div>
            </div>
          )}

          {/* Step 6: Trading Strategy */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Trading Strategy Selection
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose your trading strategy to start automated trading.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => startTradingWithStrategy('INCREASE_MAKERS_VOLUME')}
                  disabled={isLoading}
                  className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-left hover:border-solana-500 hover:bg-solana-50 dark:hover:bg-solana-900/20 transition-colors disabled:opacity-50"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Increase Makers + Volume
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Comprehensive strategy to increase both maker count and trading volume
                  </p>
                </button>

                <button
                  onClick={() => startTradingWithStrategy('INCREASE_VOLUME_ONLY')}
                  disabled={isLoading}
                  className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-left hover:border-solana-500 hover:bg-solana-50 dark:hover:bg-solana-900/20 transition-colors disabled:opacity-50"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Increase Volume Only
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Focus solely on increasing trading volume
                  </p>
                </button>
              </div>

              {/* Session Summary */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Final Session Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Token:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{tokenData?.name} ({tokenData?.symbol})</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Wallets:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{tradingWallets.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total SOL:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{solAmount} SOL</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Session File:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{sessionFileName}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {currentStep < 6 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleBack}
              disabled={currentStep === 1 || isLoading}
              className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={isLoading}
              className="flex items-center px-6 py-2 bg-solana-600 hover:bg-solana-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Processing...' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MainSessionFlow