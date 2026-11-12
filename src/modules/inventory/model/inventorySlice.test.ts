import { afterEach, describe, expect, it, vi } from 'vitest';
import { addItem, deleteItem, inventoryReducer, inventoryStorageKey, readInventory, retryInventorySave, starterItemsStorageKey, updateItem, validItemImage } from './inventorySlice';

afterEach(() => vi.unstubAllGlobals());
describe('inventory', () => {
  it('creates, edits and removes an item while preserving its identity', () => {
    const created = inventoryReducer(undefined, addItem({ name: ' Зелье ', description: ' Лечит ', image: '' }));
    const id = created.items[0].id;
    expect(created.items[0]).toEqual({ id, name: 'Зелье', description: 'Лечит', image: '' });
    const edited = inventoryReducer(created, updateItem({ id, draft: { name: 'Меч', description: 'Стальной', image: 'https://example.com/sword.png' } }));
    expect(edited.items[0]).toMatchObject({ id, name: 'Меч', image: 'https://example.com/sword.png' });
    expect(inventoryReducer(edited, deleteItem(id)).items).toEqual([]);
  });
  it('rejects blank fields and unsupported image sources', () => {
    expect(inventoryReducer(undefined, addItem({ name: ' ', description: 'Описание', image: '' })).items).toEqual([]);
    expect(inventoryReducer(undefined, addItem({ name: 'Меч', description: ' ', image: '' })).items).toEqual([]);
    expect(validItemImage('javascript:alert(1)')).toBe(false);
    expect(validItemImage('data:text/html;base64,abcd')).toBe(false);
    expect(validItemImage('data:image/png;base64,aGVsbG8=')).toBe(true);
    expect(validItemImage('data:image/png;base64,' + 'a'.repeat(700000))).toBe(false);
  });
  it('restores valid data and protects malformed or unavailable storage', () => {
    const item = addItem({ name: 'Меч', description: 'Стальной', image: '' }).payload;
    const getItem = vi.fn().mockReturnValue(JSON.stringify([item]));
    vi.stubGlobal('window', { localStorage: { getItem } });
    expect(readInventory().items).toEqual([item]);
    expect(getItem).toHaveBeenCalledWith(inventoryStorageKey);
    getItem.mockReturnValue(JSON.stringify([item, item]));
    expect(readInventory().readOnly).toBe(true);
    getItem.mockReturnValue('{broken');
    const blocked = readInventory();
    expect(inventoryReducer(blocked, addItem({ name: 'Новый', description: 'Текст', image: '' }))).toEqual(blocked);
    getItem.mockImplementation(() => { throw new Error('Unavailable'); });
    expect(readInventory().storageError).toBeTruthy();
  });
  it('persists Redux changes and allows retry after a storage write failure', async () => {
    const setItem = vi.fn();
    vi.stubGlobal('window', { localStorage: { getItem: (key: string) => key === starterItemsStorageKey ? '1' : null, setItem } });
    const { store } = await import('../../../app/store/store');
    store.dispatch(addItem({ name: 'Зелье', description: 'Лечит', image: '' }));
    expect(setItem).toHaveBeenCalledWith(inventoryStorageKey, JSON.stringify(store.getState().inventory.items));
    setItem.mockImplementation(() => { throw new Error('Quota'); });
    const id = store.getState().inventory.items[0].id;
    store.dispatch(updateItem({ id, draft: { name: 'Зелье', description: 'Новое описание', image: '' } }));
    expect(store.getState().inventory.items[0].description).toBe('Новое описание');
    expect(store.getState().inventory.storageError).toBeTruthy();
    setItem.mockImplementation(() => undefined);
    store.dispatch(retryInventorySave());
    expect(store.getState().inventory.storageError).toBeNull();
  });
  it('adds ten trinkets once, preserves existing items and does not restore deleted trinkets', () => {
    const custom = addItem({ name: 'Свой меч', description: 'Не потерять', image: '' }).payload;
    const storage = new Map<string, string>([[inventoryStorageKey, JSON.stringify([custom])]]);
    vi.stubGlobal('window', { localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
    } });
    const first = readInventory();
    expect(first.items).toHaveLength(11);
    expect(first.items[0]).toEqual(custom);
    expect(new Set(first.items.map((item) => item.id)).size).toBe(11);
    expect(first.items.slice(1).every((item) => validItemImage(item.image))).toBe(true);
    expect(readInventory().items).toHaveLength(11);
    const deleted = first.items[1].id;
    storage.set(inventoryStorageKey, JSON.stringify(first.items.filter((item) => item.id !== deleted)));
    expect(readInventory().items).toHaveLength(10);
    expect(readInventory().items.some((item) => item.id === deleted)).toBe(false);
  });
});
