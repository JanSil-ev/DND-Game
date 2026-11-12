import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { useAppDispatch, useAppSelector } from "../../../app/store/hooks";
import { routes } from "../../../app/router/routes";
import { selectMapLocations } from "../../map/model/mapLocationsSlice";
import {
  addAnnouncement,
  deleteAnnouncement,
  retryClubSave,
  updateAnnouncement,
  updateRoom,
  updateTreasury,
  validTreasury,
} from "../model/clubSlice";
import type { Treasury } from "../model/clubSlice";
import styles from "./Club.module.scss";
import { ManorMap } from "./ManorMap";
import { manorFloors, manorRooms } from "../model/manorPlan";

const sections = {
  home: "Помещения",
  treasury: "Казна",
  announcements: "Объявления",
  links: "Быстрые переходы",
} as const;
type Section = keyof typeof sections;
const currencies = { gp: "Золото", sp: "Серебро", cp: "Медь" } as const;

function TextEditor({
  name,
  description,
  title,
  nameLabel = "Название",
  onSave,
  onCancel,
  long = false,
}: {
  name: string;
  description: string;
  title: string;
  nameLabel?: string;
  long?: boolean;
  onSave: (name: string, description: string) => void;
  onCancel: () => void;
}) {
  const [draftName, setName] = useState(name);
  const [draftDescription, setDescription] = useState(description);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (draftName.trim() && draftDescription.trim()) onSave(draftName, draftDescription);
  };
  return (
    <form className={styles.form} onSubmit={submit} aria-label={title}>
      <h3>{title}</h3>
      <label>
        {nameLabel}
        <input
          autoFocus
          required
          maxLength={long ? 120 : 80}
          value={draftName}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label>
        {long ? "Текст" : "Описание"}
        <textarea
          required
          maxLength={long ? 3000 : 2000}
          rows={4}
          value={draftDescription}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <div className={styles.actions}>
        <button className={styles.secondary} type="button" onClick={onCancel}>
          Отмена
        </button>
        <button
          className={styles.primary}
          type="submit"
          disabled={!draftName.trim() || !draftDescription.trim()}
        >
          Сохранить
        </button>
      </div>
    </form>
  );
}

function TreasuryPanel() {
  const { treasury, readOnly } = useAppSelector((state) => state.club);
  const itemCount = useAppSelector((state) => state.inventory.items.length);
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    gp: String(treasury.gp),
    sp: String(treasury.sp),
    cp: String(treasury.cp),
  });
  const [saved, setSaved] = useState(false);
  const parsed: Treasury = { gp: Number(draft.gp), sp: Number(draft.sp), cp: Number(draft.cp) };
  const valid = Object.values(draft).every((value) => value.trim() !== "") && validTreasury(parsed);
  return (
    <div className={styles.twoColumns}>
      <section className={styles.panel}>
        <p className={styles.eyebrow}>Общий кошелёк</p>
        <h2>Казна банды</h2>
        <dl className={styles.coins}>
          {(Object.entries(currencies) as [keyof Treasury, string][]).map(([key, label]) => (
            <div key={key} data-currency={key}>
              <dt>{label}</dt>
              <dd>{treasury[key].toLocaleString("ru")}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.hint}>Общие средства организации. Значения монет хранятся отдельно.</p>
        {!editing && (
          <button
            type="button"
            className={styles.secondary}
            disabled={readOnly}
            onClick={() => {
              setDraft({
                gp: String(treasury.gp),
                sp: String(treasury.sp),
                cp: String(treasury.cp),
              });
              setEditing(true);
              setSaved(false);
            }}
          >
            Изменить баланс
          </button>
        )}
        {editing && (
          <form
            className={styles.form}
            aria-label="Изменение казны"
            onSubmit={(event) => {
              event.preventDefault();
              if (valid && !readOnly) {
                dispatch(updateTreasury(parsed));
                setEditing(false);
                setSaved(true);
              }
            }}
          >
            {(Object.entries(currencies) as [keyof Treasury, string][]).map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  autoFocus={key === "gp"}
                  type="number"
                  min={0}
                  max={1000000000}
                  step={1}
                  required
                  value={draft[key]}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, [key]: event.target.value }))
                  }
                />
              </label>
            ))}
            <p className={styles.hint}>Целые значения от 0 до 1 000 000 000.</p>
            <div className={styles.actions}>
              <button className={styles.secondary} type="button" onClick={() => setEditing(false)}>
                Отмена
              </button>
              <button className={styles.primary} type="submit" disabled={!valid || readOnly}>
                Сохранить баланс
              </button>
            </div>
          </form>
        )}
        <span role="status" className={styles.status}>
          {saved ? "Баланс обновлён." : ""}
        </span>
      </section>
      <section className={styles.panel}>
        <p className={styles.eyebrow}>Общее имущество</p>
        <h2>Не только монеты</h2>
        <p>
          Снаряжение и трофеи лежат в общем инвентаре. Сейчас в нём предметов:{" "}
          <strong>{itemCount}</strong>.
        </p>
        <Link className={styles.link} to={routes.inventory}>
          Открыть инвентарь →
        </Link>
      </section>
    </div>
  );
}

