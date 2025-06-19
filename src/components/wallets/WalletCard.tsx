import React from 'react'
import { 
  Wallet, 
  Copy, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  Activity,
  DollarSign,
  Coins
} from 'lucide-react'
import { WalletData } from '../../store/slices/walletSlice'

interface WalletCardProps {
  wallet: WalletData
  isAdmin: boolean
  showPrivateKey: boolean
  onCopy: (text: string, label: string) => void
  tokenSymbol?: string
  compact?: boolean
}

const WalletCard: React.FC<WalletCardProps> = ({
  wallet,
  isAdmin,
  showPrivateKey,
  onCopy,
  tokenSymbol = 'Tokens',
  compact = false
}) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`
  }

  const getStatusColor = () => {
    if (isAdmin) return 'text-primary'
    if (wallet.isActive) return 'text-secondary'
    return 'text-muted-foreground'
  }

  const getStatusIcon = () => {
    if (isAdmin) return <CheckCircle className="w-4 h-4" />
    if (wallet.isActive) return <Activity className="w-4 h-4" />
    return <AlertCircle className="w-4 h-4" />
  }

  const getStatusText = () => {
    if (isAdmin) return 'Admin'
    if (wallet.isActive) return 'Active'
    return 'Inactive'
  }

  if (compact) {
    return (
      <div className="card p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Wallet #{wallet.number}
            </span>
          </div>
          <div className={`flex items-center space-x-1 text-xs ${getStatusColor()}`}>
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Address:</span>
            <button
              onClick={() => onCopy(wallet.publicKey, 'Address')}
              className="flex items-center space-x-1 text-xs text-foreground hover:text-primary"
            >
              <span className="font-mono">{formatAddress(wallet.publicKey)}</span>
              <Copy className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">SOL:</span>
            <span className="text-xs font-medium text-foreground">
              {wallet.solBalance.toFixed(6)}
            </span>
          </div>

          {wallet.tokenBalance > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{tokenSymbol}:</span>
              <span className="text-xs font-medium text-foreground">
                {wallet.tokenBalance.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isAdmin ? 'bg-primary/10' : 'bg-secondary/10'}`}>
            <Wallet className={`w-5 h-5 ${isAdmin ? 'text-primary' : 'text-secondary'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {isAdmin ? 'Admin Wallet' : `Trading Wallet #${wallet.number}`}
            </h3>
            <div className={`flex items-center space-x-1 text-sm ${getStatusColor()}`}>
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </div>
          </div>
        </div>

        {wallet.lastActivity && (
          <div className="text-xs text-muted-foreground">
            Last active: {new Date(wallet.lastActivity).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">SOL Balance</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {wallet.solBalance.toFixed(6)}
          </p>
        </div>

        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Coins className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-foreground">{tokenSymbol}</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {wallet.tokenBalance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">
              Public Address
            </label>
            <button
              onClick={() => onCopy(wallet.publicKey, 'Public address')}
              className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </button>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-sm font-mono text-foreground break-all">
              {wallet.publicKey}
            </p>
          </div>
        </div>

        {/* Private Key */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">
              Private Key
            </label>
            <button
              onClick={() => onCopy(wallet.privateKey, 'Private key')}
              className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </button>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            {showPrivateKey ? (
              <p className="text-sm font-mono text-foreground break-all">
                {wallet.privateKey}
              </p>
            ) : (
              <div className="flex items-center space-x-2">
                <EyeOff className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Private key hidden for security
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Generation Timestamp */}
        {wallet.generationTimestamp && (
          <div className="text-xs text-muted-foreground">
            Generated: {new Date(wallet.generationTimestamp).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}

export default WalletCard