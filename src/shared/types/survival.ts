import type { Resources } from './game.ts'

export type OutpostOperationId = 'recharge' | 'harvest' | 'recycle'
export interface OutpostCareRecord {
  id: string
  sol: number
  operation: OutpostOperationId
  resourceDeltas: Partial<Resources>
}
export interface SurvivalState {
  rules: 'gentle-survival-v1'
  lastUpkeepSol: number
  care: readonly OutpostCareRecord[]
  endedBecause: readonly (keyof Resources)[]
}
