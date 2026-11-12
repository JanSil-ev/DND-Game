import type { MapLocation, MapLocationType } from './types';

const storageKey = 'dnd-map-user-locations';
const mapLocationTypes: MapLocationType[] = [
  'city',
  'club',
  'shop',
  'quest',
  'dungeon',
  'temple',
  'tavern',
  'alchemy',
  'other',
];

function isMapLocation(value: unknown): value is MapLocation {
  if (!value || typeof value !== 'object') return false;

  const location = value as Record<string, unknown>;

  return (
    typeof location.id === 'string' &&
    typeof location.name === 'string' &&
    typeof location.description === 'string' &&
    typeof location.x === 'number' &&
    location.x >= 0 &&
    location.x <= 100 &&
    typeof location.y === 'number' &&
    location.y >= 0 &&
    location.y <= 100 &&
    typeof location.type === 'string' &&
    mapLocationTypes.includes(location.type as MapLocationType)
  );
}

export function readUserLocations(): MapLocation[] {
  const savedLocations = window.localStorage.getItem(storageKey);

  if (!savedLocations) return [];

  const parsedLocations: unknown = JSON.parse(savedLocations);

  if (!Array.isArray(parsedLocations) || !parsedLocations.every(isMapLocation)) {
    throw new Error('В сохранённых метках карты обнаружены некорректные данные.');
  }

  // Old exports may omit source; every entry in this storage belongs to the user.
  return parsedLocations.map((location) => ({ ...location, source: 'user' }));
}

export function saveUserLocations(locations: MapLocation[]): void {
  window.localStorage.setItem(storageKey, JSON.stringify(locations));
}
