import { configureStore } from '@reduxjs/toolkit'
import themeReducer from './slices/themeSlice'
import websocketReducer from './slices/websocketSlice'
import sessionReducer from './slices/sessionSlice'
import tradingReducer from './slices/tradingSlice'
import walletReducer from './slices/walletSlice'
import configReducer from './slices/configSlice'
import loggingReducer from './slices/loggingSlice'

export const store = configureStore({
  reducer: {
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