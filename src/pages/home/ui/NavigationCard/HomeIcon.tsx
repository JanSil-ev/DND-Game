export type HomeIconName = 'sword' | 'people' | 'club' | 'map' | 'notes' | 'bag' | 'dice';
const paths: Record<HomeIconName, string[]> = {
  sword: ['m15 3 6 0 0 6-9 9-6-6 9-9Z', 'm4 10 10 10M8 16l-5 5m0-4 4 4M17 7l-6 6'],
  people: ['M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M2 21v-3a7 7 0 0 1 14 0v3', 'M17 4a4 4 0 0 1 0 8m2 3a6 6 0 0 1 3 5'],
  club: ['m3 10 9-7 9 7v11H3V10Z', 'M9 21v-7h6v7M7 10h.01M17 10h.01'],
  map: ['m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Z', 'M9 3v16m6-14v16'],
  notes: ['M6 3h12v18H6V3Z', 'M9 8h6M9 12h6M9 16h4M3 6h3m-3 5h3m-3 5h3'],
  bag: ['M7 8c-4 4-5 8-4 11 1 3 17 3 18 0 1-3 0-7-4-11H7Z', 'm8 8-2-5 6 1 6-1-2 5M6 9h12', 'M12 12v6m-2-5h3a1 1 0 0 1 0 2h-2a1 1 0 0 0 0 2h3'],
  dice: ['m12 2 10 6v9l-10 5-10-5V8l10-6Z', 'm2 8 10 14L22 8H2l10-6v20M2 17 12 2l10 15H2'],
};
export function HomeIcon({ name }: { name: HomeIconName }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name].map((path, index) => <path key={index} d={path} />)}</svg>;
}
