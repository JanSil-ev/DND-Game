export type MapLocationType =
  | 'city'
  | 'club'
  | 'shop'
  | 'quest'
  | 'dungeon'
  | 'temple'
  | 'tavern'
  | 'other';

export interface MapLocation {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  type: MapLocationType;
  source?: 'user';
}