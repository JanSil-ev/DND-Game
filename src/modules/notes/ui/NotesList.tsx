import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { addNote, deleteNote, priorities, retryNotesSave, updateNote } from '../model/notesSlice';
import type { Note, NoteDraft, NotePriority } from '../model/notesSlice';
import { selectMapLocations } from '../../map/model/mapLocationsSlice';
import type { MapLocation } from '../../map/model/types';
import { routes } from '../../../app/router/routes';
import styles from './NotesList.module.scss';

const priorityRank = { high: 0, medium: 1, low: 2 };
const formatDate = (date: string) => new Intl.DateTimeFormat('ru', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(date));

function NoteEditor({ note, initialLocationId, locations, onSave, onCancel }: {
  note: Note | null; onSave: (draft: NoteDraft) => void; onCancel: () => void;
  initialLocationId?: string | null; locations: MapLocation[];
}) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [priority, setPriority] = useState<NotePriority>(note?.priority ?? 'medium');
  const [locationId, setLocationId] = useState(note?.locationId ?? initialLocationId ?? '');
  const titleInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    titleInput.current?.focus({ preventScroll: true });
    titleInput.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, []);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (title.trim() && content.trim()) onSave({ title, content, priority, locationId: locationId || null });
  };
  return (
    <form className={styles.editor} onSubmit={submit} aria-label={note ? 'Редактирование заметки' : 'Новая заметка'}>
      <h2>{note ? 'Редактирование заметки' : 'Новая заметка'}</h2>
      <div className={styles.editorTop}>
        <label className={styles.field}>Заголовок
          <input ref={titleInput} required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например, встреча в таверне" />
        </label>
        <label className={styles.field}>Приоритет
          <select className={styles.priorityControl} data-priority={priority} value={priority} onChange={(event) => setPriority(event.target.value as NotePriority)}>
            {Object.entries(priorities).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
          </select>
        </label>
      </div>
      <label className={`${styles.field} ${styles.placeField}`}>Место на карте
        <select value={locationId} onChange={(event) => setLocationId(event.target.value)}>
          <option value="">Без привязки к месту</option>
          {locationId && !locations.some((place) => place.id === locationId) && <option value={locationId}>Место удалено или недоступно</option>}
          {locations.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
        </select>
      </label>
      <label className={styles.field}>Текст заметки
        <textarea required maxLength={10000} rows={7} value={content} onChange={(event) => setContent(event.target.value)} placeholder="События, зацепки и всё, что важно запомнить…" />
      </label>
      <div className={styles.editorFooter}>
        <span>{content.length.toLocaleString('ru')} / 10 000</span>
        <div className={styles.actions}>
          <button className={styles.secondary} type="button" onClick={onCancel}>Отмена</button>
          <button className={styles.primary} disabled={!title.trim() || !content.trim()} type="submit">Сохранить заметку</button>
        </div>
      </div>
    </form>
  );
}

export function NotesList() {
  const { items, storageError, readOnly } = useAppSelector((state) => state.notes);
  const locations = useAppSelector(selectMapLocations);
  const mapError = useAppSelector((state) => state.mapLocations.error);
  const [params, setParams] = useSearchParams();
  const locationFilter = params.get('place') ?? 'all';
  const focusedNoteId = params.get('note');
  const dispatch = useAppDispatch();
  const [editor, setEditor] = useState<{ note: Note | null; locationId?: string | null } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<NotePriority | 'all'>('all');
  const [sort, setSort] = useState('recent');
  const [announcement, setAnnouncement] = useState('');
  const missingPlaces = [...new Set([
    ...items.flatMap((note) => note.locationId ? [note.locationId] : []),
    ...(locationFilter !== 'all' && locationFilter !== 'none' ? [locationFilter] : []),
  ])].filter((id) => !locations.some((place) => place.id === id));

  useEffect(() => {
    if (params.get('new') !== '1' || readOnly) return;
    setEditor({ note: null, locationId: params.get('place') });
    const next = new URLSearchParams(params);
    next.delete('new'); next.delete('note');
    setParams(next, { replace: true });
  }, [params, readOnly, setParams]);

  useEffect(() => {
    if (!focusedNoteId) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(`note-entry-${focusedNoteId}`)?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [focusedNoteId]);

  const setLocationFilter = (id: string) => {
    const next = new URLSearchParams(params);
    if (id === 'all') next.delete('place'); else next.set('place', id);
    next.delete('note');
    setParams(next, { replace: true });
  };
  const visibleNotes = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('ru');
    return items.filter((note) => (priorityFilter === 'all' || note.priority === priorityFilter) &&
      (locationFilter === 'all' || (locationFilter === 'none' ? !note.locationId : note.locationId === locationFilter)) &&
      (!search || `${note.title} ${note.content}`.toLocaleLowerCase('ru').includes(search)))
      .sort((a, b) => (sort === 'priority' ? priorityRank[a.priority] - priorityRank[b.priority] : 0) ||
        b.updatedAt.localeCompare(a.updatedAt));
  }, [items, query, priorityFilter, sort, locationFilter]);

  const save = (draft: NoteDraft) => {
    if (readOnly) return;
    if (editor?.note) dispatch(updateNote(editor.note.id, draft));
    else dispatch(addNote(draft));
    setEditor(null);
    setQuery('');
    setPriorityFilter('all');
    if (locationFilter !== 'all' && (locationFilter === 'none' ? Boolean(draft.locationId) : locationFilter !== draft.locationId)) setLocationFilter('all');
    setAnnouncement('Заметка записана.');
  };

  return (
    <div className={styles.layout}>
      <div className={styles.heading}>
        <div><h2>Записи кампании</h2><p>Всего заметок: {items.length}</p></div>
        <button className={styles.primary} disabled={readOnly || editor !== null} onClick={() => setEditor({ note: null, locationId: locationFilter === 'all' || locationFilter === 'none' ? null : locationFilter })} type="button">＋ Добавить заметку</button>
      </div>
      <p className={styles.storageHint}>Записи сохраняются в этом браузере. На других устройствах они не появятся автоматически.</p>
      {storageError && <div className={styles.error} role="alert">
        <p>{storageError}</p>
        {!readOnly && <button type="button" className={styles.secondary} onClick={() => dispatch(retryNotesSave())}>Повторить сохранение</button>}
      </div>}
      {mapError && <p className={styles.storageHint}>Часть мест карты недоступна. Привязки существующих заметок сохранены.</p>}
      {editor && <NoteEditor key={editor.note?.id ?? `new-${editor.locationId ?? ''}`} note={editor.note} initialLocationId={editor.locationId} locations={locations} onSave={save} onCancel={() => setEditor(null)} />}
      {(items.length > 0 || locationFilter !== 'all') && <div className={styles.toolbar}>
        <label className={styles.field}>Поиск
          <input type="search" placeholder="Заголовок или текст" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className={styles.field}>Приоритет
          <select className={styles.priorityControl} data-priority={priorityFilter} value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as NotePriority | 'all')}>
            <option value="all">Все приоритеты</option>
            {Object.entries(priorities).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
          </select>
        </label>
        <label className={styles.field}>Порядок
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="recent">Сначала обновлённые</option><option value="priority">Сначала важные</option>
          </select>
        </label>
        <label className={styles.field}>Место
          <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
            <option value="all">Все места</option><option value="none">Без привязки</option>
            {locations.map((place) => <option value={place.id} key={place.id}>{place.name}</option>)}
            {missingPlaces.map((id) => <option value={id} key={id}>Удалённое или недоступное место ({items.filter((note) => note.locationId === id).length})</option>)}
          </select>
        </label>
      </div>}
      <span className={styles.srOnly} role="status">{announcement}</span>
      {visibleNotes.length > 0 ? <ul className={styles.list} aria-label="Заметки кампании">
        {visibleNotes.map((note) => <li key={note.id} id={`note-entry-${note.id}`} tabIndex={-1} className={styles.note} data-priority={note.priority} data-focused={note.id === focusedNoteId}>
          <article aria-labelledby={`note-${note.id}`}>
            <div className={styles.noteHeader}>
              <h3 id={`note-${note.id}`}>{note.title}</h3>
              <span className={styles.priority} data-priority={note.priority}>{priorities[note.priority]} приоритет</span>
            </div>
            {note.locationId && <div className={styles.linkedPlace}>
              {locations.some((place) => place.id === note.locationId)
                ? <Link to={`${routes.map}?place=${encodeURIComponent(note.locationId)}`}>⌖ {locations.find((place) => place.id === note.locationId)?.name} · На карте ↗</Link>
                : <span>⌖ Место удалено или недоступно — заметка сохранена</span>}
            </div>}
            <p className={styles.content}>{note.content}</p>
            <div className={styles.noteFooter}>
              <time dateTime={note.updatedAt}>Обновлено {formatDate(note.updatedAt)}</time>
              <div className={styles.noteControls}>
                <label className={styles.inlinePriority}><span className={styles.srOnly}>Приоритет заметки «{note.title}»</span>
                  <select className={styles.priorityControl} data-priority={note.priority} value={note.priority} disabled={readOnly} onChange={(event) => {
                    dispatch(updateNote(note.id, { title: note.title, content: note.content, priority: event.target.value as NotePriority, locationId: note.locationId ?? null }));
                    setAnnouncement('Приоритет изменён.');
                  }}>{Object.entries(priorities).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
                </label>
                <button className={styles.secondary} type="button" disabled={readOnly || editor !== null} aria-label={`Редактировать заметку «${note.title}»`} onClick={() => { setDeleteId(null); setEditor({ note }); }}>Изменить</button>
                <button className={styles.delete} type="button" disabled={readOnly} aria-label={`Удалить заметку «${note.title}»`} onClick={() => setDeleteId(note.id)}>Удалить</button>
              </div>
            </div>
            {deleteId === note.id && <div className={styles.confirm}>
              <p>Удалить эту заметку?</p><div className={styles.actions}>
                <button className={styles.secondary} type="button" onClick={() => setDeleteId(null)}>Оставить</button>
                <button className={styles.delete} type="button" onClick={() => {
                  dispatch(deleteNote(note.id)); setDeleteId(null);
                  if (editor?.note?.id === note.id) setEditor(null);
                  setAnnouncement('Заметка удалена.');
                }}>Да, удалить</button>
              </div>
            </div>}
          </article>
        </li>)}
      </ul> : <div className={styles.empty}>
        <h3>{items.length ? 'Ничего не найдено' : locationFilter !== 'all' ? 'Для этого места заметок пока нет' : 'История начинается с первой записи'}</h3>
        <p>{items.length || locationFilter !== 'all' ? 'Добавьте запись или измените поиск, приоритет и место.' : 'Сохраните события последней сессии, важную зацепку или план группы.'}</p>
        {(items.length > 0 || locationFilter !== 'all') && <button className={styles.secondary} type="button" onClick={() => { setQuery(''); setPriorityFilter('all'); setLocationFilter('all'); }}>Сбросить фильтры</button>}
      </div>}
    </div>
  );
}
