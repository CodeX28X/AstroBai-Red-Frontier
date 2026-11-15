import type { GameState } from '../../../shared/types/game'
import { endingSummary } from '../data/endingSummary'
import { CharacterPortrait } from './CharacterPortrait'
import { ResourceSummary } from './ResourceSummary'
import './missionEnding.css'
import { ResourceIcon } from '../../../shared/components/ResourceIcon'
import { VoiceControls } from './VoiceControls'
import { RESULT_LABELS } from '../data/adventureDirector'
import { sciencePresentation } from '../data/sciencePresentation'

export function MissionEnding({state,onPlayAgain,onReport,onMenu}:{state:GameState;onPlayAgain:()=>void;onReport:()=>void;onMenu:()=>void}) {
  const summary=endingSummary(state)
  return <section className={`mission-ending ending-${state.outcome??'summary'}`} aria-label="Mission ending">
    <div className="ending-body">
      <header><span className="overline">ASTROBAI / MISSION DEBRIEF</span><h1><span className="ending-mark" aria-hidden="true">{state.outcome==='success'?'✦':'◇'}</span>{summary.heading}</h1></header>
      <div className="ending-bai"><CharacterPortrait speakerId="bai" size={96}/><div><strong>BAI</strong><p>{summary.explanation}</p></div></div>
      <div className="ending-cause">{summary.cause ? <ResourceIcon resource={summary.cause} size={54}/> : <span aria-hidden="true">⚗</span>}<div><strong>{summary.scienceHeading}</strong><p>{summary.suggestion}</p><small>The crew stays safely at base while we review our plan.</small></div></div><VoiceControls id="ending" text={`${summary.heading} ${summary.explanation} ${summary.suggestion}`}/>
      <div className="ending-stats">
        <article><span aria-hidden="true">☀</span><h2>Mars Days completed</h2><strong>{state.completedSol} / {state.actionLimits.maxSol}</strong></article>
        <article><span aria-hidden="true">⌂</span><h2>Crew safety</h2><strong>{summary.crew}</strong></article>
        <article><span aria-hidden="true">◇</span><h2>ICEBOUND science</h2><strong>{summary.science}</strong>{summary.findings.map(finding=><small key={finding}>{finding}</small>)}</article>
      </div>
      <section className="ending-investigations" aria-label="ICEBOUND investigation summaries"><h2>Our scientific achievements</h2>{state.icebound.investigations.filter(site=>site.report?.samples&&site.report.findings).map(site=>{const info=sciencePresentation(site.report!);return <article key={site.siteId} className={`ending-science result-${info.classification}`}><strong>{info.site} · {info.status}</strong><p>{info.method} · {RESULT_LABELS[info.classification]}</p><details><summary>Evidence, lesson and Mission Control feedback</summary><p>{info.finding?.observed}</p><p>{info.finding?.conclusion}</p><p>{info.quality.join(' ')||site.report!.limitations[0]}</p><p>{info.lesson}</p><p>{info.control}</p><p>Next: {info.next}</p></details></article>})}</section>
      <section className="ending-resources"><h2>Supplies remaining</h2><ResourceSummary resources={state.resources}/></section>
      <section className="ending-lessons"><h2>What we learned</h2>{summary.lessons.map(lesson=><p key={lesson}>{lesson}</p>)}</section>
    </div>
    <footer className="ending-actions"><button className="primary" type="button" onClick={onPlayAgain}>Play Again</button><button type="button" onClick={onReport}>View Mission Report</button><button type="button" onClick={onMenu}>Main Menu</button></footer>
  </section>
}
