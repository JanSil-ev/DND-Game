import { describe, expect, it } from 'vitest';
import rian from '../data/rian.json';
import { importLssCharacter } from './importLssCharacter';

describe('LSS character import', () => {
  const character = importLssCharacter(rian, 'rian');
  it('reads the nested export and preserves manually saved combat values', () => {
    expect(character.name).toBe('Риан Эстервиль');
    expect(character.abilities.dex).toEqual({ score: 16, modifier: 3 });
    expect(character.initiative).toBe(2);
    expect(character.speed).toBe(35);
    expect(character.hp).toEqual({ current: 24, max: 24, temporary: 0 });
  });
  it('accounts for expertise, proficiency and bard half proficiency separately', () => {
    const bonus = (name: string) => character.skills.find((skill) => skill.name === name)?.bonus;
    expect(bonus('Выступление')).toBe(7);
    expect(bonus('Акробатика')).toBe(5);
    expect(bonus('Магия')).toBe(1);
    expect(bonus('Атлетика')).toBe(0);
    expect(character.saves.find((save) => save.name === 'Ловкость')?.bonus).toBe(5);
  });
  it('extracts readable paragraphs without merging words or exposing markup', () => {
    expect(character.features).toContain('Фея. Вы Фея, а не Гуманоид.');
    expect(character.equipment).toContain('Кожаный доспех');
    expect(character.weapons).toHaveLength(3);
  });
  it('rejects an invalid character and keeps absent numeric fields unknown', () => {
    expect(() => importLssCharacter({ data: '{}' }, 'empty')).toThrow();
    const minimal = importLssCharacter({ data: JSON.stringify({ jsonType: 'character', name: { value: 'Герой' } }) }, 'minimal');
    expect(minimal.hp.max).toBeNull();
    expect(minimal.abilities.str.modifier).toBeNull();
    expect(minimal.skills).toEqual([]);
  });
});
