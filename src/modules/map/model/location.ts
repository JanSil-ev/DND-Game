import type { MapLocation, MapLocationType } from "./types";


export const locationTypes = {
  city: {
    label: "Город",
    color: "#445b8a",
    icon: "d20.svg",
  },
  club: {
    label: "Клуб / База",
    color: "#823e52",
    icon: "d20.svg",
  },
  shop: {
    label: "Магазин",
    color: "#a67c35",
    icon: "bag.svg",
  },
  quest: {
    label: "Задание",
    color: "#b34e3a",
    icon: "sword.svg",
  },
  dungeon: {
    label: "Подземелье",
    color: "#514273",
    icon: "axe.svg",
  },
  temple: {
    label: "Храм",
    color: "#647c91",
    icon: "staff.svg",
  },
  tavern: {
    label: "Таверна",
    color: "#895b37",
    icon: "beer.svg",
  },
  alchemy: {
    label: "Алхимия",
    color: "#587e63",
    icon: "potion.svg",
  },
  other: {
    label: "Другое",
    color: "#6d7d66",
    icon: "d20.svg",
  },
} as const satisfies Record<MapLocationType, { label: string; color: string; icon: string }>;

export const locations = [
  {
    id: '1',
    name: 'Бар 3.5',
    description: 'Наш бар',
    x:63.92,
    y: 26.5,
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