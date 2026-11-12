import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router";
import { useAppDispatch, useAppSelector } from "../../../app/store/hooks";
import { routes } from "../../../app/router/routes";
import { isImageSource } from "../../../shared/media/imageSource";
import { selectMapLocations } from "../../map/model/mapLocationsSlice";
import type { MapLocation } from "../../map/model/types";
import {
  addNpc,
  deleteNpc,
  filterNpcs,
  relationships,
  retryNpcSave,
  updateNpc,
} from "../model/npcSlice";
import type { Npc, NpcDraft, Relationship } from "../model/npcSlice";
import styles from "./NpcList.module.scss";

function Portrait({ source, name }: { source: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={styles.portrait}>
      {source && !failed ? (
        <img src={source} alt={`Портрет: ${name}`} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span aria-label="Портрет отсутствует">
          {name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0])
            .join("") || "?"}
        </span>
      )}
    </div>
  );
}

function NpcEditor({
  npc,
  places,
  onSave,
  onCancel,
}: {
  npc: Npc | null;
  places: MapLocation[];
  onSave: (draft: NpcDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<NpcDraft>(
    npc
      ? { ...npc }
      : {
          name: "",
          role: "",
          description: "",
          portrait: "",
          relationship: "unknown",
          locationId: null,
        },
  );
  const [imageError, setImageError] = useState("");
  const [loading, setLoading] = useState(false);
  const reader = useRef<FileReader | null>(null);
  const firstField = useRef<HTMLInputElement>(null);
  useEffect(() => {
    firstField.current?.focus({ preventScroll: true });
    firstField.current?.scrollIntoView({ block: "center", behavior: "instant" });
    return () => reader.current?.abort();
  }, []);
  const field = <K extends keyof NpcDraft>(key: K, value: NpcDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    reader.current?.abort();
    setLoading(false);
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 500 * 1024) {
      setImageError("Выберите PNG, JPG или WebP до 500 КБ.");
      return;
    }
    const next = new FileReader();
    reader.current = next;
    setImageError("");
    setLoading(true);
    next.onload = () => {
      if (typeof next.result === "string" && isImageSource(next.result))
        field("portrait", next.result);
      else setImageError("Не удалось прочитать картинку.");
      setLoading(false);
    };
    next.onerror = () => {
      setImageError("Не удалось прочитать файл. Попробуйте ещё раз.");
      setLoading(false);
    };
    next.readAsDataURL(file);
  };
  const valid = Boolean(
    draft.name.trim() &&
    draft.role.trim() &&
    draft.description.trim() &&
    isImageSource(draft.portrait.trim()) &&
    !loading,
  );
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (valid) onSave(draft);
  };
  return (
    <form
      className={styles.editor}
      onSubmit={submit}
      aria-label={npc ? "Редактирование NPC" : "Новый NPC"}
    >
      <h2>{npc ? "Редактирование NPC" : "Новый знакомый"}</h2>
      <div className={styles.formGrid}>
        <label>
          Имя
          <input
            ref={firstField}
            required
            maxLength={80}
            value={draft.name}
            onChange={(event) => field("name", event.target.value)}
            placeholder="Например, Элрик Тихий"
          />
        </label>
        <label>
          Роль или профессия
          <input
            required
            maxLength={80}
            value={draft.role}
            onChange={(event) => field("role", event.target.value)}
            placeholder="Врач, торговец, стражник…"
          />
        </label>
        <label>
          Отношение к группе
          <select
            className={styles.relationshipSelect}
            data-relationship={draft.relationship}
            value={draft.relationship}
            onChange={(event) => field("relationship", event.target.value as Relationship)}
          >
            {Object.entries(relationships).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Место на карте
          <select
            value={draft.locationId ?? ""}
            onChange={(event) => field("locationId", event.target.value || null)}
          >
            <option value="">Место неизвестно</option>
            {draft.locationId && !places.some((place) => place.id === draft.locationId) && (
              <option value={draft.locationId}>Место удалено или недоступно</option>
            )}
            {places.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={styles.portraitFields}>
        <Portrait
          key={draft.portrait}
          source={isImageSource(draft.portrait.trim()) ? draft.portrait.trim() : ""}
          name={draft.name}
        />
        <div className={styles.imageFields}>
          <label>
            Ссылка на портрет
            <input
              type="url"
              placeholder="https://…"
              value={
                draft.portrait.startsWith("data:") || draft.portrait.startsWith("/")
                  ? ""
                  : draft.portrait
              }
              onChange={(event) => {
                reader.current?.abort();
                setLoading(false);
                setImageError("");
                field("portrait", event.target.value);
              }}
            />
          </label>
          <label>
            Или загрузите портрет
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} />
            <span className={styles.hint}>PNG, JPG или WebP, до 500 КБ</span>
          </label>
          {draft.portrait && (
            <button
              type="button"
              className={styles.textButton}
              onClick={() => {
                reader.current?.abort();
                setLoading(false);
                setImageError("");
                field("portrait", "");
              }}
            >
              Убрать портрет
            </button>
          )}
          {loading && (
            <p className={styles.hint} role="status">
              Читаем портрет…
            </p>
          )}
          {imageError && (
            <p className={styles.fieldError} role="alert">
              {imageError}
            </p>
          )}
          {!isImageSource(draft.portrait.trim()) && (
            <p className={styles.fieldError} role="alert">
              Укажите ссылку http:// или https://.
            </p>
          )}
        </div>
      </div>
      <label>
        Описание
        <textarea
          required
          maxLength={3000}
          rows={4}
          value={draft.description}
          onChange={(event) => field("description", event.target.value)}
          placeholder="Кто это, чем запомнился и чем может помочь группе…"
        />
      </label>
      <div className={styles.editorActions}>
        <button type="button" className={styles.secondary} onClick={onCancel}>
          Отмена
        </button>
        <button type="submit" className={styles.primary} disabled={!valid}>
          Сохранить NPC
        </button>
      </div>
    </form>
  );
}

function NpcCard({
  npc,
  place,
  readOnly,
  editing,
  onEdit,
}: {
  npc: Npc;
  place?: MapLocation;
  readOnly: boolean;
  editing: boolean;
  onEdit: () => void;
}) {
  const dispatch = useAppDispatch();
  const [expanded, setExpanded] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const collapsible = npc.description.length > 140 || npc.description.split("\n").length > 3;
  return (
    <li className={styles.card}>
      <article aria-labelledby={`npc-${npc.id}`}>
        <div className={styles.identity}>
          <Portrait key={npc.portrait} source={npc.portrait} name={npc.name} />
          <div>
            <h3 id={`npc-${npc.id}`}>{npc.name}</h3>
            <p className={styles.role}>{npc.role}</p>
          </div>
        </div>
        <span className={styles.badge} data-relationship={npc.relationship}>
          {relationships[npc.relationship]}
        </span>
        <div className={styles.place}>
          {place ? (
            <Link to={`${routes.map}?place=${encodeURIComponent(place.id)}`}>⌖ {place.name} ↗</Link>
          ) : (
            <span>⌖ {npc.locationId ? "Место удалено или недоступно" : "Место неизвестно"}</span>
          )}
        </div>
        <p className={styles.description} data-expanded={!collapsible || expanded}>
          {npc.description}
        </p>
        {collapsible && (
          <button
            className={styles.textButton}
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? "Свернуть" : "Полное описание"}
          </button>
        )}
        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.secondary}
            disabled={readOnly || editing}
            onClick={onEdit}
            aria-label={`Изменить NPC «${npc.name}»`}
          >
            Изменить
          </button>
          <button
            type="button"
            className={styles.delete}
            disabled={readOnly}
            onClick={() => setConfirm(true)}
            aria-label={`Удалить NPC «${npc.name}»`}
          >
            Удалить
          </button>
        </div>
        {confirm && (
          <div className={styles.confirm}>
            <p>Удалить этого NPC?</p>
            <button className={styles.secondary} type="button" onClick={() => setConfirm(false)}>
              Оставить
            </button>
            <button
              className={styles.delete}
              type="button"
              disabled={readOnly}
              onClick={() => dispatch(deleteNpc(npc.id))}
            >
              Да, удалить
            </button>
          </div>
        )}
      </article>
    </li>
  );
}

