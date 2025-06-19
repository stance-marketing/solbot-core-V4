import React, { useState } from 'react'
import { 
  Save, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Sliders,
  Info
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ConfigField {
  key: string
  label: string
  type: string
  description: string
  step?: string
}

interface ConfigSection {
  title: string
  icon: React.ComponentType<{ className?: string }>
  fields: ConfigField[]
}

interface ConfigurationEditorProps {
  config: any
  sections: ConfigSection[]
  onSave: (config: any) => void
  onReset: () => void
  hasUnsavedChanges: boolean
  isLoading: boolean
}

const ConfigurationEditor: React.FC<ConfigurationEditorProps> = ({
  config,
  sections,
  onSave,
  onReset,
  hasUnsavedChanges,
  isLoading
}) => {
  const [localConfig, setLocalConfig] = useState({ ...config })
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(sections.map(s => s.title)))

  const handleInputChange = (key: string, value: any) => {
    // Convert numeric strings to numbers
    const processedValue = !isNaN(Number(value)) && value !== '' ? Number(value) : value
    setLocalConfig({ ...localConfig, [key]: processedValue })
  }

  const handleSave = () => {
    onSave(localConfig)
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      onReset()
      setLocalConfig({ ...config })
    }
  }

  const handleDiscardChanges = () => {
    setLocalConfig({ ...config })
    toast.success('Changes discarded')
  }

  const toggleSection = (title: string) => {
    const newExpandedSections = new Set(expandedSections)
    if (newExpandedSections.has(title)) {
      newExpandedSections.delete(title)
    } else {
      newExpandedSections.add(title)
    }
    setExpandedSections(newExpandedSections)
  }

  const hasChanges = JSON.stringify(localConfig) !== JSON.stringify(config)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configuration Editor
          </h2>
        </div>
        
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <button
              onClick={handleDiscardChanges}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Discard Changes
            </button>
          )}
          
          <button
            onClick={handleReset}
            className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </button>
          
          <button
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
            className="flex items-center px-4 py-2 bg-solana-600 hover:bg-solana-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Configuration
          </button>
        </div>
      </div>

      {/* Warning for unsaved changes */}
      {hasChanges && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-300">
                Unsaved Changes
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                You have made changes to the configuration. Click "Save Configuration" to apply these changes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Sections */}
      {sections.map((section) => {
        const Icon = section.icon
        const isExpanded = expandedSections.has(section.title)
        
        return (
          <div key={section.title} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div 
              className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              onClick={() => toggleSection(section.title)}
            >
              <div className="flex items-center space-x-2">
                <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {section.title}
                </h3>
              </div>
              
              <div className="transform transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {isExpanded && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {section.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        value={localConfig[field.key]}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        step={field.step}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {field.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Save Button (Bottom) */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center px-6 py-3 bg-solana-600 hover:bg-solana-700 text-white font-medium rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Save Changes
          </button>
        </div>
      )}
    </div>
  )
}

export default ConfigurationEditor