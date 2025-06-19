import { configureStore } from '@reduxjs/toolkit'
import themeReducer from './slices/themeSlice'
import websocketReducer from './slices/websocketSlice'
import sessionReducer from './slices/sessionSlice'
import tradingReducer from './slices/tradingSlice'
import walletReducer from './slices/walletSlice'
import configReducer from './slices/configSlice'
import loggingReducer from './slices/loggingSlice'
import authReducer from './slices/authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    websocket: websocketReducer,
    session: sessionReducer,
    trading: tradingReducer,
    wallet: walletReducer,
    config: configReducer,
    logging: loggingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['websocket/setConnection'],
        ignoredPaths: ['websocket.connection'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch