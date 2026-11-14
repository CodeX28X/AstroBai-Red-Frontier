import type { ReactNode } from 'react'

// Asset keys and gallery screens only; these are not engine action/event IDs.
export type StoryArtwork = 'menu-dusk' | 'launch-pad' | 'launch-pad-simple' | 'cruise-window' | 'cruise-cabin' | 'landing-plain' | 'landing-canyon' | 'landing-descent' | 'outpost-panorama' | 'outpost-sunrise' | 'outpost-storm' | 'icebound-canyon'
export interface SceneArtwork {
  readonly id: StoryArtwork
  readonly label: string
  readonly description: string
  readonly note?: string
}
export interface SceneChoice {
  // Pass the actual approved GDD/engine choice ID. No local eligibility logic.
  readonly id: string
  readonly label: string
  readonly consequence?: string
  readonly disabled?: boolean
  readonly blockedReason?: string
}
export interface SceneFrameProps {
  readonly artwork: StoryArtwork
  readonly title: string
  readonly chapterLabel?: string
  readonly speaker?: string
  readonly dialogue?: string
  readonly children?: ReactNode
  readonly choices?: readonly SceneChoice[]
  readonly onSelectChoice?: (id: string) => void
  readonly assetBaseUrl?: string
}
export type MenuCommand = 'start' | 'continue' | 'science' | 'settings'
