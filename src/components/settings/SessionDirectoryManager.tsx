import React, { useState, useEffect } from 'react'
import { 
  Folder, 
  FolderOpen, 
  RefreshCw, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Trash2,
  FileText,
  Edit,
  Save
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import toast from 'react-hot-toast'

interface SessionDirectoryManagerProps {
  sessionDir: string
  onSessionDirChange: (dir: string) => void
}

const SessionDirectoryManager: React.FC<SessionDirectoryManagerProps> = ({
  sessionDir,
  onSessionDirChange
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [sessionFiles, setSessionFiles] = useState<string[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [localSessionDir, setLocalSessionDir] = useState(sessionDir)
  
  const { sessionFiles: reduxSessionFiles } = useSelector((state: RootState) => state.session)

  useEffect(() => {
    loadSessionFiles()
  }, [])

  const loadSessionFiles = async () => {
    setIsLoading(true)
    try {
      // In a real implementation, you would call your backend to get the session files
      // For now, we'll use the session files from Redux
      setSessionFiles(reduxSessionFiles)
    } catch (error) {
      toast.error(`Failed to load session files: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSessionDir = () => {
    onSessionDirChange(localSessionDir)
    setIsEditing(false)
    toast.success('Session directory updated')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Folder className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Session Directory Management
          </h2>
        </div>
        
        <button
          onClick={loadSessionFiles}
          disabled={isLoading}
          className="flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="space-y-6">
        {/* Session Directory */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Session Directory
          </label>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={localSessionDir}
                  onChange={(e) => setLocalSessionDir(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  onClick={handleSaveSessionDir}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono">
                  {sessionDir}
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
              </>
            )}
          </div>
        </div>

        {/* Session Files */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Session Files
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {sessionFiles.length} files
            </div>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : sessionFiles.length > 0 ? (
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Filename
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last Modified
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {sessionFiles.map((file, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span>{file}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatFileSize(Math.random() * 10000 + 1000)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date().toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8">
                <FolderOpen className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No session files found</p>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-300">
                About Session Directory
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                The session directory is where your trading session files are stored. These files contain information about your trading sessions, including wallet information, token addresses, and pool keys. Make sure this directory is secure and backed up regularly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SessionDirectoryManager