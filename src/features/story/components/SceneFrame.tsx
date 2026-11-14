import { useId } from 'react'
import { StoryBackdrop } from './StoryBackdrop'
import type { SceneFrameProps } from '../types/scenes'

export function SceneFrame({ artwork, title, chapterLabel, speaker, dialogue, children, choices = [], onSelectChoice, assetBaseUrl }: SceneFrameProps) {
  const titleId = useId()
  const reasonId = useId()
  return <section className="a-story-scene" aria-labelledby={titleId}>
    <StoryBackdrop artwork={artwork} assetBaseUrl={assetBaseUrl}>
      <header className="a-story-scene-header">{chapterLabel && <p>{chapterLabel}</p>}<h1 id={titleId}>{title}</h1></header>
      {(dialogue || children || choices.length > 0) && <div className="a-story-dialogue">
        {speaker && <p className="a-story-speaker">{speaker}</p>}
        {dialogue && <p className="a-story-line">{dialogue}</p>}
        {children}
        {choices.length > 0 && <ul className="a-story-choice-list">{choices.map((choice, index) => <li key={choice.id}>
          <button type="button" disabled={choice.disabled || !onSelectChoice} aria-describedby={choice.blockedReason ? `${reasonId}-${index}` : undefined} onClick={() => onSelectChoice?.(choice.id)}>
            <span>{choice.label}</span>{choice.consequence && <small>{choice.consequence}</small>}
          </button>
          {choice.blockedReason && <p id={`${reasonId}-${index}`} className="a-story-block-reason">{choice.blockedReason}</p>}
        </li>)}</ul>}
      </div>}
    </StoryBackdrop>
  </section>
}
