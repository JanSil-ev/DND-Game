import { useParams } from 'react-router-dom'
import styles from './NpcDetailsPage.module.scss'

export function NpcDetailsPage() {
  const { id } = useParams()

  return (
    <section className={styles.page}>
      <h1>NPC</h1>
      <p>Карточка персонажа {id} появится здесь.</p>
    </section>
  )
}
