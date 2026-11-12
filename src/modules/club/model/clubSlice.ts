import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';
import { legacyRoomNames, manorRooms } from './manorPlan';

export interface Room { id: string; name: string; description: string }
export interface ClubProfile { name: string; description: string }
export interface Treasury { gp: number; sp: number; cp: number }
export interface Announcement { id: string; title: string; text: string }
export interface ClubState {
  profile: ClubProfile; rooms: Room[]; treasury: Treasury; announcements: Announcement[];
  readOnly: boolean; storageError: string | null;
}
export const clubStorageKey = 'dnd-club-v1';
const initialState: ClubState = {
  profile: { name: 'Банда 3.5', description: 'Наша банда, общие дела и место, куда всегда можно вернуться. Здесь мы храним добычу, обсуждаем планы и собираемся перед новым приключением.' },
  treasury: { gp: 0, sp: 0, cp: 0 }, announcements: [], readOnly: false, storageError: null,
  rooms: manorRooms.map(({ id, name, description }) => ({ id, name, description })),
};
const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const text = (value: unknown, max: number): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const validProfile = (value: unknown): value is ClubProfile => record(value) && text(value.name, 80) && text(value.description, 2000);
export const validTreasury = (value: unknown): value is Treasury => record(value) && ['gp', 'sp', 'cp'].every((key) => typeof value[key] === 'number' && Number.isSafeInteger(value[key]) && (value[key] as number) >= 0 && (value[key] as number) <= 1000000000);
const validRoom = (value: unknown): value is Room => record(value) && text(value.id, 80) && text(value.name, 80) && text(value.description, 2000);
const validAnnouncement = (value: unknown): value is Announcement => record(value) && text(value.id, 80) && text(value.title, 120) && text(value.text, 3000);
const unique = (items: { id: string }[]) => new Set(items.map((item) => item.id)).size === items.length;

export function readClub(): ClubState {
  try {
    const raw = window.localStorage.getItem(clubStorageKey);
    if (!raw) return initialState;
    const saved: unknown = JSON.parse(raw);
    if (!record(saved) || !validProfile(saved.profile) || !validTreasury(saved.treasury) ||
      !Array.isArray(saved.rooms) || !saved.rooms.every(validRoom) || !unique(saved.rooms) ||
      !(saved.rooms.length === initialState.rooms.length && initialState.rooms.every((room) => (saved.rooms as Room[]).some((entry) => entry.id === room.id)) ||
        saved.rooms.length === 6 && Object.keys(legacyRoomNames).every((id) => (saved.rooms as Room[]).some((entry) => entry.id === id))) ||
      !Array.isArray(saved.announcements) || !saved.announcements.every(validAnnouncement) || !unique(saved.announcements)) throw new Error('Invalid club');
    const previousRooms = saved.rooms;
    const rooms = initialState.rooms.map((room) => {
      const previous = previousRooms.find((entry) => entry.id === room.id);
      if (!previous) return room;
      return { ...previous, name: previousRooms.length === 6 && previous.name === legacyRoomNames[room.id] ? room.name : previous.name };
    });
    return { profile: saved.profile, treasury: saved.treasury, rooms, announcements: saved.announcements, readOnly: false, storageError: null };
  } catch {
    return { ...initialState, readOnly: true, storageError: 'Не удалось прочитать данные организации. Показан исходный план; изменения отключены, чтобы не перезаписать ваши данные. Проверьте хранилище и перезагрузите страницу.' };
  }
}
const slice = createSlice({ name: 'club', initialState, reducers: {
  updateClubProfile(state, action: PayloadAction<ClubProfile>) {
    if (!state.readOnly && validProfile(action.payload)) state.profile = { name: action.payload.name.trim(), description: action.payload.description.trim() };
  },
  updateRoom(state, action: PayloadAction<Room>) {
    if (state.readOnly || !validRoom(action.payload)) return;
    const room = state.rooms.find((item) => item.id === action.payload.id);
    if (room) { room.name = action.payload.name.trim(); room.description = action.payload.description.trim(); }
  },
  updateTreasury(state, action: PayloadAction<Treasury>) { if (!state.readOnly && validTreasury(action.payload)) state.treasury = action.payload; },
  addAnnouncement: {
    prepare(draft: Omit<Announcement, 'id'>) { return { payload: { id: nanoid(), title: draft.title.trim(), text: draft.text.trim() } }; },
    reducer(state, action: PayloadAction<Announcement>) { if (!state.readOnly && validAnnouncement(action.payload)) state.announcements.unshift(action.payload); },
  },
  updateAnnouncement(state, action: PayloadAction<Announcement>) {
    if (state.readOnly || !validAnnouncement(action.payload)) return;
    const announcement = state.announcements.find((item) => item.id === action.payload.id);
    if (announcement) { announcement.title = action.payload.title.trim(); announcement.text = action.payload.text.trim(); }
  },
  deleteAnnouncement(state, action: PayloadAction<string>) { if (!state.readOnly) state.announcements = state.announcements.filter((item) => item.id !== action.payload); },
  setClubStorageError(state, action: PayloadAction<string | null>) { state.storageError = action.payload; },
  retryClubSave() {},
} });
export const { updateClubProfile, updateRoom, updateTreasury, addAnnouncement, updateAnnouncement, deleteAnnouncement, setClubStorageError, retryClubSave } = slice.actions;
export const clubReducer = slice.reducer;
