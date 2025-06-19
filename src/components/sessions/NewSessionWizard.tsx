import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { X, ArrowRight, ArrowLeft, Check, AlertCircle, Loader2, Wallet, DollarSign } from 'lucide-react'
import { backendService } from '../../services/backendService'
import { setCurrentSession } from '../../store/slices/sessionSlice'
import { setAdminWallet, setTradingWallets } from '../../store/slices/walletSlice'
import { WalletData } from '../../store/slices/walletSlice'
import toast from 'react-hot-toast'

interface NewSessionWizardProps {
  isOpen: boolean
  onClose: () => void
}

interface TokenData {
  name: string
  symbol: string
  price: string
  volume24h: string
  priceChange24h: string
}

const NewSessionWizard: React.FC<NewSessionWizardProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setErrorState] = useState<string | null>(null)

  // Form data
  const [tokenAddress, setTokenAddress] = useState('')
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [poolKeys, setPoolKeys] = useState<any>(null)
  const [adminWalletOption, setAdminWalletOption] = useState<'create' | 'import'>('create')
  const [adminPrivateKey, setAdminPrivateKey] = useState('')
  const [adminWallet, setAdminWalletState] = useState<WalletData | null>(null)
  const [walletCount, setWalletCount] = useState(10)
  const [solAmount, setSolAmount] = useState(1.0)
  const [tradingWallets, setTradingWalletsState] = useState<WalletData[]>([])

  const steps = [
    { id: 1, name: 'Token Discovery', description: 'Enter and validate token address' },
    { id: 2, name: 'Admin Wallet', description: 'Create or import admin wallet' },
    { id: 3, name: 'Wallet Setup', description: 'Configure trading wallets' },
    { id: 4, name: 'Funding', description: 'Distribute SOL to wallets' },
    { id: 5, name: 'Review', description: 'Review and create session' }
  ]

  const resetWizard = () => {
    setCurrentStep(1)
    setTokenAddress('')
    setTokenData(null)
    setPoolKeys(null)
    setAdminWalletOption('create')
    setAdminPrivateKey('')
    setAdminWalletState(null)
    setWalletCount(10)
    setSolAmount(1.0)
    setTradingWalletsState([])
    setErrorState(null)
    setIsLoading(false)
  }

  const handleClose = () => {
    resetWizard()
    onClose()
  }

  const validateTokenAddress = async () => {
    if (!tokenAddress.trim()) {
      setErrorState('Please enter a token address')
      return false
    }

    setIsLoading(true)
    setErrorState(null)

    try {
      const result = await backendService.validateTokenAddress(tokenAddress)
      if (result.isValid && result.tokenData) {
        setTokenData(result.tokenData)
        
        // Get pool keys
        const keys = await backendService.getPoolKeys(tokenAddress)
        setPoolKeys(keys)
        
        return true
      } else {
        setErrorState('Invalid token address or token not found')
        return false
      }
    } catch (error) {
      setErrorState(`Failed to validate token: ${error.message}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const createAdminWallet = async () => {
    setIsLoading(true)
    setErrorState(null)

    try {
      const wallet = await backendService.createAdminWallet(
        adminWalletOption === 'import' ? adminPrivateKey : undefined
      )
      setAdminWalletState(wallet)
      return true
    } catch (error) {
      setErrorState(`Failed to create admin wallet: ${error.message}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const generateTradingWallets = async () => {
    if (walletCount < 1 || walletCount > 100) {
      setErrorState('Wallet count must be between 1 and 100')
      return false
    }

    setIsLoading(true)
    setErrorState(null)

    try {
      const wallets = await backendService.generateWallets(walletCount)
      setTradingWalletsState(wallets)
      return true
    } catch (error) {
      setErrorState(`Failed to generate wallets: ${error.message}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const distributeFunds = async () => {
    if (!adminWallet || tradingWallets.length === 0) {
      setErrorState('Admin wallet and trading wallets are required')
      return false
    }

    if (solAmount <= 0) {
      setErrorState('SOL amount must be greater than 0')
      return false
    }

    setIsLoading(true)
    setErrorState(null)

    try {
      const updatedWallets = await backendService.distributeSol(adminWallet, tradingWallets, solAmount)
      setTradingWalletsState(updatedWallets)
      return true
    } catch (error) {
      setErrorState(`Failed to distribute SOL: ${error.message}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const createSession = async () => {
    if (!tokenData || !adminWallet || tradingWallets.length === 0 || !poolKeys) {
      setErrorState('All steps must be completed')
      return
    }

    setIsLoading(true)
    setErrorState(null)

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

      const filename = await backendService.saveSession(sessionData)
      
      // Update Redux store
      dispatch(setCurrentSession(sessionData))
      dispatch(setAdminWallet(adminWallet))
      dispatch(setTradingWallets(tradingWallets))

      toast.success(`Session created successfully: ${filename}`)
      handleClose()
    } catch (error) {
      setErrorState(`Failed to create session: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = async () => {
    let canProceed = false

    switch (currentStep) {
      case 1:
        canProceed = await validateTokenAddress()
        break
      case 2:
        canProceed = await createAdminWallet()
        break
      case 3:
        canProceed = await generateTradingWallets()
        break
      case 4:
        canProceed = await distributeFunds()
        break
      case 5:
        await createSession()
        return
    }

    if (canProceed) {
      setCurrentStep(currentStep + 1)
      setErrorState(null)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setErrorState(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Session
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Step {currentStep} of {steps.length}: {steps[currentStep - 1].name}
            </p>
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
                  <div className={`w-12 h-1 mx-2 ${
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

          {/* Step 1: Token Discovery */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Token Discovery
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter the token address to validate and discover pool information.
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

              {tokenData && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">
                    Token Validated Successfully
                  </h4>
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
                      <span className="text-green-600 dark:text-green-400">Price:</span>
                      <span className="ml-2 text-green-800 dark:text-green-300">{tokenData.price}</span>
                    </div>
                    <div>
                      <span className="text-green-600 dark:text-green-400">24h Volume:</span>
                      <span className="ml-2 text-green-800 dark:text-green-300">{tokenData.volume24h}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Admin Wallet */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Admin Wallet Setup
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Create a new admin wallet or import an existing one.
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
                  <Wallet className="w-6 h-6 text-solana-600 dark:text-solana-400 mb-2" />
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
                  <DollarSign className="w-6 h-6 text-solana-600 dark:text-solana-400 mb-2" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Import Existing</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Use existing wallet private key</p>
                </button>
              </div>

              {adminWalletOption === 'import' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Private Key
                  </label>
                  <input
                    type="password"
                    value={adminPrivateKey}
                    onChange={(e) => setAdminPrivateKey(e.target.value)}
                    placeholder="Enter admin wallet private key..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-solana-500 focus:border-transparent"
                  />
                </div>
              )}

              {adminWallet && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">
                    Admin Wallet Ready
                  </h4>
                  <p className="text-sm text-green-600 dark:text-green-400 font-mono">
                    {adminWallet.publicKey}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Wallet Setup */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Trading Wallet Setup
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Configure the number of trading wallets to generate.
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
                    {tradingWallets.length} Trading Wallets Generated
                  </h4>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Wallets are ready for funding in the next step.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Funding */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  SOL Distribution
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Specify the total amount of SOL to distribute among trading wallets.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total SOL Amount
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

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Review Session
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Review all settings before creating the session.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Token Information</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>Name: {tokenData?.name}</p>
                      <p>Symbol: {tokenData?.symbol}</p>
                      <p className="font-mono text-xs">{tokenAddress}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Admin Wallet</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p className="font-mono text-xs">{adminWallet?.publicKey}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Trading Setup</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>Wallets: {tradingWallets.length}</p>
                      <p>Total SOL: {solAmount} SOL</p>
                      <p>SOL per wallet: {(solAmount / walletCount).toFixed(6)} SOL</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Session File</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>{tokenData?.name}_{new Date().toLocaleDateString().replace(/\//g, '.')}_session.json</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
            ) : currentStep === 5 ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            {isLoading ? 'Processing...' : currentStep === 5 ? 'Create Session' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewSessionWizard