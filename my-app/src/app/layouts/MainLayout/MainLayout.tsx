import { NavLink, Outlet } from 'react-router-dom'
import { routes } from '../../router/routes'
import styles from './MainLayout.module.scss'

const navigation = [
  { label: 'Главная', to: routes.home, end: true },
  { label: 'Персонажи', to: routes.characters },
  { label: 'NPC', to: routes.npc },
  { label: 'Клуб', to: routes.club },
  { label: 'Карта', to: routes.map },
  { label: 'Заметки', to: routes.notes },
]

export function MainLayout() {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <NavLink className={styles.brand} to={routes.home}>
          D&amp;D Campaign
        </NavLink>
        <nav className={styles.navigation} aria-label="Основная навигация">
          {navigation.map(({ label, to, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>Dungeons &amp; Dragons campaign</footer>
    </div>
  )
}
