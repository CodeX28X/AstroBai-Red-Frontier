import type { GameState } from '../../../shared/types/game'
import { endingSummary } from '../data/endingSummary'
import { CharacterPortrait } from './CharacterPortrait'
import { ResourceSummary } from './ResourceSummary'
import './missionEnding.css'

export function MissionEnding({state,onPlayAgain,onReport,onMenu}:{state:GameState;onPlayAgain:()=>void;onReport:()=>void;onMenu:()=>void}) {
  const summary=endingSummary(state)
  return <section className={`mission-ending ending-${state.outcome??'summary'}`} aria-label="Mission ending">
    <div className="ending-body">
      <header><span className="overline">ASTROBAI / MISSION DEBRIEF</span><h1><span className="ending-mark" aria-hidden="true">{state.outcome==='success'?'✦':'◇'}</span>{summary.heading}</h1></header>
      <div className="ending-bai"><CharacterPortrait speakerId="bai" size={96}/><div><strong>BAI</strong><p>{summary.explanation}</p></div></div>
      <div className="ending-stats">
        <article><span aria-hidden="true">☀</span><h2>Sols completed</h2><strong>{state.completedSol} / {state.actionLimits.maxSol}</strong></article>
        <article><span aria-hidden="true">⌂</span><h2>Crew safety</h2><strong>{summary.crew}</strong></article>
        <article><span aria-hidden="true">◇</span><h2>ICEBOUND science</h2><strong>{summary.science}</strong>{summary.findings.map(finding=><small key={finding}>{finding}</small>)}</article>
      </div>
      <section className="ending-resources"><h2>Supplies remaining</h2><ResourceSummary resources={state.resources}/></section>
      <section className="ending-lessons"><h2>What we learned</h2>{summary.lessons.map(lesson=><p key={lesson}>{lesson}</p>)}</section>
    </div>
    <footer className="ending-actions"><button className="primary" type="button" onClick={onPlayAgain}>Play Again</button><button type="button" onClick={onReport}>View Mission Report</button><button type="button" onClick={onMenu}>Main Menu</button></footer>
  </section>
}
