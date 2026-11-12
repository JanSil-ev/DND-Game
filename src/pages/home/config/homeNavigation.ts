import { routes } from '../../../app/router/routes';

export const homeNavigation = [
  {
    title: 'Персонажи',
    icon: 'sword',
    description: 'Игровые герои кампании',
    to: routes.characters,
  },
  {
    title: 'NPC',
    icon: 'people',
    description: 'Союзники и противники',
    to: routes.npc,
  },
  {
    title: 'Банда 3.5',
    icon: 'club',
    description: 'Организация, помещения и казна',
    to: routes.club,
  },
  {
    title: 'Карта',
    icon: 'map',
    description: 'Вотердип и важные места',
    to: routes.map,
  },
  {
    title: 'Заметки',
    icon: 'notes',
    description: 'История приключений',
    to: routes.notes,
  },
  { title: 'Инвентарь', icon: 'bag', description: 'Общий рюкзак и трофеи группы', to: routes.inventory },
  { title: 'Кости судьбы', icon: 'dice', description: 'Броски, модификаторы и случай', to: routes.dice },
] as const;
