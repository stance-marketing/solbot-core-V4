import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'
import TokenDiscoveryPage from './pages/TokenDiscovery'
import Trading from './pages/Trading'
import Wallets from './pages/Wallets'
import Settings from './pages/Settings'
import { initializeWebSocket } from './store/slices/websocketSlice'
import { AppDispatch } from './store/store'

function App() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    // Initialize WebSocket connection
    dispatch(initializeWebSocket())
  }, [dispatch])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/token-discovery" element={<TokenDiscoveryPage />} />
        <Route path="/trading" element={<Trading />} />
        <Route path="/wallets" element={<Wallets />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

export default App