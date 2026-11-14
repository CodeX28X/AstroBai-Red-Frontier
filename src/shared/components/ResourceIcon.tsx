import type { Resources } from '../types/game'
import { RESOURCE_ASSETS } from '../assets/gameAssets'
import { PixelImage } from './PixelImage'

export function ResourceIcon({resource,size=32,className=''}:{resource:keyof Resources;size?:number;className?:string}) {
  const asset=RESOURCE_ASSETS[resource]
  return <PixelImage aria-hidden="true" src={asset.src} fallbackSrc={asset.fallback} alt={`${asset.name} icon`} fallbackAlt={`${asset.name} icon placeholder`} fallbackText={asset.name[0]} width={size} height={size} className={`resource-icon ${className}`}/>
}
