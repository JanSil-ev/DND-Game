import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { addItem, deleteItem, retryInventorySave, updateItem, validItemImage } from '../model/inventorySlice';
import type { InventoryItem, ItemDraft } from '../model/inventorySlice';
import styles from './Inventory.module.scss';

function ItemImage({ image, name }: { image: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return <div className={styles.image}>
    {image && !failed ? <img src={image} alt={name} loading="lazy" onError={() => setFailed(true)} /> : <>
      <img className={styles.placeholder} src={`${import.meta.env.BASE_URL}icon/markers/bag.svg`} alt="" />
      <span>{image ? 'Картинка недоступна' : 'Без картинки'}</span>
    </>}
  </div>;
}

function ItemEditor({ item, onSave, onCancel }: { item: InventoryItem | null; onSave: (draft: ItemDraft) => void; onCancel: () => void }) {
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [image, setImage] = useState(item?.image ?? '');
  const [fileError, setFileError] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);
  const reader = useRef<FileReader | null>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    nameInput.current?.focus({ preventScroll: true });
    nameInput.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
    return () => reader.current?.abort();
  }, []);
  const loadFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    reader.current?.abort();
    setLoadingFile(false);
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 500 * 1024) {
      setFileError('Выберите PNG, JPG или WebP размером до 500 КБ.'); return;
    }
    setFileError(''); setLoadingFile(true);
    const next = new FileReader(); reader.current = next;
    next.onload = () => {
      if (typeof next.result === 'string' && validItemImage(next.result)) setImage(next.result);
      else setFileError('Не удалось прочитать изображение.');
      setLoadingFile(false);
    };
    next.onerror = () => { setFileError('Не удалось прочитать файл. Выберите его ещё раз.'); setLoadingFile(false); };
    next.readAsDataURL(file);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim() && description.trim() && validItemImage(image.trim()) && !loadingFile) onSave({ name, description, image });
  };
  return <form className={styles.editor} onSubmit={submit} aria-label={item ? 'Редактирование предмета' : 'Новый предмет'}>
    <h2>{item ? 'Редактирование предмета' : 'Новый предмет'}</h2>
    <div className={styles.editorGrid}>
      <div className={styles.preview}><ItemImage key={image} image={validItemImage(image.trim()) ? image.trim() : ''} name={name || 'Предпросмотр предмета'} /></div>
      <div className={styles.fields}>
        <label>Название<input ref={nameInput} required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Например, зелье лечения" /></label>
        <label>Ссылка на картинку<input type="url" value={image.startsWith('data:') || image.startsWith('/') ? '' : image} placeholder="https://…" onChange={(event) => {
          reader.current?.abort(); setLoadingFile(false); setFileError(''); setImage(event.target.value);
        }} /></label>
        <label className={styles.fileLabel}>Или загрузите картинку<input type="file" accept="image/png,image/jpeg,image/webp" onChange={loadFile} /><span>PNG, JPG или WebP, до 500 КБ</span></label>
        {image && <button className={styles.textButton} type="button" onClick={() => { reader.current?.abort(); setLoadingFile(false); setImage(''); setFileError(''); }}>Убрать картинку</button>}
        {loadingFile && <p className={styles.hint} role="status">Читаем картинку…</p>}
        {fileError && <p className={styles.fieldError} role="alert">{fileError}</p>}
        {!validItemImage(image.trim()) && <p className={styles.fieldError} role="alert">Укажите ссылку http:// или https://.</p>}
      </div>
    </div>
    <label className={styles.descriptionField}>Описание<textarea required maxLength={3000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Свойства предмета, его история или важные детали…" /></label>
    <div className={styles.editorActions}><button type="button" className={styles.secondary} onClick={onCancel}>Отмена</button>
      <button type="submit" className={styles.primary} disabled={!name.trim() || !description.trim() || !validItemImage(image.trim()) || loadingFile}>Сохранить предмет</button></div>
  </form>;
}

function ItemCard({ item, readOnly, editing, onEdit }: { item: InventoryItem; readOnly: boolean; editing: boolean; onEdit: () => void }) {
  const dispatch = useAppDispatch();
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const collapsible = item.description.length > 120 || item.description.split('\n').length > 3;
  return <li className={styles.card}>
    <article aria-labelledby={`item-${item.id}`}>
      <ItemImage key={item.image} image={item.image} name={item.name} />
      <div className={styles.cardBody}>
        <h3 id={`item-${item.id}`}>{item.name}</h3>
        <p className={styles.description} data-expanded={!collapsible || expanded}>{item.description}</p>
        {collapsible && <button className={styles.textButton} type="button" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>{expanded ? 'Свернуть описание' : 'Полное описание'}</button>}
        <div className={styles.cardActions}>
          <button className={styles.secondary} type="button" disabled={readOnly || editing} onClick={onEdit} aria-label={`Изменить предмет «${item.name}»`}>Изменить</button>
          <button className={styles.delete} type="button" disabled={readOnly} onClick={() => setConfirmDelete(true)} aria-label={`Удалить предмет «${item.name}»`}>Удалить</button>
        </div>
        {confirmDelete && <div className={styles.confirm}><p>Удалить этот предмет?</p>
          <button className={styles.secondary} type="button" onClick={() => setConfirmDelete(false)}>Оставить</button>
          <button className={styles.delete} type="button" disabled={readOnly} onClick={() => dispatch(deleteItem(item.id))}>Да, удалить</button>
        </div>}
      </div>
    </article>
  </li>;
}

export function Inventory() {
  const { items, readOnly, storageError } = useAppSelector((state) => state.inventory);
  const dispatch = useAppDispatch();
  const [editor, setEditor] = useState<{ item: InventoryItem | null } | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const query = search.trim().toLocaleLowerCase('ru');
  const visible = items.filter((item) => !query || `${item.name} ${item.description}`.toLocaleLowerCase('ru').includes(query));
  const currentEditor = editor?.item ? items.find((item) => item.id === editor.item?.id) : null;
  const editorVisible = editor && (!editor.item || currentEditor);
  const save = (draft: ItemDraft) => {
    if (readOnly) return;
    if (editor?.item) dispatch(updateItem({ id: editor.item.id, draft })); else dispatch(addItem(draft));
    setEditor(null); setSearch(''); setStatus('Предмет записан.');
  };
  return <div>
    <div className={styles.toolbar}><div><h2>Общий рюкзак</h2><p>Предметов: {items.length}</p></div>
      <button className={styles.primary} type="button" disabled={readOnly || Boolean(editorVisible)} onClick={() => setEditor({ item: null })}>＋ Добавить предмет</button></div>
    <p className={styles.hint}>Инвентарь сохраняется в этом браузере.</p>
    {storageError && <div className={styles.error} role="alert"><p>{storageError}</p>
      {!readOnly && <button className={styles.secondary} type="button" onClick={() => dispatch(retryInventorySave())}>Повторить сохранение</button>}
    </div>}
    {editorVisible && <ItemEditor key={editor.item?.id ?? 'new'} item={currentEditor ?? null} onSave={save} onCancel={() => setEditor(null)} />}
    {items.length > 0 && <label className={styles.search}>Найти предмет<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Название или описание" /></label>}
    <span className={styles.srOnly} role="status">{status}</span>
    {visible.length > 0 ? <ul className={styles.grid} aria-label="Предметы группы">{visible.map((item) => <ItemCard key={item.id} item={item} readOnly={readOnly} editing={Boolean(editorVisible)} onEdit={() => setEditor({ item })} />)}</ul>
      : <div className={styles.empty}><h3>{items.length ? 'Предметы не найдены' : 'Рюкзак пока пуст'}</h3><p>{items.length ? 'Попробуйте другое название или описание.' : 'Добавьте снаряжение, находку или трофей вашей группы.'}</p>
        {query && <button className={styles.secondary} type="button" onClick={() => setSearch('')}>Сбросить поиск</button>}
      </div>}
  </div>;
}
