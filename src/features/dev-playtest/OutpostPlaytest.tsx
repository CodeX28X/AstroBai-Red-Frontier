import { validateMissionTransition } from '../missions/index.ts'
import { Data, type StageProps } from './common.tsx'
import { IceboundPlaytest } from './IceboundPlaytest.tsx'

export function OutpostPlaytest(props: StageProps) {
  const { state, send } = props
  const debrief = validateMissionTransition(state, { type: 'ENTER_DEBRIEF' })
  return <section><h2>Outpost</h2>
    <p>Sol {state.sol}/{state.actionLimits.maxSol}; major actions {state.actionsRemaining}/{state.actionLimits.maxActionsPerSol}. Outcome: {state.outcome ?? 'active'}.</p>
    <h3>Resources</h3><Data value={state.resources}/>
    <h3>Crew readiness</h3><Data value={{ available: state.iceboundReadiness.crewAvailable, safeForEva: state.iceboundReadiness.crewSafeForEva }}/>
    <p>Numeric crew condition/health and power allocation are not implemented.</p>
    <h3>Actual facilities</h3><Data value={state.facilities}/>
    <p>Facility operation/repair and recurring production/consumption are not implemented. Advancing a sol currently resets slots without consuming resources.</p>
    <button disabled={state.outcome !== null || state.sol >= state.actionLimits.maxSol} onClick={() => send({ type: 'ADVANCE_SOL' })}>Advance sol</button>
    <button disabled={state.outcome !== null || state.actionsRemaining === 0} onClick={() => send({ type: 'SPEND_ACTION_SLOT',
      category: 'operation', actionId: `playtest-slot:${state.sol}:${state.spentActionIds.length}` })}>Test slot tracking only (no operation effects)</button>
    <button disabled={!debrief.allowed} onClick={() => send({ type: 'ENTER_DEBRIEF' })}>Enter debrief</button>
    {!debrief.allowed && <p>{debrief.message}</p>}
    <IceboundPlaytest {...props}/>
  </section>
}

