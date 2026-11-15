// Presentation-only identifiers. These are not Developer C's shared state contract.
export type FacilityId = 'habitat' | 'solar-array' | 'greenhouse' | 'research-lab';
export type FacilityStatus = 'operational' | 'offline' | 'damaged';
export type FacilityStatuses = Readonly<Record<FacilityId, FacilityStatus>>;
export type ExpeditionKind = 'rover' | 'astronaut' | 'combined';
// Visual inputs only. Independent flags; no hazard or crew-safety calculations.
export interface MarsEnvironment {
  readonly dustStorm?: boolean;
  readonly solarStormWarning?: boolean;
  readonly crewSheltering?: boolean;
}
export interface ScienceSite {
  readonly id: string;
  readonly label: string;
  readonly status: 'available' | 'locked' | 'active' | 'completed';
  readonly position: { readonly x: number; readonly y: number };
  readonly assignment?: ExpeditionKind;
}

export interface FacilityLocation {
  readonly id: FacilityId;
  readonly label: string;
  readonly shortLabel: string;
  readonly description: string;
  readonly detail: string;
  readonly position: { readonly x: number; readonly y: number };
  readonly color: string;
}

export interface MarsMapProps {
  readonly renderFacilityCard?: (id: FacilityId) => import('react').ReactNode;
  readonly highlightedSiteId?: string;
  readonly fullViewport?: boolean;
  readonly navigation?: {
    readonly evaAllowed: boolean;
    readonly blockedReason?: string;
    readonly roverAvailable: boolean;
    readonly request?: import('../navigation/navigation').NavigationRequest;
    readonly onArrive?: (id: number) => void;
    readonly onBlocked?: (reason: string) => void;
    readonly objectiveFacility?: FacilityId;
    readonly highlightScout?: boolean;
    readonly onScoutSelect?: () => void;
  };
  // Presentation visibility only: a retained map pauses while an interior is open.
  readonly isActive?: boolean;
  // Supplied only after the shared mission system reports an outcome.
  readonly completionNotice?: { readonly id: string; readonly message: string };
  readonly environment?: MarsEnvironment;
  readonly sites?: readonly ScienceSite[];
  readonly selectedSiteId?: string | null;
  readonly onSelectSite?: (id: string) => void;
  readonly facilityStatuses: FacilityStatuses;
  readonly animationsEnabled?: boolean;
  readonly selectedFacilityId: FacilityId | null;
  // Inspection callback only: never spends an action or changes resources.
  readonly onSelectFacility: (id: FacilityId) => void;
}
