import type { SceneArtwork, StoryArtwork } from '../types/scenes'

// Supplied by the user. Backgrounds depict scenes; they never determine state.
export const sceneArtwork: readonly SceneArtwork[] = [
  { id: 'menu-dusk', label: 'Menu · dusk', description: 'A quiet red plain with stars and a distant outpost.' },
  { id: 'launch-pad', label: 'Launch · dawn', description: 'A rocket on its launch pad at sunrise.', note: 'The countdown is baked into this reference image; it is not a working timer.' },
  { id: 'launch-pad-simple', label: 'Launch · alternate', description: 'A simpler dawn launch scene.', note: 'Baked countdown text remains in the supplied artwork.' },
  { id: 'cruise-window', label: 'Cruise · window', description: 'Earth and Mars seen through the spacecraft window.' },
  { id: 'cruise-cabin', label: 'Cruise · cabin', description: 'Spacecraft instruments beneath a view of Earth and Mars.', note: 'Instrument numbers are artwork, not live readings.' },
  { id: 'landing-plain', label: 'Landing · open plain', description: 'A clear top-down landing plain.' },
  { id: 'landing-canyon', label: 'Landing · canyon', description: 'A top-down canyon with cliffs, rocks and cracks.' },
  { id: 'landing-descent', label: 'Landing · descent', description: 'A lander descends through dust over the canyon.' },
  { id: 'outpost-panorama', label: 'Outpost · distant view', description: 'A small outpost beside a broad Martian crater.' },
  { id: 'outpost-sunrise', label: 'Outpost · sunrise', description: 'An illustrated colony with facilities and crew at sunrise.', note: 'Illustrated backdrop only. Use Developer B’s MarsMap for selectable facilities.' },
  { id: 'outpost-storm', label: 'Storm · narrative view', description: 'Dust blows across the distant outpost.', note: 'An illustration, not an event trigger or a replacement for B’s state-controlled effects.' },
  { id: 'icebound-canyon', label: 'ICEBOUND · canyon view', description: 'Layered cliffs surround a small outpost.', note: 'Illustration only; no new science finding, expedition rule or separate exploration game is implied.' },
]

export function storyAssetUrl(id: StoryArtwork, baseUrl = `${import.meta.env.BASE_URL}assets/story`): string {
  return `${baseUrl.replace(/\/$/, '')}/${id}.png`
}
