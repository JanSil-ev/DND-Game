import type { MapLocation } from "./types";

export const locationTypes = {
  city: { label: 'Город', color: '#ff00ff' },
  club: { label: 'Штаб', color: '#f8620c' },
  shop: { label: 'Торговля', color: '#2fec00' },
  quest: { label: 'Задание', color: '#c83e3e' },
  dungeon: { label: 'Подземелье', color: '#000288' },
  temple: { label: 'Храм', color: '#ffcc00' },
  tavern: { label: 'Таверна', color: '#458452' },
  other: { label: 'Другое', color: '#6d7d66' },
} as const;

export const locations = [
  {
    id: '1',
    name: 'Бар 3.5',
    description: 'Наш бар',
    x:66.9,
    y: 20.7,
    type: 'club',
  },
  {
    id: 'location-2',
    name: 'Торговая площадь',
    description: 'Торговцы, лавки и редкие товары.',
    x: 62,
    y: 58,
    type: 'shop',
  },
  {
    id: 'location-3',
    name: 'Задание: Исследовать руины',
    description: 'Здесь начинается новое приключение.',
    x: 48,
    y: 72,
    type: 'quest',
  },
] satisfies MapLocation[];