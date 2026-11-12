import { abilityNames, type Ability, type Character } from './types';

type Data = Record<string, unknown>;
const object = (value: unknown): Data =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Data : {};
const string = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const number = (value: unknown): number | null => {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
};
const value = (data: Data, key: string) => object(data[key]).value;
const modifier = (score: number | null) => score === null ? null : Math.floor((score - 10) / 2);

const skillNames: Record<string, string> = {
  acrobatics: 'Акробатика', investigation: 'Анализ', athletics: 'Атлетика',
  perception: 'Восприятие', survival: 'Выживание', performance: 'Выступление',
  intimidation: 'Запугивание', history: 'История', 'sleight of hand': 'Ловкость рук',
  arcana: 'Магия', medicine: 'Медицина', deception: 'Обман', nature: 'Природа',
  insight: 'Проницательность', religion: 'Религия', stealth: 'Скрытность',
  persuasion: 'Убеждение', 'animal handling': 'Уход за животными',
};

function textLines(node: unknown): string[] {
  const data = object(node);
  if (data.type === 'text') return [string(data.text)];
  if (data.type === 'hardBreak') return ['\n'];
  const children = Array.isArray(data.content) ? data.content : [];
  if (data.type === 'paragraph' || data.type === 'heading') {
    const inline = (entry: unknown): string => {
      const item = object(entry);
      if (item.type === 'text') return typeof item.text === 'string' ? item.text : '';
      if (item.type === 'hardBreak') return '\n';
      return Array.isArray(item.content) ? item.content.map(inline).join('') : '';
    };
    const line = children.map(inline).join('').trim();
    return line ? [line] : [];
  }
  return children.flatMap(textLines);
}

export function importLssCharacter(source: unknown, id: string): Character {
  const envelope = object(source);
  const data = object(typeof envelope.data === 'string' ? JSON.parse(envelope.data) : envelope.data);
  const name = string(value(data, 'name'));
  if (!id || data.jsonType !== 'character' || !name) {
    throw new Error('Некорректный экспорт персонажа Long Story Short');
  }
  const info = object(data.info);
  const vitality = object(data.vitality);
  const proficiency = number(data.proficiency);
  const stats = object(data.stats);
  const abilities = Object.fromEntries(Object.keys(abilityNames).map((key) => {
    const score = number(object(stats[key]).score);
    return [key, { score, modifier: modifier(score) }];
  })) as Character['abilities'];
  const abilityModifier = (key: unknown) => abilities[key as Ability]?.modifier ?? null;
  const texts = object(data.text);
  const lines = (key: string) => textLines(object(object(texts[key]).value).data);
  const skillBonuses = Object.values(object(data.bonusesSkills));

  return {
    id, name,
    race: string(value(info, 'race')),
    className: string(value(info, 'charClass')),
    subclass: string(value(info, 'charSubclass')),
    level: number(value(info, 'level')),
    background: string(value(info, 'background')),
    player: string(value(info, 'playerName')),
    avatar: string(object(data.avatar).webp) || string(object(data.avatar).jpeg),
    proficiency, abilities,
    hp: {
      current: number(value(vitality, 'hp-current')),
      max: number(value(vitality, 'hp-max')),
      temporary: number(value(vitality, 'hp-temp')),
    },
  
    armorClass: number(value(vitality, 'ac')),
    initiative: number(value(vitality, 'initiative')),
    speed: number(value(vitality, 'speed')),
    skills: Object.entries(object(data.skills)).map(([key, raw]) => {
      const skill = object(raw);
      const rank = number(skill.isProf) ?? 0;
      const base = abilityModifier(skill.baseStat);
      const hasHalfProf = skillBonuses.some((bonus) => {
        const entries = object(object(bonus).value)[key];
        return Array.isArray(entries) && entries.some((entry) =>
          object(entry).key === 'halfProfType' && object(entry).value === 'floor');
      });
      const profBonus = proficiency === null ? null :
        rank > 0 ? proficiency * rank : hasHalfProf ? Math.floor(proficiency / 2) : 0;
      return {
        name: skillNames[key] ?? key,
        proficiency: rank,
        bonus: base === null || profBonus === null ? null : base + profBonus + (number(skill.customModifier) ?? 0),
      };
    }),
    saves: Object.entries(abilityNames).map(([key, label]) => {
      const save = object(object(data.saves)[key]);
      const proficient = save.isProf === true;
      const base = abilityModifier(key);
      return {
        name: label, proficient,
        bonus: base === null || (proficient && proficiency === null) ? null :
          base + (proficient ? proficiency! : 0) + (number(save.customModifier) ?? 0),
      };
    }),
    weapons: (Array.isArray(data.weaponsList) ? data.weaponsList : []).map((raw, index) => {
      const weapon = object(raw);
      return {
        id: string(weapon.id) || `${id}-weapon-${index}`,
        name: string(value(weapon, 'name')),
        damage: string(value(weapon, 'dmg')),
        damageType: string(value(weapon, 'dmgType')),
        notes: string(value(weapon, 'notes')),
      };
    }).filter((weapon) => weapon.name),
    features: lines('traits'),
    equipment: lines('equipment'),
    proficiencies: lines('prof'),
  };
}
