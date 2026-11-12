import { PageFrame } from '../../app/layouts/PageFrame/PageFrame';
import { CityMap } from '../../modules/map';
import styles from './MapPage.module.scss';

export function MapPage() {
  return (
    <PageFrame
      className={styles.page}
      eyebrow="Исследование Побережья Мечей"
      title="Карта Вотердипа"
      description="Изучайте город, находите важные места и прокладывайте путь к новым приключениям."
    >
      <CityMap />
    </PageFrame>
  );
}
