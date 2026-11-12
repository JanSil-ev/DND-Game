import { PageFrame } from '../../app/layouts/PageFrame/PageFrame';
import { NpcList } from '../../modules/npc/ui/NpcList';

export function NpcPage() {
  return (
    <PageFrame
      eyebrow="Обитатели мира"
      title="Союзники и противники"
      description="Знакомые лица, важные встречи и те, кому лучше не доверять."
    >
      <NpcList />
    </PageFrame>
  );
}
