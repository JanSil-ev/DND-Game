import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';

export const priorities = { high: 'Высокий', medium: 'Средний', low: 'Низкий' } as const;
export type NotePriority = keyof typeof priorities;
export interface NoteDraft { title: string; content: string; priority: NotePriority; locationId?: string | null }
export interface Note extends NoteDraft { id: string; createdAt: string; updatedAt: string }
export interface NotesState { items: Note[]; storageError: string | null; readOnly: boolean }
export const notesStorageKey = 'dnd-campaign-notes-v1';

function isNote(value: unknown): value is Note {
  if (!value || typeof value !== 'object') return false;
  const note = value as Record<string, unknown>;
  return typeof note.id === 'string' && note.id.length > 0 &&
    typeof note.title === 'string' && note.title.trim().length > 0 &&
    typeof note.content === 'string' &&
    (note.locationId === undefined || note.locationId === null || typeof note.locationId === 'string' && note.locationId.length > 0) &&
    typeof note.priority === 'string' && Object.keys(priorities).includes(note.priority) &&
    typeof note.createdAt === 'string' && Number.isFinite(Date.parse(note.createdAt)) &&
    typeof note.updatedAt === 'string' && Number.isFinite(Date.parse(note.updatedAt));
}

export function readNotes(): NotesState {
  try {
    const raw = window.localStorage.getItem(notesStorageKey);
    if (!raw) return { items: [], storageError: null, readOnly: false };
    const saved: unknown = JSON.parse(raw);
    if (!Array.isArray(saved) || !saved.every(isNote) || new Set(saved.map((note) => note.id)).size !== saved.length) {
      throw new Error('Invalid notes');
    }
    return { items: saved, storageError: null, readOnly: false };
  } catch {
    return {
      items: [], readOnly: true,
      storageError: 'Не удалось прочитать сохранённые заметки. Изменения отключены, чтобы не перезаписать ваши записи. Проверьте доступ к хранилищу и перезагрузите страницу.',
    };
  }
}

const initialState: NotesState = { items: [], storageError: null, readOnly: false };
const validDraft = (draft: NoteDraft) => draft.title.trim().length > 0 &&
  draft.title.length <= 120 && draft.content.trim().length > 0 && draft.content.length <= 10000 &&
  Object.keys(priorities).includes(draft.priority) &&
  (draft.locationId === undefined || draft.locationId === null || typeof draft.locationId === 'string' && draft.locationId.length > 0);

const slice = createSlice({
  name: 'notes', initialState,
  reducers: {
    addNote: {
      prepare(draft: NoteDraft) {
        const now = new Date().toISOString();
        return { payload: { ...draft, locationId: draft.locationId ?? null, title: draft.title.trim(), content: draft.content.trim(), id: nanoid(), createdAt: now, updatedAt: now } };
      },
      reducer(state, action: PayloadAction<Note>) {
        if (!state.readOnly && validDraft(action.payload)) state.items.push(action.payload);
      },
    },
    updateNote: {
      prepare(id: string, draft: NoteDraft) {
        return { payload: { id, draft: { ...draft, title: draft.title.trim(), content: draft.content.trim() }, updatedAt: new Date().toISOString() } };
      },
      reducer(state, action: PayloadAction<{ id: string; draft: NoteDraft; updatedAt: string }>) {
        if (state.readOnly || !validDraft(action.payload.draft)) return;
        const note = state.items.find((item) => item.id === action.payload.id);
        if (note) Object.assign(note, action.payload.draft, { updatedAt: action.payload.updatedAt });
      },
    },
    deleteNote(state, action: PayloadAction<string>) {
      if (!state.readOnly) state.items = state.items.filter((item) => item.id !== action.payload);
    },
    setNotesStorageError(state, action: PayloadAction<string | null>) { state.storageError = action.payload; },
    retryNotesSave() {},
  },
});

export const { addNote, updateNote, deleteNote, setNotesStorageError, retryNotesSave } = slice.actions;
export const notesReducer = slice.reducer;
