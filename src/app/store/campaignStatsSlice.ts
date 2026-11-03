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
    { label: 'Персонажей', value: 5 },
    { label: 'NPC', value: 10 },
    { label: 'Заметок', value: 8 },
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
