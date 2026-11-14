/** Replace a portrait path here when approved character art is available. */
export const CHARACTERS = {
  bai: { name: 'BAI', role: 'Your curious outpost helper', symbol: '✦', portrait: '/assets/portraits/bai.svg' },
  kiki: { name: 'Captain Kiki', role: 'Commander', symbol: '★', portrait: '/assets/portraits/kiki.svg' },
  kofi: { name: 'Dr. Kofi', role: 'Scientist', symbol: '⚗', portrait: '/assets/portraits/kofi.svg' },
  menemo: { name: 'Menemo', role: 'Engineer', symbol: '⚒', portrait: '/assets/portraits/menemo.svg' },
  olef: { name: 'Dr. Olef', role: 'Medic', symbol: '✚', portrait: '/assets/portraits/olef.svg' },
  scout: { name: 'Scout', role: 'Research rover', symbol: '▣', portrait: '/assets/portraits/scout.svg' },
  earth: { name: 'Earth Mission Control', role: 'Mission planning team', symbol: '◉', portrait: '/assets/portraits/earth.svg' },
} as const
export type SpeakerId = keyof typeof CHARACTERS
