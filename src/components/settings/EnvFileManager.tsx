import React, { useState } from 'react'
import { 
  FileText, 
  Download, 
  Upload, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import { backendService } from '../../services/backendService'
import toast from 'react-hot-toast'

const EnvFileManager: React.FC = () => {
  const { currentSession } = useSelector((state: RootState) => state.session)
  const { adminWallet, tradingWallets } = useSelector((state: RootState) => state.wallet)
  const { swapConfig } = useSelector((state: RootState) => state.config)
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [envContent, setEnvContent] = useState<string | null>(null)
  const [showEnvContent, setShowEnvContent] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const generateEnvFile = async () => {
    if (!currentSession) {
      toast.error('No active session')
      return
    }

    setIsGenerating(true)
    try {
      const content = await backendService.generateEnvFile(currentSession)
      setEnvContent(content)
      toast.success('Environment file generated')
    } catch (error) {
      toast.error(`Failed to generate environment file: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadEnvFile = () => {
    if (!envContent) {
      toast.error('No environment file content')
      return
    }

    const blob = new Blob([envContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentSession?.tokenName || 'solana-trading-bot'}.env`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Environment file downloaded')
  }

  const copyToClipboard = async () => {
    if (!envContent) {
      toast.error('No environment file content')
      return
    }

    try {
      await navigator.clipboard.writeText(envContent)
      toast.success('Environment file content copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        setEnvContent(content)
        parseEnvFile(content)
        toast.success('Environment file uploaded')
      } catch (error) {
        toast.error(`Failed to parse environment file: ${error.message}`)
      } finally {
        setIsUploading(false)
      }
    }
    
    reader.onerror = () => {
      toast.error('Failed to read file')
      setIsUploading(false)
    }
    
    reader.readAsText(file)
  }

  const parseEnvFile = (content: string) => {
    const lines = content.split('\n')
    const envVars: Record<string, string> = {}
    
    lines.forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        const [, key, value] = match
        envVars[key.trim()] = value.trim()
      }
    })
    
    console.log('Parsed environment variables:', envVars)
    // Here you could update your application state with these values
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Environment File Management
          </h2>
        </div>
      </div>

      <div className="space-y-6">
        {/* Generate & Download */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">
            Generate Environment File
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={generateEnvFile}
              disabled={isGenerating || !currentSession}
              className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Generate .env File
            </button>
            
            <button
              onClick={downloadEnvFile}
              disabled={!envContent}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
            
            <button
              onClick={copyToClipboard}
              disabled={!envContent}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </button>
          </div>
          
          {!currentSession && (
            <div className="mt-3 text-sm text-red-600 dark:text-red-400">
              You need an active session to generate an environment file
            </div>
          )}
        </div>

        {/* Upload */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">
            Upload Environment File
          </h3>
          
          <div className="flex items-center space-x-3">
            <label className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg cursor-pointer transition-colors">
              <Upload className="w-4 h-4 mr-2" />
              Upload .env File
              <input
                type="file"
                accept=".env"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            
            {isUploading && (
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        {envContent && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Environment File Preview
              </h3>
              
              <button
                onClick={() => setShowEnvContent(!showEnvContent)}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {showEnvContent ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-1" />
                    <span className="text-sm">Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-1" />
                    <span className="text-sm">Show</span>
                  </>
                )}
              </button>
            </div>
            
            {showEnvContent ? (
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
                {envContent}
              </pre>
            ) : (
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm text-gray-600 dark:text-gray-400 text-center">
                Environment file content is hidden for security
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-300">
                About Environment Files
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                Environment files (.env) contain configuration settings and sensitive information like wallet private keys and RPC URLs. Keep these files secure and never share them publicly. You can use these files to quickly set up your trading bot on different machines.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnvFileManager