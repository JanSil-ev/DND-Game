import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface CampaignStat {
  label: string;
  value: number;
}

interface CampaignStatsState {
  stats: CampaignStat[];
}

const initialState: CampaignStatsState = {
  stats: [
  ],
};

const campaignStatsSlice = createSlice({
  name: 'campaignStats',
  initialState,
  reducers: {
    setCampaignStats(state, action: PayloadAction<CampaignStat[]>) {
      state.stats = action.payload;
    },
  },
});

export const { setCampaignStats } = campaignStatsSlice.actions;
export const campaignStatsReducer = campaignStatsSlice.reducer;
