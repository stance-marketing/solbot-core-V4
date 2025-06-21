import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface WebSocketMessage {
  id: string
  type: string
  data: any
  timestamp: number
}

interface WebSocketState {
  status: ConnectionStatus
  messages: WebSocketMessage[]
  lastMessage: WebSocketMessage | null
  reconnectAttempts: number
  maxReconnectAttempts: number
  reconnectInterval: number
  url: string
}

// Store WebSocket instance outside of Redux state to avoid serialization issues
let wsInstance: WebSocket | null = null

const initialState: WebSocketState = {
  status: 'disconnected',
  messages: [],
  lastMessage: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectInterval: 3000,
  // Updated WebSocket URL with fallback
  url: 'wss://floral-capable-sun.solana-mainnet.quiknode.pro/569466c8ec8e71909ae64117473d0bd3327e133a/',
}

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.status = action.payload
    },
    addMessage: (state, action: PayloadAction<Omit<WebSocketMessage, 'id' | 'timestamp'>>) => {
      const message: WebSocketMessage = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
      }
      state.messages.push(message)
      state.lastMessage = message
      
      // Keep only last 1000 messages
      if (state.messages.length > 1000) {
        state.messages = state.messages.slice(-1000)
      }
    },
    clearMessages: (state) => {
      state.messages = []
      state.lastMessage = null
    },
    incrementReconnectAttempts: (state) => {
      state.reconnectAttempts += 1
    },
    resetReconnectAttempts: (state) => {
      state.reconnectAttempts = 0
    },
    setUrl: (state, action: PayloadAction<string>) => {
      state.url = action.payload
    },
  },
})

export const {
  setStatus,
  addMessage,
  clearMessages,
  incrementReconnectAttempts,
  resetReconnectAttempts,
  setUrl,
} = websocketSlice.actions

// Improved WebSocket initialization with error handling
export const initializeWebSocket = () => (dispatch: any, getState: any) => {
  const { websocket } = getState()
  
  if (wsInstance) {
    try {
      wsInstance.close()
    } catch (err) {
      console.error("Error closing existing WebSocket:", err)
    }
    wsInstance = null
  }

  const connect = () => {
    dispatch(setStatus('connecting'))
    
    try {
      // Create WebSocket with error handling
      try {
        wsInstance = new WebSocket(websocket.url)
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error)
        dispatch(setStatus('error'))
        dispatch(addMessage({
          type: 'error',
          data: { message: 'Failed to create WebSocket connection', error }
        }))
        
        // Try reconnecting
        const state = getState()
        if (state.websocket.reconnectAttempts < state.websocket.maxReconnectAttempts) {
          dispatch(incrementReconnectAttempts())
          setTimeout(() => {
            console.log(`Reconnecting... Attempt ${state.websocket.reconnectAttempts + 1}`)
            connect()
          }, state.websocket.reconnectInterval)
        }
        return
      }
      
      // Only set event handlers if WebSocket was created successfully
      if (wsInstance) {
        wsInstance.onopen = () => {
          console.log('WebSocket connected to:', websocket.url)
          dispatch(setStatus('connected'))
          dispatch(resetReconnectAttempts())
          dispatch(addMessage({
            type: 'system',
            data: { message: 'Connected to Solana RPC WebSocket' }
          }))
        }
        
        wsInstance.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            dispatch(addMessage({
              type: data.type || 'message',
              data: data
            }))
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
            dispatch(addMessage({
              type: 'raw',
              data: { message: event.data }
            }))
          }
        }
        
        wsInstance.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason)
          wsInstance = null
          dispatch(setStatus('disconnected'))
          dispatch(addMessage({
            type: 'system',
            data: { message: 'Disconnected from Solana RPC WebSocket', code: event.code, reason: event.reason }
          }))
          
          // Attempt to reconnect
          const state = getState()
          if (state.websocket.reconnectAttempts < state.websocket.maxReconnectAttempts) {
            dispatch(incrementReconnectAttempts())
            setTimeout(() => {
              console.log(`Reconnecting... Attempt ${state.websocket.reconnectAttempts + 1}`)
              connect()
            }, state.websocket.reconnectInterval)
          }
        }
        
        wsInstance.onerror = (error) => {
          console.error('WebSocket error:', error)
          dispatch(setStatus('error'))
          dispatch(addMessage({
            type: 'error',
            data: { message: 'WebSocket connection error', error }
          }))
        }
      }
    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error)
      dispatch(setStatus('error'))
      dispatch(addMessage({
        type: 'error',
        data: { message: 'Failed to initialize WebSocket connection', error }
      }))
      
      // Try reconnecting
      const state = getState()
      if (state.websocket.reconnectAttempts < state.websocket.maxReconnectAttempts) {
        dispatch(incrementReconnectAttempts())
        setTimeout(() => {
          console.log(`Reconnecting... Attempt ${state.websocket.reconnectAttempts + 1}`)
          connect()
        }, state.websocket.reconnectInterval)
      }
    }
  }
  
  connect()
}

export const sendMessage = (message: any) => (dispatch: any, getState: any) => {
  const { websocket } = getState()
  
  if (wsInstance && websocket.status === 'connected') {
    try {
      wsInstance.send(JSON.stringify(message))
      dispatch(addMessage({
        type: 'sent',
        data: message
      }))
    } catch (error) {
      console.error('Failed to send WebSocket message:', error)
      dispatch(addMessage({
        type: 'error',
        data: { message: 'Failed to send message', error }
      }))
    }
  } else {
    console.warn('WebSocket not connected, cannot send message')
    dispatch(addMessage({
      type: 'warning',
      data: { message: 'Cannot send message: WebSocket not connected' }
    }))
  }
}

export default websocketSlice.reducer