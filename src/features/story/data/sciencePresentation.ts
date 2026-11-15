import type { IceboundScienceReport, IceboundContext, ExpeditionPlan } from '../../missions/types/icebound.ts'
import { ICEBOUND_SITES } from '../../missions/data/iceboundSites.ts'
import { evidenceQualityIssues, plannedSampleQuality } from '../../missions/engine/icebound/science.ts'

export const SAMPLE_METHOD_LABELS = {'surface-sampling':'Surface sample','subsurface-drilling':'Subsurface drilled sample'} as const
export function evidencePlanAdvice(context:IceboundContext,plan:ExpeditionPlan){
  const issues=evidenceQualityIssues(plannedSampleQuality(context,plan))
  return {issues,scope:plan.activity==='surface-sampling'?'Surface material answers a surface question. It cannot rule out buried ice.':'Drilling investigates a buried layer. Reaching that layer does not guarantee ice.',quality:issues.length?'This plan may leave the evidence inconclusive. You can still complete useful science.':'This plan records the handling and instrument context needed for a clearer finding. The material may still be dry or uncertain.'}
}
export function sciencePresentation(report:IceboundScienceReport){
  const sample=report.samples.find(sample=>report.findings.some(finding=>finding.sampleId===sample.id))??report.samples[0]
  const finding=report.findings.find(finding=>finding.sampleId===sample?.id)
  const classification=report.completionStatus==='complete' ? report.conclusion??finding?.classification??'analysis-incomplete' : 'analysis-incomplete'
  const quality=sample?evidenceQualityIssues(sample.quality):[]
  const next=classification==='analysis-incomplete'? !sample?'Collect a sample, then bring it to the lab.':'Complete the lab analysis and record the report.':classification==='supports-accessible-ice'?'Compare another location or depth before making a wider claim.':classification==='no-accessible-ice-detected'?sample?.method==='surface-sampling'?'Try a deeper sample to investigate buried material.':'Compare a different research site; this sample does not describe all of Mars.':quality.length?'On your next investigation, select sealed sample containers and the Soil Analysis Kit.':'Compare a new location or method; the scenario evidence here remains unresolved.'
  return {sample,finding,classification,site:ICEBOUND_SITES.find(site=>site.id===report.siteId)?.name.replace(' (fictional)','')??'No research site selected',method:sample?SAMPLE_METHOD_LABELS[sample.method]:'No sample collected',quality,next,
    status:report.completionStatus==='complete'?'Investigation complete':'Investigation incomplete',
    lesson:classification==='supports-accessible-ice'?'Evidence can support ice in one sample without proving a whole reserve.':classification==='no-accessible-ice-detected'?'A well-tested negative result helps scientists decide where to look next.':classification==='inconclusive'?'Knowing why evidence is uncertain tells us how to improve the next investigation.':'A conclusion needs a recorded sample and completed analysis.',
    control:classification==='analysis-incomplete'?'Mission Control: more investigation work is needed before a conclusion.':'Mission Control: your careful investigation is valuable, whatever the material contains.',
  }
}
