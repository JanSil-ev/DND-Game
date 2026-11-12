import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';
import { starterItems } from './starterItems';
import { isImageSource as validItemImage } from '../../../shared/media/imageSource';
export { isImageSource as validItemImage } from '../../../shared/media/imageSource';

export interface ItemDraft { name: string; description: string; image: string }
export interface InventoryItem extends ItemDraft { id: string }
export interface InventoryState { items: InventoryItem[]; readOnly: boolean; storageError: string | null }
export const inventoryStorageKey = 'dnd-inventory-v1';
export const starterItemsStorageKey = 'dnd-inventory-trinkets-v1-added';
const initialState: InventoryState = { items: [], readOnly: false, storageError: null };

function validDraft(value: unknown): value is ItemDraft {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.name === 'string' && item.name.trim().length > 0 && item.name.length <= 80 &&
    typeof item.description === 'string' && item.description.trim().length > 0 && item.description.length <= 3000 &&
    typeof item.image === 'string' && validItemImage(item.image);
}

export function readInventory(): InventoryState {
  try {
    const raw = window.localStorage.getItem(inventoryStorageKey);
    const items: unknown = raw ? JSON.parse(raw) : [];
    const isItem = (item: unknown): item is InventoryItem => validDraft(item) && 'id' in item && typeof item.id === 'string' && item.id.length > 0;
    if (!Array.isArray(items) || !items.every(isItem) ||
      new Set(items.map((item) => item.id)).size !== items.length) throw new Error('Invalid inventory');
    if (!window.localStorage.getItem(starterItemsStorageKey)) {
      const ids = new Set(items.map((item) => item.id));
      const merged = [...items, ...starterItems.filter((item) => !ids.has(item.id))];
      // Write items before the migration marker; stable IDs prevent duplicates if a retry is needed.
      try {
        window.localStorage.setItem(inventoryStorageKey, JSON.stringify(merged));
        window.localStorage.setItem(starterItemsStorageKey, '1');
      } catch {
        return { items: merged, readOnly: false, storageError: 'Предметы добавлены в этой вкладке, но сохранить инвентарь в браузере не удалось. Повторите сохранение перед закрытием страницы.' };
      }
      return { items: merged, readOnly: false, storageError: null };
    }
    return { items, readOnly: false, storageError: null };
  } catch {
    return { items: [], readOnly: true, storageError: 'Не удалось прочитать инвентарь. Изменения отключены, чтобы не перезаписать сохранённые предметы. Проверьте доступ к хранилищу и перезагрузите страницу.' };
  }
}

const trim = (draft: ItemDraft): ItemDraft => ({ name: draft.name.trim(), description: draft.description.trim(), image: draft.image.trim() });
const slice = createSlice({
  name: 'inventory', initialState,
  reducers: {
    addItem: {
      prepare(draft: ItemDraft) { return { payload: { ...trim(draft), id: nanoid() } }; },
      reducer(state, action: PayloadAction<InventoryItem>) {
        if (!state.readOnly && validDraft(action.payload)) state.items.push(action.payload);
      },
    },
    updateItem(state, action: PayloadAction<{ id: string; draft: ItemDraft }>) {
      if (state.readOnly || !validDraft(action.payload.draft)) return;
      const item = state.items.find((entry) => entry.id === action.payload.id);
      if (item) Object.assign(item, trim(action.payload.draft));
    },
    deleteItem(state, action: PayloadAction<string>) {
      if (!state.readOnly) state.items = state.items.filter((item) => item.id !== action.payload);
    },
    setInventoryStorageError(state, action: PayloadAction<string | null>) { state.storageError = action.payload; },
    retryInventorySave() {},
  },
});
export const { addItem, updateItem, deleteItem, setInventoryStorageError, retryInventorySave } = slice.actions;
export const inventoryReducer = slice.reducer;
