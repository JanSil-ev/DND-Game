import { PageFrame } from '../../app/layouts/PageFrame/PageFrame';
import { useAppSelector } from '../../app/store/hooks';
import { Club } from '../../modules/club/ui/Club';
import styles from './ClubPage.module.scss';

export function ClubPage() {
  const profile = useAppSelector((state) => state.club.profile);
  return (
    <PageFrame
      className={styles.page}
      eyebrow="Организация"
      title={profile.name}
      description={profile.description}
    >
      <Club />
    </PageFrame>
  );
}
