/** Replace a portrait path here when approved character art is available. */
export const CHARACTERS = {
  bai: { name: 'BAI', role: 'Your curious outpost helper', symbol: '✦', portrait: '/assets/characters/bai/portrait.png', fallbackPortrait:'/assets/portraits/bai.svg' },
  kiki: { name: 'Captain Kiki', role: 'Commander', symbol: '★', portrait: '/assets/characters/captain-kiki/portrait.png', fallbackPortrait:'/assets/portraits/kiki.svg' },
  kofi: { name: 'Dr. Kofi', role: 'Scientist', symbol: '⚗', portrait: '/assets/characters/dr-kofi/portrait.png', fallbackPortrait:'/assets/portraits/kofi.svg' },
  menemo: { name: 'Menemo', role: 'Engineer', symbol: '⚒', portrait: '/assets/characters/menemo/portrait.png', fallbackPortrait:'/assets/portraits/menemo.svg' },
  olef: { name: 'Dr. Olef', role: 'Medic', symbol: '✚', portrait: '/assets/characters/dr-olef/portrait.png', fallbackPortrait:'/assets/portraits/olef.svg' },
  scout: { name: 'Scout', role: 'Research rover', symbol: '▣', portrait: '/assets/portraits/scout.svg', fallbackPortrait:'/assets/portraits/scout.svg' },
  earth: { name: 'Earth Mission Control', role: 'Mission planning team', symbol: '◉', portrait: '/assets/portraits/earth.svg', fallbackPortrait:'/assets/portraits/earth.svg' },
} as const
export type SpeakerId = keyof typeof CHARACTERS
