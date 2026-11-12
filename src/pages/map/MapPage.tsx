import { PageFrame } from '../../app/layouts/PageFrame/PageFrame';
import { CityMap } from '../../modules/map';

export function MapPage() {
  return (
    <PageFrame
      eyebrow="Исследование Побережья Мечей"
      title="Карта Вотердипа"
      description="Изучайте город, находите важные места и прокладывайте путь к новым приключениям."
    >
      <CityMap />
    </PageFrame>
  );
}