export function NpcList() {
  const { items, readOnly, storageError } = useAppSelector((state) => state.npcs);
  const places = useAppSelector(selectMapLocations);
  const dispatch = useAppDispatch();
  const [editor, setEditor] = useState<{ npc: Npc | null } | null>(null);
  const [query, setQuery] = useState("");
  const [relationship, setRelationship] = useState<Relationship | "all">("all");
  const [placeFilter, setPlaceFilter] = useState("all");
  const [status, setStatus] = useState("");
  const editedNpc = editor?.npc ? items.find((npc) => npc.id === editor.npc?.id) : null;
  const editorVisible = editor && (!editor.npc || editedNpc);
  const visible = filterNpcs(items, query, relationship, placeFilter);
  const missingPlaces = [
    ...new Set(items.flatMap((npc) => (npc.locationId ? [npc.locationId] : []))),
  ].filter((id) => !places.some((place) => place.id === id));
  const reset = () => {
    setQuery("");
    setRelationship("all");
    setPlaceFilter("all");
  };
  const save = (draft: NpcDraft) => {
    if (readOnly) return;
    if (editor?.npc) dispatch(updateNpc({ id: editor.npc.id, draft }));
    else dispatch(addNpc(draft));
    setEditor(null);
    reset();
    setStatus("NPC записан.");
  };
  return (
    <div>
      <div className={styles.heading}>
        <div>
          <h2>Знакомые лица</h2>
          <p>NPC: {items.length}</p>
        </div>
        <button
          type="button"
          className={styles.primary}
          disabled={readOnly || Boolean(editorVisible)}
          onClick={() => setEditor({ npc: null })}
        >
          ＋ Добавить NPC
        </button>
      </div>
      <p className={styles.hint}>Знакомые и их портреты сохраняются в этом браузере.</p>
      {storageError && (
        <div className={styles.error} role="alert">
          <p>{storageError}</p>
          {!readOnly && (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => dispatch(retryNpcSave())}
            >
              Повторить сохранение
            </button>
          )}
        </div>
      )}
      {editorVisible && (
        <NpcEditor
          key={editor.npc?.id ?? "new"}
          npc={editedNpc ?? null}
          places={places}
          onSave={save}
          onCancel={() => setEditor(null)}
        />
      )}
      {items.length > 0 && (
        <div className={styles.filters}>
          <label>
            Поиск
            <input
              type="search"
              placeholder="Имя, роль или описание"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label>
            Отношение
            <select
              value={relationship}
              onChange={(event) => setRelationship(event.target.value as Relationship | "all")}
            >
              <option value="all">Любое отношение</option>
              {Object.entries(relationships).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Место
            <select value={placeFilter} onChange={(event) => setPlaceFilter(event.target.value)}>
              <option value="all">Все места</option>
              <option value="none">Место неизвестно</option>
              {places.map((place) => (
                <option value={place.id} key={place.id}>
                  {place.name}
                </option>
              ))}
              {missingPlaces.map((id) => (
                <option key={id} value={id}>
                  Удалённое или недоступное место
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <span className={styles.srOnly} role="status">
        {status}
      </span>
      {visible.length > 0 ? (
        <ul className={styles.grid} aria-label="NPC кампании">
          {visible.map((npc) => (
            <NpcCard
              key={npc.id}
              npc={npc}
              place={places.find((place) => place.id === npc.locationId)}
              readOnly={readOnly}
              editing={Boolean(editorVisible)}
              onEdit={() => setEditor({ npc })}
            />
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <h3>{items.length ? "Никого не нашли" : "Здесь появятся знакомые вашей группы"}</h3>
          <p>
            {items.length
              ? "Измените поиск, отношение или место."
              : "Добавьте союзника, торговца или будущего противника."}
          </p>
          {items.length > 0 && (
            <button type="button" className={styles.secondary} onClick={reset}>
              Сбросить фильтры
            </button>
          )}
        </div>
      )}
    </div>
  );
}
