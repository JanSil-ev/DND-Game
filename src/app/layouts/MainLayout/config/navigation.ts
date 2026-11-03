import { routes } from "../../../router/routes";

export const navigation = [
  { label: "Главная", path: routes.home },
  { label: "Клуб", path: routes.club },
  { label: "Карта", path: routes.map },
  { label: "Персонажи", path: routes.characters },
  { label: "NPC", path: routes.npc },
  { label: "Инвентарь", path: routes.inventory },
  { label: "Заметки", path: routes.notes },
  { label: "Кости", path: routes.dice },
] as const;

