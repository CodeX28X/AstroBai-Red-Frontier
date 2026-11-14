import type { GameInitializationOptions } from '../../../shared/types/iceboundIntegration.ts'

/** Fictional installed infrastructure for the ordinary playable mission, disclosed before packing. */
export const PLAYER_MISSION_OPTIONS: GameInitializationOptions = {
  survivalEnabled: true,
  runId: 'player-mvp-1',
  scenarioId: 'icebound.training-v1',
  installedCapabilities: ['lab-analysis', 'drilling'],
}
export const PLAYER_MISSION_BASELINE = 'Your Mars base already has a home, solar panels, a greenhouse, a water recycler, a lab and a drill. Pack the tools you want for exploring. Keep supplies topped up while you do your research.'

