import { Link } from 'react-router';
import { useAppSelector } from '../../../../app/store/hooks';
import { routes } from '../../../../app/router/routes';
import styles from '../../HomePage.module.scss';

const date = (value: string) => new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'short' }).format(new Date(value));

export function CampaignBrief() {
  const notes = useAppSelector((state) => state.notes.items);
  const notesError = useAppSelector((state) => state.notes.storageError);
  const { announcements, treasury, storageError: clubError } = useAppSelector((state) => state.club);
  const important = [...notes].filter((note) => note.priority === 'high').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);
  const announcement = announcements[0];
  return <section className={styles.briefSection} aria-label="Сводка кампании">
    <div className={styles.sectionHeading}><p className={styles.sectionEyebrow}>Перед новым приключением</p><h2 className={styles.sectionTitle}>Держим в голове</h2></div>
    <div className={styles.briefGrid}>
      <section className={styles.briefCard} aria-label="Важные заметки">
        <div className={styles.briefHeading}><h3>Важные заметки</h3><span className={styles.priorityBadge}>Высокий приоритет</span></div>
        {notesError && <p className={styles.briefWarning}>Есть проблема с сохранением заметок. Подробности — в разделе заметок.</p>}
        {important.length ? <ul className={styles.briefNotes}>{important.map((note) => <li key={note.id}>
          <Link to={`${routes.notes}?note=${encodeURIComponent(note.id)}${note.locationId ? `&place=${encodeURIComponent(note.locationId)}` : ''}`}>
            <div><h4>{note.title}</h4><time dateTime={note.updatedAt}>{date(note.updatedAt)}</time></div><p>{note.content}</p><span className={styles.briefRead}>Открыть запись ↗</span>
          </Link>
        </li>)}</ul> : <div className={styles.briefEmpty}><p>Самое важное пока не записано.</p><span>Отметьте заметку высоким приоритетом — она появится здесь.</span></div>}
        <Link className={styles.briefLink} to={routes.notes}>Все заметки →</Link>
      </section>
      <div className={styles.briefAside}>
        <section className={styles.briefCard} aria-label="Объявление банды">
          <div className={styles.briefHeading}><h3>На доске банды</h3><span className={styles.noticeSeal} aria-hidden="true">✦</span></div>
          {clubError && <p className={styles.briefWarning}>Есть проблема с данными организации. Проверьте раздел клуба.</p>}
          {announcement ? <Link className={styles.announcementPreview} to={`${routes.club}?section=announcements`}><h4>{announcement.title}</h4><p>{announcement.text}</p></Link>
            : <div className={styles.briefEmpty}><p>Пока никаких объявлений.</p><span>Планы на сессию и сообщения группе появятся здесь.</span></div>}
          <Link className={styles.briefLink} to={`${routes.club}?section=announcements`}>{announcement ? 'Открыть доску объявлений →' : 'Добавить объявление →'}</Link>
        </section>
        <Link className={styles.treasuryPreview} to={`${routes.club}?section=treasury`} aria-label="Открыть казну банды">
          <div><h3>Казна банды</h3><span>Общий кошелёк</span></div>
          <div className={styles.treasuryAmounts}><span><strong>{treasury.gp.toLocaleString('ru')}</strong> зм</span><span><strong>{treasury.sp.toLocaleString('ru')}</strong> см</span><span><strong>{treasury.cp.toLocaleString('ru')}</strong> мм</span></div><span aria-hidden="true">↗</span>
        </Link>
      </div>
    </div>
  </section>;
}
