import { routes } from '../../../app/router/routes';

export const homeNavigation = [
  {
    title: 'Персонажи',
    description: 'Игровые герои кампании',
    to: routes.characters,
  },
  {
    title: 'NPC',
    description: 'Союзники и противники',
    to: routes.npc,
  },
  {
    title: 'Клуб-бар',
    description: 'Наша база и её развитие',
    to: routes.club,
  },
  {
    title: 'Карта',
    description: 'Карта города Шарн',
    to: routes.map,
  },
  {
    title: 'Заметки',
    description: 'История приключений',
    to: routes.notes,
  },
] as const;