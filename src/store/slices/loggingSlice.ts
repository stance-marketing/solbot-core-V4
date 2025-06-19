import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'success'

export interface LogEntry {
  id: string
  timestamp: number
  level: LogLevel
  message: string
  source: string
  details?: any
}

interface LoggingState {
  logs: LogEntry[]
  consoleOutput: string[]
  errors: {
    id: string
    timestamp: number
    message: string
    source: string
    stack?: string
    resolved: boolean
    resolvedAt?: number
    severity: 'critical' | 'high' | 'medium' | 'low'
    occurrences: number
    lastOccurrence: number
  }[]
  maxLogEntries: number
  maxConsoleLines: number
  maxErrors: number
  isLoggingEnabled: boolean
  isConsoleEnabled: boolean
  isErrorTrackingEnabled: boolean
}

const initialState: LoggingState = {
  logs: [],
  consoleOutput: [],
  errors: [],
  maxLogEntries: 1000,
  maxConsoleLines: 500,
  maxErrors: 100,
  isLoggingEnabled: true,
  isConsoleEnabled: true,
  isErrorTrackingEnabled: true
}

const loggingSlice = createSlice({
  name: 'logging',
  initialState,
  reducers: {
    addLog: (state, action: PayloadAction<Omit<LogEntry, 'id' | 'timestamp'>>) => {
      if (!state.isLoggingEnabled) return

      const log: LogEntry = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        timestamp: Date.now()
      }

      state.logs.push(log)
      
      // Trim logs if exceeding max entries
      if (state.logs.length > state.maxLogEntries) {
        state.logs = state.logs.slice(-state.maxLogEntries)
      }
      
      // Add to console output
      if (state.isConsoleEnabled) {
        const consoleEntry = `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`
        state.consoleOutput.push(consoleEntry)
        
        // Trim console output if exceeding max lines
        if (state.consoleOutput.length > state.maxConsoleLines) {
          state.consoleOutput = state.consoleOutput.slice(-state.maxConsoleLines)
        }
      }
      
      // Track errors
      if (state.isErrorTrackingEnabled && log.level === 'error') {
        const errorMessage = log.message
        const errorKey = errorMessage.slice(0, 100) // Use first 100 chars as key
        
        const existingErrorIndex = state.errors.findIndex(e => 
          e.message.slice(0, 100) === errorKey
        )
        
        if (existingErrorIndex >= 0) {
          // Update existing error
          state.errors[existingErrorIndex].occurrences += 1
          state.errors[existingErrorIndex].lastOccurrence = log.timestamp
        } else {
          // Add new error
          state.errors.push({
            id: log.id,
            timestamp: log.timestamp,
            message: errorMessage,
            source: log.source,
            stack: log.details?.stack,
            resolved: false,
            severity: getSeverity(errorMessage),
            occurrences: 1,
            lastOccurrence: log.timestamp
          })
          
          // Trim errors if exceeding max
          if (state.errors.length > state.maxErrors) {
            state.errors = state.errors.slice(-state.maxErrors)
          }
        }
      }
    },
    
    addConsoleOutput: (state, action: PayloadAction<string>) => {
      if (!state.isConsoleEnabled) return
      
      state.consoleOutput.push(action.payload)
      
      // Trim console output if exceeding max lines
      if (state.consoleOutput.length > state.maxConsoleLines) {
        state.consoleOutput = state.consoleOutput.slice(-state.maxConsoleLines)
      }
    },
    
    resolveError: (state, action: PayloadAction<string>) => {
      const errorIndex = state.errors.findIndex(e => e.id === action.payload)
      if (errorIndex >= 0) {
        state.errors[errorIndex].resolved = true
        state.errors[errorIndex].resolvedAt = Date.now()
      }
    },
    
    clearLogs: (state) => {
      state.logs = []
    },
    
    clearConsole: (state) => {
      state.consoleOutput = []
    },
    
    clearErrors: (state) => {
      state.errors = []
    },
    
    setLoggingEnabled: (state, action: PayloadAction<boolean>) => {
      state.isLoggingEnabled = action.payload
    },
    
    setConsoleEnabled: (state, action: PayloadAction<boolean>) => {
      state.isConsoleEnabled = action.payload
    },
    
    setErrorTrackingEnabled: (state, action: PayloadAction<boolean>) => {
      state.isErrorTrackingEnabled = action.payload
    },
    
    setMaxLogEntries: (state, action: PayloadAction<number>) => {
      state.maxLogEntries = action.payload
      if (state.logs.length > action.payload) {
        state.logs = state.logs.slice(-action.payload)
      }
    },
    
    setMaxConsoleLines: (state, action: PayloadAction<number>) => {
      state.maxConsoleLines = action.payload
      if (state.consoleOutput.length > action.payload) {
        state.consoleOutput = state.consoleOutput.slice(-action.payload)
      }
    },
    
    setMaxErrors: (state, action: PayloadAction<number>) => {
      state.maxErrors = action.payload
      if (state.errors.length > action.payload) {
        state.errors = state.errors.slice(-action.payload)
      }
    }
  }
})

// Helper function to determine error severity
function getSeverity(message: string): 'critical' | 'high' | 'medium' | 'low' {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('critical') || 
      lowerMessage.includes('fatal') || 
      lowerMessage.includes('crash')) {
    return 'critical'
  }
  
  if (lowerMessage.includes('error') || 
      lowerMessage.includes('exception') || 
      lowerMessage.includes('failed')) {
    return 'high'
  }
  
  if (lowerMessage.includes('warning') || 
      lowerMessage.includes('timeout') || 
      lowerMessage.includes('retry')) {
    return 'medium'
  }
  
  return 'low'
}

export const {
  addLog,
  addConsoleOutput,
  resolveError,
  clearLogs,
  clearConsole,
  clearErrors,
  setLoggingEnabled,
  setConsoleEnabled,
  setErrorTrackingEnabled,
  setMaxLogEntries,
  setMaxConsoleLines,
  setMaxErrors
} = loggingSlice.actions

export default loggingSlice.reducer