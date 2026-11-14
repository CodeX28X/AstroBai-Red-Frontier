import type { GameAction } from '../../../shared/types/game.ts'

// Opt-in preview setup: every change goes through the existing central reducer.
export const iceboundPreviewSetup: readonly GameAction[] = [
  { type: 'START_GAME' },
  ...['field-rover', 'repair-toolkit', 'soil-analysis-kit', 'sample-container-set', 'portable-oxygen-kit']
    .map(equipmentId => ({ type: 'SET_EQUIPMENT_QUANTITY' as const, equipmentId, quantity: 1 })),
  { type: 'REVIEW_MANIFEST' }, { type: 'CONFIRM_MANIFEST' },
  { type: 'BEGIN_LAUNCH' }, { type: 'COMPLETE_LAUNCH' },
  { type: 'SELECT_LANDING_SITE', siteId: 'landing-safe-zone' },
  { type: 'ADVANCE_SOL' }, { type: 'ADVANCE_SOL' }, { type: 'ADVANCE_SOL' },
]

