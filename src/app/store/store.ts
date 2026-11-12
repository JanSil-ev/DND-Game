import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { campaignStatsReducer } from './campaignStatsSlice';
import { charactersReducer } from '../../modules/characters/model/charactersSlice';
import { clubReducer, clubStorageKey, readClub, updateClubProfile, updateRoom, updateTreasury, addAnnouncement, updateAnnouncement, deleteAnnouncement, setClubStorageError, retryClubSave } from '../../modules/club/model/clubSlice';
import { addNpc, updateNpc, deleteNpc, retryNpcSave, npcReducer, npcStorageKey, readNpcs, setNpcStorageError } from '../../modules/npc/model/npcSlice';
import { addItem, updateItem, deleteItem, retryInventorySave, inventoryReducer, inventoryStorageKey, readInventory, setInventoryStorageError } from '../../modules/inventory/model/inventorySlice';
import { mapLocationsReducer, readMapLocations } from '../../modules/map/model/mapLocationsSlice';
import { addNote, updateNote, deleteNote, retryNotesSave, notesReducer, notesStorageKey, readNotes, setNotesStorageError } from '../../modules/notes/model/notesSlice';

const notesPersistence = createListenerMiddleware();
notesPersistence.startListening({
  matcher: isAnyOf(updateClubProfile, updateRoom, updateTreasury, addAnnouncement, updateAnnouncement, deleteAnnouncement, retryClubSave),
  effect: (_, api) => {
    const { club } = api.getState() as RootState;
    if (club.readOnly) return;
    try {
      const { profile, rooms, treasury, announcements } = club;
      window.localStorage.setItem(clubStorageKey, JSON.stringify({ profile, rooms, treasury, announcements }));
      api.dispatch(setClubStorageError(null));
    } catch {
      api.dispatch(setClubStorageError('Изменения есть в этой вкладке, но сохранить организацию в браузере не удалось. Повторите сохранение перед закрытием страницы.'));
    }
  },
});
notesPersistence.startListening({
  matcher: isAnyOf(addNpc, updateNpc, deleteNpc, retryNpcSave),
  effect: (_, api) => {
    const { npcs } = api.getState() as RootState;
    if (npcs.readOnly) return;
    try {
      window.localStorage.setItem(npcStorageKey, JSON.stringify(npcs.items));
      api.dispatch(setNpcStorageError(null));
    } catch {
      api.dispatch(setNpcStorageError('NPC изменены в этой вкладке, но сохранить их в браузере не удалось. Попробуйте уменьшить портреты и повторить сохранение перед закрытием страницы.'));
    }
  },
});
notesPersistence.startListening({
  matcher: isAnyOf(addItem, updateItem, deleteItem, retryInventorySave),
  effect: (_, api) => {
    const state = api.getState() as RootState;
    if (state.inventory.readOnly) return;
    try {
      window.localStorage.setItem(inventoryStorageKey, JSON.stringify(state.inventory.items));
      api.dispatch(setInventoryStorageError(null));
    } catch {
      api.dispatch(setInventoryStorageError('Изменения есть в этой вкладке, но сохранить инвентарь в браузере не удалось. Попробуйте уменьшить изображения и повторить сохранение перед закрытием страницы.'));
    }
  },
});
notesPersistence.startListening({
  matcher: isAnyOf(addNote, updateNote, deleteNote, retryNotesSave),
  effect: (_, api) => {
    const state = api.getState() as RootState;
    if (state.notes.readOnly) return;
    try {
      window.localStorage.setItem(notesStorageKey, JSON.stringify(state.notes.items));
      api.dispatch(setNotesStorageError(null));
    } catch {
      api.dispatch(setNotesStorageError('Заметки изменены в этой вкладке, но сохранить их в браузере не удалось. Повторите сохранение перед закрытием страницы.'));
    }
  },
});

export const store = configureStore({
  reducer: {
    club: clubReducer,
    npcs: npcReducer,
    inventory: inventoryReducer,
    mapLocations: mapLocationsReducer,
    notes: notesReducer,
    characters: charactersReducer,
    campaignStats: campaignStatsReducer,
  },
  preloadedState: { club: readClub(), npcs: readNpcs(), inventory: readInventory(), notes: readNotes(), mapLocations: readMapLocations() },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(notesPersistence.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
