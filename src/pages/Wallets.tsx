import React from 'react'

const Wallets: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Wallets
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your trading wallets
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Wallet management coming soon...
        </p>
      </div>
    </div>
  )
}

export default Wallets