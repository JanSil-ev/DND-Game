import { afterEach, describe, expect, it, vi } from 'vitest';
import { addAnnouncement, clubReducer, clubStorageKey, deleteAnnouncement, readClub, retryClubSave, updateAnnouncement, updateClubProfile, updateRoom, updateTreasury } from './clubSlice';
import { legacyRoomNames, manorRooms } from './manorPlan';

afterEach(() => vi.unstubAllGlobals());
describe('organization page', () => {
  it('edits the organization and a room while keeping the plan identity', () => {
    let state = clubReducer(undefined, { type: 'init' });
    expect(state.profile.name).toBe('Банда 3.5');
    expect(state.rooms).toHaveLength(22);
    state = clubReducer(state, updateClubProfile({ name: ' Новое имя ', description: ' Наши общие дела ' }));
    state = clubReducer(state, updateRoom({ id: 'hall', name: 'Бар', description: 'Наша стойка' }));
    expect(state.profile).toEqual({ name: 'Новое имя', description: 'Наши общие дела' });
    expect(state.rooms.find((room) => room.id === 'hall')?.name).toBe('Бар');
    const unchanged = clubReducer(state, updateRoom({ id: 'unknown', name: 'Нет', description: 'Нет' }));
    expect(unchanged).toEqual(state);
  });
  it('accepts nonnegative integer balances and rejects invalid amounts', () => {
    const state = clubReducer(undefined, updateTreasury({ gp: 120, sp: 4, cp: 0 }));
    expect(state.treasury).toEqual({ gp: 120, sp: 4, cp: 0 });
    for (const gp of [-1, 1.5, Infinity, NaN, 1000000001]) expect(clubReducer(state, updateTreasury({ gp, sp: 0, cp: 0 }))).toEqual(state);
  });
  it('creates, edits and deletes announcements', () => {
    let state = clubReducer(undefined, addAnnouncement({ title: ' Сбор ', text: ' Вечером в баре ' }));
    const id = state.announcements[0].id;
    expect(state.announcements[0]).toEqual({ id, title: 'Сбор', text: 'Вечером в баре' });
    state = clubReducer(state, updateAnnouncement({ id, title: 'Сбор завтра', text: 'В полдень' }));
    expect(state.announcements[0].title).toBe('Сбор завтра');
    expect(clubReducer(state, deleteAnnouncement(id)).announcements).toEqual([]);
    expect(clubReducer(state, addAnnouncement({ title: ' ', text: 'Текст' }))).toEqual(state);
  });
  it('restores saved data and prevents overwriting an invalid plan', () => {
    const saved = clubReducer(undefined, updateTreasury({ gp: 10, sp: 0, cp: 0 }));
    const getItem = vi.fn().mockReturnValue(JSON.stringify(saved));
    vi.stubGlobal('window', { localStorage: { getItem } });
    expect(readClub().treasury.gp).toBe(10);
    expect(getItem).toHaveBeenCalledWith(clubStorageKey);
    getItem.mockReturnValue(JSON.stringify({ ...saved, rooms: [] }));
    const blocked = readClub();
    expect(blocked.readOnly).toBe(true);
    expect(clubReducer(blocked, updateTreasury({ gp: 5, sp: 0, cp: 0 }))).toEqual(blocked);
    getItem.mockReturnValue('{broken');
    expect(readClub().storageError).toBeTruthy();
  });
  it('persists edits and retries failed storage without discarding state', async () => {
    const setItem = vi.fn();
    vi.stubGlobal('window', { localStorage: { getItem: () => null, setItem } });
    const { store } = await import('../../../app/store/store');
    store.dispatch(updateTreasury({ gp: 42, sp: 10, cp: 5 }));
    const saved = setItem.mock.calls.find((call) => call[0] === clubStorageKey);
    expect(JSON.parse(saved![1]).treasury).toEqual({ gp: 42, sp: 10, cp: 5 });
    setItem.mockImplementation(() => { throw new Error('Quota'); });
    store.dispatch(updateClubProfile({ name: 'Банда', description: 'Наши общие дела' }));
    expect(store.getState().club.profile.name).toBe('Банда');
    expect(store.getState().club.storageError).toBeTruthy();
    setItem.mockImplementation(() => undefined);
    store.dispatch(retryClubSave());
    expect(store.getState().club.storageError).toBeNull();
  });
  it('migrates the six-room plan without losing custom descriptions, treasury or announcements', () => {
    const state = clubReducer(undefined, addAnnouncement({ title: 'Сбор', text: 'Завтра' }));
    const rooms = Object.entries(legacyRoomNames).map(([id, name]) => ({ id, name, description: `Сохранённое описание ${id}` }));
    rooms.find((room) => room.id === 'storage')!.name = 'Наш тайный склад';
    vi.stubGlobal('window', { localStorage: { getItem: () => JSON.stringify({ ...state, rooms, treasury: { gp: 777, sp: 2, cp: 3 } }) } });
    const restored = readClub();
    expect(restored.readOnly).toBe(false);
    expect(restored.rooms).toHaveLength(22);
    expect(restored.rooms.find((room) => room.id === 'storage')).toMatchObject({ name: 'Наш тайный склад', description: 'Сохранённое описание storage' });
    expect(restored.rooms.find((room) => room.id === 'meeting')).toMatchObject({ name: 'Библиотека и кабинет', description: 'Сохранённое описание meeting' });
    expect(restored.treasury.gp).toBe(777);
    expect(restored.announcements).toEqual(state.announcements);
  });
  it('keeps map coordinates in bounds and every room ID unique', () => {
    expect(new Set(manorRooms.map((room) => room.id)).size).toBe(22);
    expect(manorRooms.every((room) => room.x >= 0 && room.x <= 100 && room.y >= 0 && room.y <= 100)).toBe(true);
  });
});