function AnnouncementsPanel() {
  const { announcements, readOnly } = useAppSelector((state) => state.club);
  const dispatch = useAppDispatch();
  const [editor, setEditor] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const current = announcements.find((item) => item.id === editor);
  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>Для своих</p>
          <h2>Доска объявлений</h2>
        </div>
        <button
          className={styles.primary}
          type="button"
          disabled={readOnly || editor !== null}
          onClick={() => setEditor("new")}
        >
          ＋ Добавить
        </button>
      </div>
      {editor !== null && (
        <TextEditor
          key={editor}
          name={current?.title ?? ""}
          description={current?.text ?? ""}
          title={current ? "Изменить объявление" : "Новое объявление"}
          nameLabel="Заголовок"
          long
          onCancel={() => setEditor(null)}
          onSave={(title, text) => {
            if (readOnly) return;
            if (current) dispatch(updateAnnouncement({ id: current.id, title, text }));
            else dispatch(addAnnouncement({ title, text }));
            setEditor(null);
          }}
        />
      )}
      {announcements.length > 0 ? (
        <ul className={styles.announcements}>
          {announcements.map((item) => (
            <li key={item.id}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <div className={styles.actions}>
                <button
                  className={styles.secondary}
                  type="button"
                  disabled={readOnly || editor !== null}
                  aria-label={`Изменить объявление «${item.title}»`}
                  onClick={() => setEditor(item.id)}
                >
                  Изменить
                </button>
                <button
                  className={styles.delete}
                  type="button"
                  disabled={readOnly || editor !== null}
                  aria-label={`Удалить объявление «${item.title}»`}
                  onClick={() => setConfirm(item.id)}
                >
                  Удалить
                </button>
              </div>
              {confirm === item.id && (
                <div className={styles.confirm}>
                  <p>Удалить объявление?</p>
                  <button
                    className={styles.secondary}
                    type="button"
                    onClick={() => setConfirm(null)}
                  >
                    Оставить
                  </button>
                  <button
                    className={styles.delete}
                    type="button"
                    disabled={readOnly}
                    onClick={() => {
                      dispatch(deleteAnnouncement(item.id));
                      setConfirm(null);
                    }}
                  >
                    Да, удалить
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <h3>Пока тихо</h3>
          <p>Оставьте здесь планы на следующую сессию или сообщение для всей банды.</p>
        </div>
      )}
    </section>
  );
}

export function Club() {
  const { rooms, readOnly, storageError } = useAppSelector((state) => state.club);
  const places = useAppSelector(selectMapLocations);
  const dispatch = useAppDispatch();
  const [params, setParams] = useSearchParams();
  const requested = params.get("section");
  const section: Section =
    requested && Object.prototype.hasOwnProperty.call(sections, requested)
      ? (requested as Section)
      : "home";
  const [selectedId, setSelectedId] = useState("hall");
  const [editRoom, setEditRoom] = useState(false);
  const room = rooms.find((item) => item.id === selectedId) ?? rooms[0];
  const base =
    places.find((place) => place.id === "1") ?? places.find((place) => place.type === "club");
  const quickLinks = [
    {
      title: "База на карте",
      text: "Вернуться к нашему месту в городе.",
      to: base ? `${routes.map}?place=${encodeURIComponent(base.id)}` : routes.map,
      icon: "⌖",
    },
    {
      title: "Общий инвентарь",
      text: "Снаряжение, трофеи и находки.",
      to: routes.inventory,
      icon: "◇",
    },
    {
      title: "Записи о базе",
      text: "Встречи, события и важные зацепки.",
      to: base ? `${routes.notes}?place=${encodeURIComponent(base.id)}` : routes.notes,
      icon: "≡",
    },
    { title: "Персонажи", text: "Те, ради кого всё затевалось.", to: routes.characters, icon: "♙" },
    { title: "Знакомые лица", text: "Союзники, торговцы и противники.", to: routes.npc, icon: "♧" },
    { title: "Кости судьбы", text: "Когда спор лучше решить броском.", to: routes.dice, icon: "⬡" },
  ];
  return (
    <div>
      <nav className={styles.navigation} aria-label="Разделы организации">
        {(Object.entries(sections) as [Section, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-current={section === key ? "page" : undefined}
            onClick={() => {
              const next = new URLSearchParams(params);
              if (key === "home") next.delete("section");
              else next.set("section", key);
              setParams(next);
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      <p className={styles.hint}>Изменения организации сохраняются в этом браузере.</p>
      {storageError && (
        <div className={styles.error} role="alert">
          <p>{storageError}</p>
          {!readOnly && (
            <button
              className={styles.secondary}
              type="button"
              onClick={() => dispatch(retryClubSave())}
            >
              Повторить сохранение
            </button>
          )}
        </div>
      )}
      {section === "home" && (
        <>
          <div className={styles.twoColumns}>
            <section className={`${styles.panel} ${styles.mapPanel}`}>
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.eyebrow}>Наш дом</p>
                  <h2>План штаб-квартиры</h2>
                </div>
                <span className={styles.roomCount}>{rooms.length} помещений</span>
              </div>
              <p className={styles.hint}>Выберите помещение, чтобы посмотреть его описание.</p>
              <ManorMap
                rooms={rooms}
                selectedId={room.id}
                disabled={editRoom}
                onSelect={setSelectedId}
              />
            </section>
            <section
              className={styles.panel}
              id="club-room-details"
              aria-label="Выбранное помещение"
              aria-live="polite"
            >
              <p className={styles.eyebrow}>
                Помещение {String(rooms.indexOf(room) + 1).padStart(2, "0")}
              </p>
              <p className={styles.hint}>
                {manorFloors[manorRooms.find((point) => point.id === room.id)?.floor ?? "ground"]}
              </p>
              {editRoom ? (
                <TextEditor
                  key={room.id}
                  name={room.name}
                  description={room.description}
                  title="Изменить помещение"
                  onCancel={() => setEditRoom(false)}
                  onSave={(name, description) => {
                    if (!readOnly) {
                      dispatch(updateRoom({ id: room.id, name, description }));
                      setEditRoom(false);
                    }
                  }}
                />
              ) : (
                <>
                  <h2>{room.name}</h2>
                  <p className={styles.roomDescription}>{room.description}</p>
                  <button
                    className={styles.secondary}
                    type="button"
                    disabled={readOnly}
                    onClick={() => setEditRoom(true)}
                  >
                    Изменить помещение
                  </button>
                </>
              )}
              {room.id === "storage" && (
                <Link className={styles.link} to={routes.inventory}>
                  Что хранится на складе →
                </Link>
              )}
              {room.id === "meeting" && (
                <Link
                  className={styles.link}
                  to={base ? `${routes.notes}?place=${encodeURIComponent(base.id)}` : routes.notes}
                >
                  Открыть записи →
                </Link>
              )}
              {base && (
                <Link
                  className={styles.mapLink}
                  to={`${routes.map}?place=${encodeURIComponent(base.id)}`}
                >
                  <svg className={styles.mapLinkIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16" />
                    <path d="m5.5 12 1-2m4.5 3 1 1m5-3 1-2" strokeDasharray="1 2" />
                  </svg>
                  <span>Показать базу на карте</span>
                  <span className={styles.mapLinkArrow} aria-hidden="true">↗</span>
                </Link>
              )}
            </section>
          </div>
        </>
      )}
      {section === "treasury" && <TreasuryPanel />}
      {section === "announcements" && <AnnouncementsPanel />}
      {section === "links" && (
        <section aria-label="Быстрые переходы">
          <div className={styles.quickLinks}>
            {quickLinks.map((link) => (
              <Link key={link.title} to={link.to}>
                <span className={styles.quickIcon} aria-hidden="true">
                  {link.icon}
                </span>
                <div>
                  <h2>{link.title}</h2>
                  <p>{link.text}</p>
                </div>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
