import type { Npc } from './npcSlice';

const portrait = (name: string) => `${import.meta.env.BASE_URL}icon/npcs/${name}.svg`;
export const starterNpcs: Npc[] = [
  {
    id: 'comic-npc-doctor-avos', name: 'Доктор Авось', role: 'Гоблин-врач', relationship: 'friend', locationId: '1',
    portrait: portrait('doctor'),
    description: 'Дежурит в Баре 3.5 и лечит фразой «До свадьбы заживёт». Если пациент уже женат, заметно нервничает. Всегда предлагает приложить подорожник, даже к проклятию. Приём бесплатный, но бинты нужно вернуть.',
  },
  {
    id: 'comic-npc-no-change', name: 'Пафнутий Сдачинет', role: 'Торговец сомнительными редкостями', relationship: 'neutral', locationId: 'location-2',
    portrait: portrait('merchant'),
    description: 'Продаёт на Торговой площади легендарные вещи с обычными свойствами. Его бестселлер — плащ защиты от лёгкого сквозняка. Сдачи нет даже с точной суммы. На жалобы отвечает: «Это не баг, это древнее зачарование».',
  },
  {
    id: 'comic-npc-sir-rustle', name: 'Сэр Шуршал Бумажный', role: 'Скелет — инспектор подземелий', relationship: 'enemy', locationId: 'location-3',
    portrait: portrait('inspector'),
    description: 'Охраняет руины от приключенцев без разрешения на приключения. Перед боем требует заполнить три экземпляра заявления о намерении нанести урон. Теряет ход, если документы скреплены не с той стороны. Больше всего боится огня и неразборчивого почерка.',
  },
];
