import { configureStore } from '@reduxjs/toolkit';
import { campaignStatsReducer } from './campaignStatsSlice';

export const store = configureStore({
  reducer: {
    campaignStats: campaignStatsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
