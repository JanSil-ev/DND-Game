import { PageFrame } from '../../app/layouts/PageFrame/PageFrame';
import { useAppSelector } from '../../app/store/hooks';
import { selectCharacters } from '../../modules/characters/model/charactersSlice';
import { CharacterCard } from '../../modules/characters/ui/CharacterCard';
import styles from './CharactersPage.module.scss';

export function CharactersPage() {
  const characters = useAppSelector(selectCharacters);
  return (
    <PageFrame
      eyebrow="Персонажи игроков"
      title="Герои кампании"
      description="Спутники по приключениям банды 3.5."
    >
      <div className={styles.intro}>
        <h2>Наша группа</h2>
        <span>Героев: {characters.length}</span>
      </div>
      {characters.length ? (
        <div className={styles.grid}>
          {characters.map((character) => <CharacterCard key={character.id} character={character} />)}
        </div>
      ) : <p className={styles.empty}>Здесь появятся герои вашей кампании.</p>}
    </PageFrame>
  );
}
