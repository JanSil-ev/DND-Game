import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../app/store/store';
import { locations } from './location';
import type { MapLocation } from './types';
import { readUserLocations } from './userLocations';

interface MapLocationsState { locations: MapLocation[]; ready: boolean; error: string | null }
const initialState: MapLocationsState = { locations: [], ready: true, error: null };

export function readMapLocations(): MapLocationsState {
  try { return { ...initialState, locations: readUserLocations() }; }
  catch {
    return { locations: [], ready: false, error: 'Не удалось прочитать сохранённые метки. Они не будут перезаписаны.' };
  }
}

const slice = createSlice({
  name: 'mapLocations', initialState,
  reducers: {
    mapLocationsSaved(state, action: PayloadAction<MapLocation[]>) {
      state.locations = action.payload;
      state.ready = true;
      state.error = null;
    },
    mapLocationsSaveFailed(state, action: PayloadAction<string>) { state.error = action.payload; },
  },
});
export const { mapLocationsSaved, mapLocationsSaveFailed } = slice.actions;
export const mapLocationsReducer = slice.reducer;
export const selectMapLocations = createSelector(
  [(state: RootState) => state.mapLocations.locations],
  (userLocations): MapLocation[] => [...locations, ...userLocations],
);
