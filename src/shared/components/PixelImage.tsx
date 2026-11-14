import { useState } from 'react'
import type { ImgHTMLAttributes } from 'react'
import './pixelAssets.css'

export function PixelImage({src,fallbackSrc,alt,fallbackAlt,fallbackText='◇',className='',...props}: Omit<ImgHTMLAttributes<HTMLImageElement>,'src'|'onError'|'alt'> & {
  src?:string;fallbackSrc?:string;alt:string;fallbackAlt?:string;fallbackText?:string
}) {
  const [failed,setFailed]=useState<readonly string[]>([])
  const resolved=[src,fallbackSrc].find(path=>path&&!failed.includes(path))
  if(!resolved)return <span role="img" aria-label={fallbackAlt??alt} aria-hidden={props['aria-hidden']} className={`pixel-image asset-unavailable ${className}`} style={{width:props.width,height:props.height}}>{fallbackText}</span>
  return <img {...props} className={`pixel-image ${className}`} src={resolved} alt={resolved===src?alt:fallbackAlt??alt} onError={()=>setFailed(previous=>[...previous,resolved])}/>
}
