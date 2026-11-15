import { ICEBOUND_SITES } from '../../data/iceboundSites.ts'
import type { ExpeditionPlan, IceboundContext, IceboundReview, ExpeditionMethod } from '../../types/icebound.ts'
import { baseIssues, availableEquipment, capabilitiesFor, costIssues, fieldIssues, expeditionCost, samplingCost, iceboundIssue } from './readiness.ts'

export function evaluateResearchSite(context: IceboundContext, siteId: string, method?: ExpeditionMethod) {
  const site = ICEBOUND_SITES.find((item) => item.id === siteId)
  const issues = baseIssues(context)
  if (!context.mission.completedObjectives.includes('icebound.recon') ||
      !context.mission.observations.some((observation) => observation.siteId === siteId)) {
    issues.push(iceboundIssue('RECON_REQUIRED', 'Compare reconnaissance observations before choosing a site.'))
  }
  if (!site) issues.push(iceboundIssue('UNKNOWN_SITE', 'Choose a site from the research list.'))
  const capabilities = capabilitiesFor(context)
  const possibleMethods = site?.methods.filter((candidate) => {
    const rover = candidate !== 'astronaut-team'
    const crew = candidate !== 'rover-only'
    return (!rover || (capabilities.has('rover') && context.readiness.roverOperational && context.readiness.roverEnergyReady)) &&
      (!crew || (capabilities.has('eva') && context.readiness.crewAvailable && context.readiness.crewSafeForEva))
  }) ?? []
  if (site && (method ? !possibleMethods.includes(method) : possibleMethods.length === 0)) {
    issues.push(iceboundIssue('SITE_INACCESSIBLE', 'This site cannot be reached with the selected team and current readiness.'))
  }
  return { allowed: issues.length === 0, site: site ? structuredClone(site) : null, issues, possibleMethods,
    scienceRecommendationIds: site ? [`icebound.compare.${site.id}`, 'icebound.separate-hazard-from-evidence'] : [] }
}

export function listResearchSites(context: IceboundContext) {
  return ICEBOUND_SITES.map((site) => {
    const assessment = evaluateResearchSite(context,site.id)
    const completed = context.mission.investigations.some(investigation=>investigation.siteId===site.id && investigation.report)
    const current = context.mission.selectedSiteId===site.id
    const active = !!context.mission.selectedSiteId && !context.mission.report
    const reason = completed ? 'This site already has a recorded report.' : active ? 'Finish the current investigation before choosing another site.' : assessment.issues[0]?.explanation
    return {...assessment, completed, current, selectable:assessment.allowed && !completed && !active, selectionReason:reason}
  })
}

/** Copies a request without changing quantities, adding tools or approving the plan. */
export function createExpeditionPlan(plan: ExpeditionPlan): ExpeditionPlan { return structuredClone(plan) }

export function validateExpeditionPlan(context: IceboundContext, plan: ExpeditionPlan): IceboundReview {
  const assessment = evaluateResearchSite(context, plan.siteId, plan.method)
  const blockers = [...assessment.issues]
  const warnings = []
  const recommendations = []
  const validMethod = ['rover-only', 'astronaut-team', 'combined'].includes(plan.method)
  const validActivity = ['surface-sampling', 'subsurface-drilling'].includes(plan.activity)
  if (!validMethod || !validActivity) blockers.push(iceboundIssue('INVALID_PLAN_METHOD', 'Choose a listed expedition and sampling method.'))
  if (context.mission.selectedSiteId !== plan.siteId) blockers.push(iceboundIssue('SITE_NOT_SELECTED', 'Plan for the research site you selected.'))
  const inventory = new Set(availableEquipment(context))
  if (new Set(plan.equipmentIds).size !== plan.equipmentIds.length) blockers.push(iceboundIssue('DUPLICATE_EQUIPMENT', 'List each expedition tool once.'))
  for (const id of plan.equipmentIds) {
    if (!inventory.has(id)) blockers.push(iceboundIssue('EQUIPMENT_UNAVAILABLE', `Equipment ${id} must be confirmed cargo and deployed in working order.`))
  }
  const capabilities = capabilitiesFor(context, [...plan.equipmentIds])
  const required = [...assessment.site?.requiredCapabilities ?? []]
  if (validActivity) required.push(plan.activity === 'subsurface-drilling' ? 'drilling' : 'surface-sampling')
  if (plan.method !== 'astronaut-team') required.push('rover')
  if (plan.method !== 'rover-only') required.push('eva')
  for (const capability of new Set(required)) {
    if (!capabilities.has(capability)) blockers.push(iceboundIssue('MISSING_CAPABILITY', `This plan needs ${capability} capability.`))
  }
  blockers.push(...fieldIssues(context, plan.method !== 'rover-only'))
  const requiredResources = validMethod && assessment.site ? expeditionCost(context, plan, assessment.site.travelRequirement) : {}
  const samplingResources = validActivity ? samplingCost(context, plan.activity) : {}
  blockers.push(...costIssues(context, requiredResources, 1))
  for (const [resource, value] of Object.entries(plan.supplies)) {
    if (!['power', 'oxygen', 'water', 'food'].includes(resource) || !Number.isFinite(value) || value < 0) {
      blockers.push(iceboundIssue('INVALID_SUPPLIES', 'Supply amounts must be non-negative game units.'))
    }
  }
  for (const resource of ['power', 'oxygen', 'water', 'food'] as const) {
    const requiredSupply = (requiredResources[resource] ?? 0) + (samplingResources[resource] ?? 0)
    if ((plan.supplies[resource] ?? 0) < requiredSupply) blockers.push(iceboundIssue('SUPPLIES_NOT_PLANNED', `Plan at least ${requiredSupply} game units of ${resource} for the trip and collection.`))
    if ((plan.supplies[resource] ?? 0) > context.game.resources[resource]) blockers.push(iceboundIssue('SUPPLIES_UNAVAILABLE', `There is not enough ${resource} for the declared supplies.`))
  }
  if (context.readiness.weather === 'caution' || (plan.method !== 'rover-only' && context.readiness.radiation === 'caution')) {
    warnings.push(iceboundIssue('ADVISORY_CAUTION', 'An advisory is active. Review the route and monitor conditions.', 'warning'))
  }
  if (assessment.site?.hazards.length) {
    warnings.push(iceboundIssue('SITE_HAZARDS', `Review the site hazards separately from its science clues: ${assessment.site.hazards.join(', ')}.`, 'warning'))
  }
  if (plan.method === 'rover-only') recommendations.push(iceboundIssue('ROVER_TRADEOFF', 'A rover keeps the crew at the outpost, but can only use the tools in this plan.', 'recommendation'))
  if (plan.method === 'combined') recommendations.push(iceboundIssue('COMBINED_TRADEOFF', 'Crew and rover offer more options but need supplies for both.', 'recommendation'))
  if (!capabilities.has('field-analysis')) recommendations.push(iceboundIssue('FIELD_INSTRUMENT_SUGGESTED', 'A field analysis kit could improve sample context. It cannot make ice appear.', 'recommendation'))
  return { allowed: blockers.length === 0, blockers, warnings, recommendations, requiredResources, samplingResources, actionSlotCost: 1, samplingActionSlotCost: 1 }
}

export function reviewExpeditionPlan(context: IceboundContext, plan: ExpeditionPlan): IceboundReview {
  return validateExpeditionPlan(context, plan)
}
