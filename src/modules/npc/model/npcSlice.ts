import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';
import { isImageSource } from '../../../shared/media/imageSource';
import { starterNpcs } from './starterNpcs';

export const relationships = { friend: 'Друг', neutral: 'Нейтральный', enemy: 'Враг', unknown: 'Неизвестно' } as const;
export type Relationship = keyof typeof relationships;
export interface NpcDraft { name: string; role: string; relationship: Relationship; locationId: string | null; description: string; portrait: string }
export interface Npc extends NpcDraft { id: string }
export interface NpcState { items: Npc[]; readOnly: boolean; storageError: string | null }
export const npcStorageKey = 'dnd-npcs-v1';
export const starterNpcsStorageKey = 'dnd-comic-npcs-v1-added';
const initialState: NpcState = { items: [], readOnly: false, storageError: null };

function validDraft(value: unknown): value is NpcDraft {
  if (!value || typeof value !== 'object') return false;
  const npc = value as Record<string, unknown>;
  return typeof npc.name === 'string' && npc.name.trim().length > 0 && npc.name.length <= 80 &&
    typeof npc.role === 'string' && npc.role.trim().length > 0 && npc.role.length <= 80 &&
    typeof npc.description === 'string' && npc.description.trim().length > 0 && npc.description.length <= 3000 &&
    typeof npc.relationship === 'string' && Object.keys(relationships).includes(npc.relationship) &&
    (npc.locationId === null || typeof npc.locationId === 'string' && npc.locationId.length > 0) &&
    typeof npc.portrait === 'string' && isImageSource(npc.portrait);
}
export function readNpcs(): NpcState {
  try {
    const raw = window.localStorage.getItem(npcStorageKey);
    const items: unknown = raw ? JSON.parse(raw) : [];
    const isNpc = (value: unknown): value is Npc => validDraft(value) && 'id' in value && typeof value.id === 'string' && value.id.length > 0;
    if (!Array.isArray(items) || !items.every(isNpc) || new Set(items.map((npc) => npc.id)).size !== items.length) throw new Error('Invalid NPC data');
    if (!window.localStorage.getItem(starterNpcsStorageKey)) {
      const ids = new Set(items.map((npc) => npc.id));
      const merged = [...items, ...starterNpcs.filter((npc) => !ids.has(npc.id))];
      try {
        window.localStorage.setItem(npcStorageKey, JSON.stringify(merged));
        window.localStorage.setItem(starterNpcsStorageKey, '1');
      } catch {
        return { items: merged, readOnly: false, storageError: 'NPC добавлены в этой вкладке, но сохранить их в браузере не удалось. Повторите сохранение перед закрытием страницы.' };
      }
      return { items: merged, readOnly: false, storageError: null };
    }
    return { items, readOnly: false, storageError: null };
  } catch {
    return { items: [], readOnly: true, storageError: 'Не удалось прочитать NPC. Изменения отключены, чтобы не перезаписать сохранённые данные. Проверьте доступ к хранилищу и перезагрузите страницу.' };
  }
}
const trim = (draft: NpcDraft): NpcDraft => ({ name: draft.name.trim(), role: draft.role.trim(), relationship: draft.relationship, locationId: draft.locationId, description: draft.description.trim(), portrait: draft.portrait.trim() });
const slice = createSlice({
  name: 'npcs', initialState,
  reducers: {
    addNpc: {
      prepare(draft: NpcDraft) { return { payload: { ...trim(draft), id: nanoid() } }; },
      reducer(state, action: PayloadAction<Npc>) { if (!state.readOnly && validDraft(action.payload)) state.items.push(action.payload); },
    },
    updateNpc(state, action: PayloadAction<{ id: string; draft: NpcDraft }>) {
      if (state.readOnly || !validDraft(action.payload.draft)) return;
      const npc = state.items.find((item) => item.id === action.payload.id);
      if (npc) Object.assign(npc, trim(action.payload.draft));
    },
    deleteNpc(state, action: PayloadAction<string>) { if (!state.readOnly) state.items = state.items.filter((npc) => npc.id !== action.payload); },
    setNpcStorageError(state, action: PayloadAction<string | null>) { state.storageError = action.payload; },
    retryNpcSave() {},
  },
});
export const { addNpc, updateNpc, deleteNpc, setNpcStorageError, retryNpcSave } = slice.actions;
export const npcReducer = slice.reducer;

export function filterNpcs(items: Npc[], query: string, relationship: Relationship | 'all', place: string): Npc[] {
  const search = query.trim().toLocaleLowerCase('ru');
  return items.filter((npc) => (relationship === 'all' || npc.relationship === relationship) &&
    (place === 'all' || (place === 'none' ? !npc.locationId : npc.locationId === place)) &&
    (!search || `${npc.name} ${npc.role} ${npc.description}`.toLocaleLowerCase('ru').includes(search)));
}
