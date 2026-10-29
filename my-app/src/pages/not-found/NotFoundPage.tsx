import { Link } from 'react-router-dom'
import { routes } from '../../app/router/routes'

export function NotFoundPage() {
  return (
    <section>
      <h1>Страница не найдена</h1>
      <p>Проверь адрес или вернись на главную.</p>
      <Link to={routes.home}>На главную</Link>
    </section>
  )
}
