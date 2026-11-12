export const abilityNames = {
  str: 'Сила', dex: 'Ловкость', con: 'Телосложение',
  int: 'Интеллект', wis: 'Мудрость', cha: 'Харизма',
} as const;

export type Ability = keyof typeof abilityNames;
export interface Character {
  id: string;
  name: string;
  race: string;
  className: string;
  subclass: string;
  level: number | null;
  background: string;
  player: string;
  avatar: string;
  proficiency: number | null;
  abilities: Record<Ability, { score: number | null; modifier: number | null }>;
  hp: { current: number | null; max: number | null; temporary: number | null };
  armorClass: number | null;
  initiative: number | null;
  speed: number | null;
  skills: { name: string; bonus: number | null; proficiency: number }[];
  saves: { name: string; bonus: number | null; proficient: boolean }[];
  weapons: { id: string; name: string; damage: string; damageType: string; notes: string }[];
  features: string[];
  equipment: string[];
  proficiencies: string[];
}
