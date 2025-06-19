import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'
import Trading from './pages/Trading'
import Wallets from './pages/Wallets'
import Settings from './pages/Settings'
import Monitoring from './pages/Monitoring'
import { initializeWebSocket } from './store/slices/websocketSlice'
import { initializeTheme } from './store/slices/themeSlice'
import { AppDispatch } from './store/store'
import { systemLogger } from './services/loggingService'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    // Initialize theme
    dispatch(initializeTheme())
    
    // Initialize WebSocket connection with error handling
    try {
      dispatch(initializeWebSocket())
    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
      systemLogger.error('WebSocket initialization failed', 'app', error);
    }
    
    // Log application start
    systemLogger.info('Application started')
    
    return () => {
      systemLogger.info('Application shutting down')
    }
  }, [dispatch])

  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/trading" element={<Trading />} />
          <Route path="/wallets" element={<Wallets />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/monitoring" element={<Monitoring />} />
        </Routes>
      </Layout>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            border: '1px solid var(--toast-border)',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
            duration: 5000,
          },
        }}
      />
    </ErrorBoundary>
  )
}

export default App