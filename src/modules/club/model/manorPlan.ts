export const manorFloors = { ground: 'Первый этаж', second: 'Второй этаж', third: 'Третий этаж', attic: 'Мансарды', cellar: 'Подвал' } as const;
export type ManorFloor = keyof typeof manorFloors;
export const manorRooms = [
  { id: 'hall', name: 'Таверна', description: 'Общий зал первого этажа со столами, сценой и барной стойкой.', floor: 'ground', x: 22.78, y: 65.79 },
  { id: 'kitchen', name: 'Кухня', description: 'Кухня в южной части первого этажа.', floor: 'ground', x: 24.99, y: 90.76 },
  { id: 'storage', name: 'Кладовая', description: 'Запасы и снаряжение рядом с залом таверны.', floor: 'ground', x: 36.03, y: 82.44 },
  { id: 'service', name: 'Служебное помещение', description: 'Большое служебное помещение в северной части второго этажа.', floor: 'second', x: 21.68, y: 14.28 },
  { id: 'living', name: 'Гостиная', description: 'Гостиная второго этажа для встреч и отдыха.', floor: 'second', x: 30.51, y: 23.12 },
  { id: 'upper-hall', name: 'Зал', description: 'Зал второго этажа рядом с лестницей.', floor: 'second', x: 33.82, y: 31.45 },
  { id: 'quarters', name: 'Спальня', description: 'Спальня в юго-западной части второго этажа.', floor: 'second', x: 19.47, y: 40.81 },
  { id: 'spare', name: 'Запасная комната', description: 'Запасная комната рядом со спальней второго этажа.', floor: 'second', x: 36.03, y: 41.85 },
  { id: 'master-bedroom', name: 'Спальня на третьем этаже', description: 'Спальня с выходом к личной ванной.', floor: 'third', x: 70.25, y: 14.8 },
  { id: 'bathroom', name: 'Личная ванная', description: 'Личная ванная в северо-восточном углу третьего этажа.', floor: 'third', x: 85.7, y: 15.84 },
  { id: 'toilet-north', name: 'Туалет у лестницы', description: 'Небольшой туалет рядом с центральной лестницей третьего этажа.', floor: 'third', x: 74.66, y: 24.16 },
  { id: 'meeting', name: 'Библиотека и кабинет', description: 'Библиотека и кабинет в восточной части третьего этажа.', floor: 'third', x: 87.91, y: 27.28 },
  { id: 'unlabelled-room', name: 'Комната без подписи', description: 'Меблированная комната в южной части третьего этажа. На присланном плане её назначение не подписано.', floor: 'third', x: 75.77, y: 40.81 },
  { id: 'toilet-south', name: 'Южный туалет', description: 'Маленькое помещение у юго-восточного угла третьего этажа, подписанное на плане «Туалет».', floor: 'third', x: 92.32, y: 35.61 },
  { id: 'turret', name: 'Вершина башенки', description: 'Отдельно показанная на плане верхняя площадка башенки.', floor: 'attic', x: 57.0, y: 55.38 },
  { id: 'attic-bedroom', name: 'Спальня на чердаке', description: 'Спальня в верхней части мансарды.', floor: 'attic', x: 76.87, y: 56.42 },
  { id: 'attic-storage', name: 'Склад на чердаке', description: 'Просторный склад под лестничной площадкой мансарды.', floor: 'attic', x: 76.87, y: 68.91 },
  { id: 'cellar', name: 'Баки для пива', description: 'Баки для пива в северо-западной части подвала.', floor: 'cellar', x: 66.94, y: 83.48 },
  { id: 'hops', name: 'Хмель', description: 'Зона подвала с посадками хмеля.', floor: 'cellar', x: 82.39, y: 82.44 },
  { id: 'wine', name: 'Вино', description: 'Хранение вина в юго-западной части подвала.', floor: 'cellar', x: 66.94, y: 92.85 },
  { id: 'spirits', name: 'Крепкий алкоголь', description: 'Запасы крепкого алкоголя в центральной части подвала.', floor: 'cellar', x: 82.39, y: 92.85 },
  { id: 'satyr-bed', name: 'Кровать сатира', description: 'Кровать сатира в восточной части подвала.', floor: 'cellar', x: 93.43, y: 92.85 },
] satisfies { id: string; name: string; description: string; floor: ManorFloor; x: number; y: number }[];

// Keep the six old IDs so previously edited descriptions stay attached to their rooms.
export const legacyRoomNames: Record<string, string> = { hall: 'Общий зал', kitchen: 'Кухня', storage: 'Склад', meeting: 'Переговорная', quarters: 'Жилые комнаты', cellar: 'Подвал' };
