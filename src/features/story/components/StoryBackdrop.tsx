import type { CSSProperties, ReactNode } from 'react'
import { storyAssetUrl } from '../data/sceneArtwork'
import type { StoryArtwork } from '../types/scenes'
import './story.css'

export function StoryBackdrop({ artwork, assetBaseUrl, children, className = '' }: { readonly artwork: StoryArtwork; readonly assetBaseUrl?: string; readonly children?: ReactNode; readonly className?: string }) {
  return <div className={`a-story-backdrop ${className}`} style={{ '--story-art': `url("${storyAssetUrl(artwork, assetBaseUrl)}")` } as CSSProperties}>
    <img className="a-story-art" src={storyAssetUrl(artwork, assetBaseUrl)} alt="" aria-hidden="true" />
    {children}
  </div>
}
