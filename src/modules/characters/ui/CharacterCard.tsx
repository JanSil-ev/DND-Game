import { useState } from 'react';
import type { ReactNode } from 'react';
import { abilityNames, type Ability, type Character } from '../model/types';
import styles from './CharacterCard.module.scss';

const display = (value: number | null) => value ?? '—';
const signed = (value: number | null) => value === null ? '—' : value >= 0 ? `+${value}` : String(value);

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className={styles.section}>
      <summary>{title}<span className={styles.chevron} aria-hidden="true">＋</span></summary>
      <div className={styles.sectionBody}>{children}</div>
    </details>
  );
}

function Paragraphs({ lines }: { lines: string[] }) {
  return <div className={styles.paragraphs}>{lines.map((line, index) => <p key={index}>{line}</p>)}</div>;
}

export function CharacterCard({ character }: { character: Character }) {
  const [imageFailed, setImageFailed] = useState(false);
  const headingId = `character-${character.id}`;
  return (
    <article className={styles.card} aria-labelledby={headingId}>
      <div className={styles.identity}>
        <div className={styles.portrait}>
          {character.avatar && !imageFailed ? (
            <img src={character.avatar} alt={`Портрет: ${character.name}`} loading="lazy" onError={() => setImageFailed(true)} />
          ) : <span aria-hidden="true">{character.name.split(' ').map((word) => word[0]).slice(0, 2).join('')}</span>}
        </div>
        <div className={styles.identityText}>
          <p className={styles.eyebrow}>{character.race || 'Герой кампании'}</p>
          <h2 id={headingId}>{character.name}</h2>
          <p className={styles.className}>{character.className || 'Класс не указан'} · {display(character.level)} ур.</p>
          {character.subclass && <p className={styles.subclass}>{character.subclass}</p>}
        </div>
      </div>

      <div className={styles.body}>
        <dl className={styles.combat}>
          <div className={styles.health}><dt>Хиты</dt><dd>{display(character.hp.current)}<span> / {display(character.hp.max)}</span></dd></div>
          <div><dt>КД</dt><dd>{display(character.armorClass)}</dd></div>
          <div><dt>Инициатива</dt><dd>{signed(character.initiative)}</dd></div>
          <div><dt>Скорость</dt><dd>{display(character.speed)}<span> фт</span></dd></div>
        </dl>
        {character.hp.temporary !== null && character.hp.temporary > 0 &&
          <p className={styles.temporary}>Временные хиты: {character.hp.temporary}</p>}

        <dl className={styles.abilities} aria-label="Характеристики">
          {Object.entries(abilityNames).map(([key, name]) => {
            const ability = character.abilities[key as Ability];
            return <div key={key}><dt title={name}>{name}</dt><dd>{display(ability.score)}<span>{signed(ability.modifier)}</span></dd></div>;
          })}
        </dl>

        <div className={styles.metadata}>
          <span>Бонус владения <strong>{signed(character.proficiency)}</strong></span>
          {character.background && <span>{character.background}</span>}
          {character.player && <span>Игрок: {character.player}</span>}
        </div>

        <div className={styles.sections}>
          <Section title="Навыки и спасброски">
            <h3 className={styles.listTitle}>Спасброски</h3>
            <dl className={styles.statList}>
              {character.saves.map((save) => <div key={save.name}><dt>{save.name}{save.proficient && <span className={styles.badge}>владение</span>}</dt><dd>{signed(save.bonus)}</dd></div>)}
            </dl>
            <h3 className={styles.listTitle}>Навыки</h3>
            <dl className={styles.statList}>
              {character.skills.map((skill) => <div key={skill.name}><dt>{skill.name}{skill.proficiency > 0 && <span className={styles.badge}>{skill.proficiency >= 2 ? 'экспертиза' : 'владение'}</span>}</dt><dd>{signed(skill.bonus)}</dd></div>)}
            </dl>
          </Section>
          {character.weapons.length > 0 && <Section title="Оружие">
            {character.weapons.map((weapon) => <div className={styles.weapon} key={weapon.id}>
              <h3>{weapon.name}</h3><p className={styles.damage}>{weapon.damage || '—'} {weapon.damageType}</p>
              {weapon.notes && <p>{weapon.notes}</p>}
            </div>)}
          </Section>}
          {character.features.length > 0 && <Section title="Способности"><Paragraphs lines={character.features} /></Section>}
          {character.proficiencies.length > 0 && <Section title="Владения и языки"><Paragraphs lines={character.proficiencies} /></Section>}
          {character.equipment.length > 0 && <Section title="Снаряжение"><Paragraphs lines={character.equipment} /></Section>}
        </div>
        <p className={styles.source}>По сохранённому листу Long Story Short</p>
      </div>
    </article>
  );
}
