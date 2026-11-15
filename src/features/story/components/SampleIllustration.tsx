import type { SamplingMethod } from '../../missions/types/icebound'
import { ADVENTURE_ASSETS } from '../../../shared/assets/gameAssets'
import { PixelImage } from '../../../shared/components/PixelImage'
import { SAMPLE_METHOD_LABELS } from '../data/sciencePresentation'

export function SampleIllustration({method,className=''}:{method?:SamplingMethod;className?:string}){
  return <figure className={`sample-illustration ${method==='subsurface-drilling'?'sample-core':'sample-surface'} ${className}`}><PixelImage src={method?ADVENTURE_ASSETS.samples[method]:ADVENTURE_ASSETS.samples.placeholder} alt={method?`${SAMPLE_METHOD_LABELS[method]} illustration; appearance alone does not prove ice`:'No sample collected yet'} fallbackText={method==='subsurface-drilling'?'▥':'◒'}/><figcaption>{method?SAMPLE_METHOD_LABELS[method]:'No sample collected'}<small>Illustration · appearance does not prove ice.</small></figcaption></figure>
}
