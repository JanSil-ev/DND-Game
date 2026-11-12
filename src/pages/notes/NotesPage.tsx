import { PageFrame } from '../../app/layouts/PageFrame/PageFrame';
import { NotesList } from '../../modules/notes/ui/NotesList';

export function NotePage() {
  return (
    <PageFrame
      eyebrow="Память приключения"
      title="Хроника приключений"
      description="Хроника событий, зацепки и мысли, которые не стоит терять."
    >
      <NotesList />
    </PageFrame>
  );
}
