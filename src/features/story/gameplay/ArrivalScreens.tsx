import { useState } from 'react'
import { SceneFrame } from '../components/SceneFrame.tsx'
import { LANDING_SITES, validateMissionTransition } from '../../missions/index.ts'
import { resolveResourceEffects } from '../../../shared/store/resourceEffects.ts'
import { ConfirmButton, type ScreenProps } from './ui.tsx'

export function LaunchScreen({ send }: ScreenProps) {
  const [travel, setTravel] = useState(false)
  return <SceneFrame artwork={travel ? 'cruise-window' : 'launch-pad'} chapterLabel={travel ? 'Journey to Mars' : '2 · Launch'}
    title={travel ? 'Next stop: Mars' : 'Ready for lift-off'} dialogue={travel ? 'Your cargo is on board. Continue when you are ready to choose a landing site.' : 'Your confirmed plan is ready. Begin your journey.'}>
    <button type="button" className="a-primary" onClick={() => travel ? send({ type: 'COMPLETE_LAUNCH' }) : setTravel(true)}>{travel ? 'Continue to landing' : 'Begin journey'}</button>
    {!travel && <button type="button" onClick={() => send({ type: 'COMPLETE_LAUNCH' })}>Skip to landing</button>}
    <p>Journey illustrations do not use supplies or major actions.</p>
  </SceneFrame>
}
export function LandingScreen({ state, send }: ScreenProps) {
  return <SceneFrame artwork="landing-descent" chapterLabel="3 · Landing" title="Choose where to land"
    dialogue="Read each choice. Your landing changes starting supplies, and it can only happen once.">
    <div className="mvp-choice-list">{LANDING_SITES.map(site => {
      const review = validateMissionTransition(state, { type: 'SELECT_LANDING_SITE', siteId: site.id })
      const resources = resolveResourceEffects(state.resources, [site.resourceDeltas])
      return <article key={site.id}><h2>{site.title}</h2><p>{site.description}</p>
        <p>{Object.entries(site.resourceDeltas).map(([key, delta]) => key + (delta >= 0 ? ' +' : ' ') + delta).join(' · ')} game units.</p>
        {!review.allowed && <p>{review.message}</p>}{!resources.allowed && <p>{resources.reason}</p>}
        <ConfirmButton disabled={!review.allowed || !resources.allowed} question="Land here? This choice cannot be changed during this mission."
          onConfirm={() => send({ type: 'SELECT_LANDING_SITE', siteId: site.id })}>Land here</ConfirmButton></article>
    })}</div>
  </SceneFrame>
}

