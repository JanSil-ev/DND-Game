import { afterEach, describe, expect, it, vi } from 'vitest';
import { addNote, deleteNote, notesReducer, notesStorageKey, readNotes, updateNote } from './notesSlice';
import type { NotesState } from './notesSlice';

afterEach(() => vi.unstubAllGlobals());

describe('notes', () => {
  it('creates distinct notes with trimmed text and timestamps', () => {
    const action = addNote({ title: ' Зацепка ', content: ' Текст\nзаписи ', priority: 'high' });
    const state = notesReducer(undefined, action);
    expect(state.items[0]).toMatchObject({ title: 'Зацепка', content: 'Текст\nзаписи', priority: 'high' });
    expect(state.items[0].createdAt).toBe(state.items[0].updatedAt);
    expect(addNote({ title: 'Ещё', content: 'Текст', priority: 'low' }).payload.id).not.toBe(action.payload.id);
  });
  it('edits the selected note and preserves its ID and creation date', () => {
    const state = notesReducer(undefined, addNote({ title: 'Старое', content: 'Текст', priority: 'low' }));
    const original = state.items[0];
    const edited = notesReducer(state, updateNote(original.id, { title: 'Новое', content: 'Новый текст', priority: 'high' }));
    expect(edited.items[0]).toMatchObject({ id: original.id, createdAt: original.createdAt, title: 'Новое', content: 'Новый текст', priority: 'high' });
    expect(notesReducer(edited, deleteNote(original.id)).items).toEqual([]);
  });
  it('rejects blank notes and blocks mutations after a read failure', () => {
    expect(notesReducer(undefined, addNote({ title: ' ', content: 'Текст', priority: 'low' })).items).toEqual([]);
    const blocked: NotesState = { items: [], readOnly: true, storageError: 'Ошибка' };
    expect(notesReducer(blocked, addNote({ title: 'Название', content: 'Текст', priority: 'low' }))).toEqual(blocked);
  });
  it('links a note to a stable place ID, keeps it on priority changes and allows unlinking', () => {
    const original = notesReducer(undefined, addNote({ title: 'Бар', content: 'Встреча', priority: 'low', locationId: 'user-bar' }));
    const id = original.items[0].id;
    const edited = notesReducer(original, updateNote(id, { title: 'Бар', content: 'Встреча', priority: 'high' }));
    expect(edited.items[0].locationId).toBe('user-bar');
    const unlinked = notesReducer(edited, updateNote(id, { title: 'Бар', content: 'Встреча', priority: 'high', locationId: null }));
    expect(unlinked.items[0].locationId).toBeNull();
    expect(unlinked.items[0].content).toBe('Встреча');
  });
  it('restores both legacy notes and linked notes, including deleted place references', () => {
    const linked = addNote({ title: 'Запись', content: 'Текст', priority: 'medium', locationId: 'deleted-place' }).payload;
    const legacy = { ...linked, id: 'legacy', locationId: undefined };
    const getItem = vi.fn().mockReturnValue(JSON.stringify([linked, legacy]));
    vi.stubGlobal('window', { localStorage: { getItem } });
    expect(readNotes().items.map((note) => note.locationId)).toEqual(['deleted-place', undefined]);
    expect(readNotes().readOnly).toBe(false);
    getItem.mockReturnValue(JSON.stringify([{ ...linked, locationId: 42 }]));
    expect(readNotes().readOnly).toBe(true);
  });
  it('restores valid data and protects malformed or unavailable storage', () => {
    const note = addNote({ title: 'Запись', content: 'Текст', priority: 'medium' }).payload;
    const getItem = vi.fn().mockReturnValue(JSON.stringify([note]));
    vi.stubGlobal('window', { localStorage: { getItem } });
    expect(readNotes().items).toEqual([note]);
    expect(getItem).toHaveBeenCalledWith(notesStorageKey);
    getItem.mockReturnValue(JSON.stringify([note, note]));
    expect(readNotes().readOnly).toBe(true);
    getItem.mockReturnValue('{broken');
    expect(readNotes().readOnly).toBe(true);
    getItem.mockImplementation(() => { throw new Error('Unavailable'); });
    expect(readNotes().storageError).toBeTruthy();
  });
  it('persists Redux changes and reports write failures without losing the note', async () => {
    const setItem = vi.fn();
    vi.stubGlobal('window', { localStorage: { getItem: () => null, setItem } });
    const { store } = await import('../../../app/store/store');
    const { retryNotesSave } = await import('./notesSlice');
    store.dispatch(addNote({ title: 'Сессия', content: 'События', priority: 'high' }));
    expect(JSON.parse(setItem.mock.calls[setItem.mock.calls.length - 1][1])).toEqual(store.getState().notes.items);
    setItem.mockImplementation(() => { throw new Error('Quota exceeded'); });
    store.dispatch(updateNote(store.getState().notes.items[0].id, { title: 'Сессия', content: 'Обновлено', priority: 'low' }));
    expect(store.getState().notes.items[0].content).toBe('Обновлено');
    expect(store.getState().notes.storageError).toBeTruthy();
    setItem.mockImplementation(() => undefined);
    store.dispatch(retryNotesSave());
    expect(store.getState().notes.storageError).toBeNull();
    const { mapLocationsSaved, selectMapLocations } = await import('../../map/model/mapLocationsSlice');
    store.dispatch(mapLocationsSaved([{ id: 'user-bar', name: 'Бар', description: '', x: 25, y: 30, type: 'tavern', source: 'user' }]));
    store.dispatch(addNote({ title: 'Встреча', content: 'События в баре', priority: 'high', locationId: 'user-bar' }));
    const linkedId = store.getState().notes.items[1].id;
    store.dispatch(mapLocationsSaved([{ id: 'user-bar', name: 'Новое имя бара', description: '', x: 50, y: 60, type: 'tavern', source: 'user' }]));
    expect(selectMapLocations(store.getState()).find((place) => place.id === 'user-bar')?.name).toBe('Новое имя бара');
    expect(store.getState().notes.items.find((note) => note.id === linkedId)?.locationId).toBe('user-bar');
    store.dispatch(mapLocationsSaved([]));
    expect(selectMapLocations(store.getState()).find((place) => place.id === 'user-bar')).toBeUndefined();
    expect(store.getState().notes.items.find((note) => note.id === linkedId)?.content).toBe('События в баре');
  });
});
