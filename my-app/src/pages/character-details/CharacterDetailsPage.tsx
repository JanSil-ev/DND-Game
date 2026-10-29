import { useParams } from 'react-router-dom'
import styles from './CharacterDetailsPage.module.scss'

export function CharacterDetailsPage() {
  const { id } = useParams()

  return (
    <section className={styles.page}>
      <h1>Персонаж</h1>
      <p>Карточка персонажа {id} появится здесь.</p>
    </section>
  )
}
