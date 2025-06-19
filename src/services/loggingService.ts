import { store } from '../store/store'
import { addLog, addConsoleOutput, LogLevel } from '../store/slices/loggingSlice'

class LoggingService {
  private static instance: LoggingService
  
  private constructor() {
    // Initialize any logging configuration here
    console.log('Logging service initialized')
  }
  
  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService()
    }
    return LoggingService.instance
  }
  
  /**
   * Log a debug message
   */
  public debug(message: string, source: string = 'app', details?: any): void {
    this.log('debug', message, source, details)
    console.debug(`[DEBUG] [${source}] ${message}`, details)
  }
  
  /**
   * Log an info message
   */
  public info(message: string, source: string = 'app', details?: any): void {
    this.log('info', message, source, details)
    console.info(`[INFO] [${source}] ${message}`, details)
  }
  
  /**
   * Log a warning message
   */
  public warning(message: string, source: string = 'app', details?: any): void {
    this.log('warning', message, source, details)
    console.warn(`[WARNING] [${source}] ${message}`, details)
  }
  
  /**
   * Log an error message
   */
  public error(message: string, source: string = 'app', details?: any): void {
    this.log('error', message, source, details)
    console.error(`[ERROR] [${source}] ${message}`, details)
  }
  
  /**
   * Log a success message
   */
  public success(message: string, source: string = 'app', details?: any): void {
    this.log('success', message, source, details)
    console.log(`[SUCCESS] [${source}] ${message}`, details)
  }
  
  /**
   * Add a raw console output line
   */
  public console(line: string): void {
    store.dispatch(addConsoleOutput(line))
  }
  
  /**
   * Internal method to log a message with a specific level
   */
  private log(level: LogLevel, message: string, source: string, details?: any): void {
    store.dispatch(addLog({
      level,
      message,
      source,
      details
    }))
  }
  
  /**
   * Create a logger for a specific source
   */
  public createLogger(source: string) {
    return {
      debug: (message: string, details?: any) => this.debug(message, source, details),
      info: (message: string, details?: any) => this.info(message, source, details),
      warning: (message: string, details?: any) => this.warning(message, source, details),
      error: (message: string, details?: any) => this.error(message, source, details),
      success: (message: string, details?: any) => this.success(message, source, details)
    }
  }
}

// Export a singleton instance
export const logger = LoggingService.getInstance()

// Create some common loggers
export const tradingLogger = logger.createLogger('trading')
export const walletLogger = logger.createLogger('wallet')
export const sessionLogger = logger.createLogger('session')
export const networkLogger = logger.createLogger('network')
export const systemLogger = logger.createLogger('system')