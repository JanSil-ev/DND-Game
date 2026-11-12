import { afterEach, describe, expect, it, vi } from 'vitest';
import { addNpc, deleteNpc, filterNpcs, npcReducer, npcStorageKey, readNpcs, retryNpcSave, starterNpcsStorageKey, updateNpc } from './npcSlice';
import type { NpcDraft } from './npcSlice';

const doctor: NpcDraft = { name: ' Элрик ', role: ' Врач ', description: 'Лечит без вопросов.', portrait: '', relationship: 'friend', locationId: 'user-clinic' };
afterEach(() => vi.unstubAllGlobals());
describe('NPC cards', () => {
  it('creates, edits and deletes an NPC, keeping profession independent of relationship', () => {
    const created = npcReducer(undefined, addNpc(doctor));
    const id = created.items[0].id;
    expect(created.items[0]).toMatchObject({ name: 'Элрик', role: 'Врач', relationship: 'friend' });
    const edited = npcReducer(created, updateNpc({ id, draft: { ...doctor, relationship: 'enemy' } }));
    expect(edited.items[0]).toMatchObject({ id, role: 'Врач', relationship: 'enemy', locationId: 'user-clinic' });
    expect(npcReducer(edited, deleteNpc(id)).items).toEqual([]);
  });
  it('validates required fields and blocks edits after failed loading', () => {
    expect(npcReducer(undefined, addNpc({ ...doctor, name: ' ' })).items).toEqual([]);
    expect(npcReducer(undefined, addNpc({ ...doctor, role: '' })).items).toEqual([]);
    expect(npcReducer(undefined, addNpc({ ...doctor, portrait: 'javascript:alert(1)' })).items).toEqual([]);
    const blocked = { items: [], readOnly: true, storageError: 'Ошибка' };
    expect(npcReducer(blocked, addNpc(doctor))).toEqual(blocked);
  });
  it('combines search, relationship and location filters', () => {
    let state = npcReducer(undefined, addNpc(doctor));
    state = npcReducer(state, addNpc({ ...doctor, name: 'Стражник', role: 'Охранник', locationId: null, relationship: 'neutral' }));
    expect(filterNpcs(state.items, ' ВРАЧ ', 'friend', 'user-clinic')).toHaveLength(1);
    expect(filterNpcs(state.items, 'врач', 'enemy', 'all')).toEqual([]);
    expect(filterNpcs(state.items, '', 'all', 'none')[0].name).toBe('Стражник');
    expect(filterNpcs(state.items, '', 'all', 'all')).toHaveLength(2);
  });
  it('loads NPCs with missing places and protects corrupted or unavailable storage', () => {
    const npc = addNpc(doctor).payload;
    const getItem = vi.fn().mockReturnValue(JSON.stringify([npc]));
    vi.stubGlobal('window', { localStorage: { getItem } });
    expect(readNpcs().items[0].locationId).toBe('user-clinic');
    expect(getItem).toHaveBeenCalledWith(npcStorageKey);
    getItem.mockReturnValue(JSON.stringify([npc, npc]));
    expect(readNpcs().readOnly).toBe(true);
    getItem.mockReturnValue('{broken');
    expect(readNpcs().readOnly).toBe(true);
    getItem.mockImplementation(() => { throw new Error('Unavailable'); });
    expect(readNpcs().storageError).toBeTruthy();
  });
  it('persists Redux actions and retries writes without losing in-memory data', async () => {
    const setItem = vi.fn();
    vi.stubGlobal('window', { localStorage: { getItem: (key: string) => key === starterNpcsStorageKey ? '1' : null, setItem } });
    const { store } = await import('../../../app/store/store');
    store.dispatch(addNpc(doctor));
    expect(setItem).toHaveBeenCalledWith(npcStorageKey, JSON.stringify(store.getState().npcs.items));
    const id = store.getState().npcs.items[0].id;
    setItem.mockImplementation(() => { throw new Error('Quota'); });
    store.dispatch(updateNpc({ id, draft: { ...doctor, description: 'Новое описание' } }));
    expect(store.getState().npcs.items[0].description).toBe('Новое описание');
    expect(store.getState().npcs.storageError).toBeTruthy();
    setItem.mockImplementation(() => undefined);
    store.dispatch(retryNpcSave());
    expect(store.getState().npcs.storageError).toBeNull();
  });
  it('adds three comic NPCs once without replacing custom NPCs or restoring deleted ones', () => {
    const custom = addNpc(doctor).payload;
    const data = new Map<string, string>([[npcStorageKey, JSON.stringify([custom])]]);
    vi.stubGlobal('window', { localStorage: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => { data.set(key, value); },
    } });
    const first = readNpcs();
    expect(first.items).toHaveLength(4);
    expect(first.items[0]).toEqual(custom);
    expect(readNpcs().items).toHaveLength(4);
    const removedId = first.items[1].id;
    data.set(npcStorageKey, JSON.stringify(first.items.filter((npc) => npc.id !== removedId)));
    expect(readNpcs().items).toHaveLength(3);
    expect(readNpcs().items.some((npc) => npc.id === removedId)).toBe(false);
  });
});
