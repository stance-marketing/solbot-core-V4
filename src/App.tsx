import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'
import Trading from './pages/Trading'
import Wallets from './pages/Wallets'
import Settings from './pages/Settings'
import Monitoring from './pages/Monitoring'
import { initializeWebSocket } from './store/slices/websocketSlice'
import { initializeAuth } from './store/slices/authSlice'
import { AppDispatch, RootState } from './store/store'
import { systemLogger } from './services/loggingService'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    // Initialize authentication state
    dispatch(initializeAuth())
    
    // DO NOT initialize theme - let it stay as forced dark theme from initialState
    // Force dark theme on document
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('light')
    }
    
    // Initialize WebSocket connection with error handling (only if authenticated)
    if (isAuthenticated) {
      try {
        dispatch(initializeWebSocket())
      } catch (error) {
        console.error("Failed to initialize WebSocket:", error);
        systemLogger.error('WebSocket initialization failed', error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error));
      }
    }
    
    // Log application start
    systemLogger.info('Application started')
    
    return () => {
      systemLogger.info('Application shutting down')
    }
  }, [dispatch, isAuthenticated])

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
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
          </ProtectedRoute>
        } />
      </Routes>
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