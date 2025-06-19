import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'
import Trading from './pages/Trading'
import Wallets from './pages/Wallets'
import Settings from './pages/Settings'
import Monitoring from './pages/Monitoring'
import { initializeWebSocket } from './store/slices/websocketSlice'
import { AppDispatch } from './store/store'
import { systemLogger } from './services/loggingService'

function App() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    // Initialize WebSocket connection
    dispatch(initializeWebSocket())
    
    // Log application start
    systemLogger.info('Application started')
    
    return () => {
      systemLogger.info('Application shutting down')
    }
  }, [dispatch])

  return (
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
  )
}

export default App