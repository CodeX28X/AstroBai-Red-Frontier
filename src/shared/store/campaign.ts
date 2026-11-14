import type { GameInitializationOptions } from '../types/iceboundIntegration.ts'
/** Explicit fictional mission setup, using the engine's existing trusted option. */
export const LEGACY_CAMPAIGN_OPTIONS: GameInitializationOptions = { installedCapabilities: ['lab-analysis', 'drilling'] }
export const CAMPAIGN_OPTIONS: GameInitializationOptions = { ...LEGACY_CAMPAIGN_OPTIONS, preparationMode: 'supplies' }
