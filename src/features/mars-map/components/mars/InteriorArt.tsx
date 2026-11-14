import type { FacilityId } from '../../types/marsMap';
import { RoomDetails } from './RoomDetails';
import { InteriorActivity } from './InteriorActivity';

export function InteriorArt({ id }: { id: FacilityId }) {
  const floor = { habitat: '#9b9984', 'research-lab': '#879e9c', greenhouse: '#859783', 'solar-array': '#7b8d8c' }[id];
  return <svg className="interior-art" viewBox="0 0 800 500" preserveAspectRatio="none" aria-hidden="true" shapeRendering="crispEdges">
    <path d="M0 0H800V500H0Z" fill="#152938"/><path d="M35 25H765V455H35Z" fill="#688184"/><path d="M47 37H753V132H47Z" fill="#34515e"/><path d="M47 132H753V443H47Z" fill={floor}/>
    {Array.from({length:9},(_,i)=><path key={i} d={`M${55+i*85} 133V441`} stroke="#738780" strokeWidth="2"/>)}
    {Array.from({length:6},(_,i)=><path key={i} d={`M48 ${155+i*55}H752`} stroke="#738780" strokeWidth="2"/>)}
    <path d="M48 126H752V137H48Z" fill="#bdd0bc"/><path d="M48 42H752V49H48Z" fill="#7c9b9d"/><path d="M55 51H150V99H55ZM650 51H745V99H650Z" fill="#152b3b"/><path d="M60 56H145V94H60ZM655 56H740V94H655Z" fill="#c27558"/><path d="M60 86H94V76H123V68H145V94H60ZM655 82H690V70H718V80H740V94H655Z" fill="#8e4f48"/>
    <path d="M91 55H96V95H91ZM691 55H696V95H691Z" fill="#89acac"/>
    <path className="room-light" d="M285 59H515V66H285Z" fill="#d8f5ce"/>
    <path d="M85 185H290V249H85ZM470 185H706V249H470ZM470 366H706V423H470Z" fill="#526a69"/>
    {id === 'research-lab' && <>
      <path d="M91 142H282V226H91Z" fill="#203e4d"/><path d="M100 150H273V216H100Z" fill="#acd0c4"/>
      {[112,157,202,247].map(x=><g key={x}><path d={`M${x} 165h16v34h-16Z`} fill="#3d6c7c"/><path d={`M${x+3} 182h10v14h-10Z`} fill="#dab586"/><path d={`M${x-2} 162h20v5h-20Z`} fill="#f0e2b5"/></g>)}
      <path d="M478 171H701V223H478Z" fill="#d8d5b7"/><path d="M555 125H571V177H555ZM540 177H594V187H540Z" fill="#355c6b"/><path d="M559 112H594V127H559Z" fill="#c6ded7"/><path d="M580 127H590V151H580Z" fill="#98cbcc"/><path d="M610 153H631V176H610Z" fill="#94c6c0"/>
      <path d="M480 328H695V399H480Z" fill="#d1c4a2"/><path className="room-monitor" d="M510 294H608V355H510Z" fill="#203d4d"/><path className="room-monitor" d="M518 302H600V347H518Z" fill="#63a6ac"/><path className="monitor-line" d="M527 327H543V311H552V336H564V317H590" stroke="#d1f0bd" strokeWidth="3" fill="none"/><path d="M525 367H599V377H525Z" fill="#3c5960"/>
    </>}
    {id === 'habitat' && <>
      <path d="M90 143H280V224H90Z" fill="#2c4554"/><path d="M100 150H270V179H100ZM100 187H270V216H100Z" fill="#dab987"/><path d="M106 154H135V174H106ZM106 191H135V211H106Z" fill="#f5e6c5"/><path d="M145 151H267V177H145ZM145 188H267V214H145Z" fill="#689a9b"/>
      <path d="M499 158H679V210H499Z" fill="#d0ad7d"/><path d="M488 143H523V155H488ZM653 143H688V155H653ZM488 214H523V226H488ZM653 214H688V226H653Z" fill="#335361"/><path d="M543 171H563V184H543ZM616 183H636V196H616Z" fill="#e7e1bf"/>
      <path d="M475 314H699V399H475Z" fill="#344c5a"/><path d="M485 323H689V382H485Z" fill="#77998c"/><path d="M493 332H544V374H493ZM556 332H607V374H556ZM619 332H679V374H619Z" fill="#9fc0a2"/>
    </>}
    {id === 'greenhouse' && <>
      {[105,170,235].map(x=><g key={x}><path d={`M${x} 145h39v75h-39Z`} fill="#674d3e"/>{[153,178,203].map(y=><path key={y} className="plant-leaf" d={`M${x+16} ${y}h7v13h-7v-7h-8v-8h8v-5h10v7h-3Z`} fill="#b9d78a"/>)}</g>)}
      <path d="M510 132H560V221H510ZM605 132H655V221H605Z" fill="#adc6bb"/><path d="M515 158H555V192H515ZM610 158H650V192H610Z" fill="#68a3af"/><path d="M560 210H582V157H606" stroke="#426571" strokeWidth="9" fill="none"/>
      <path d="M481 323H696V399H481Z" fill="#c6b78e"/>{[499,548,597,646].map(x=><g key={x}><path d={`M${x} 338h25v33h-25Z`} fill="#e0d6ad"/><path d={`M${x+8} 346h9v13h-9Z`} fill="#59876c"/></g>)}
    </>}
    {id === 'solar-array' && <>
      {[99,160,221].map(x=><g key={x}><path d={`M${x} 139h50v85h-50Z`} fill="#2e4b5b"/><path d={`M${x+6} 146h38v69h-38Z`} fill="#7b989b"/><path className="room-light" d={`M${x+11} 155h9v6h-9Z`} fill="#c4eaa3"/><path d={`M${x+11} 183h27v4h-27v8h27v4h-27Z`} fill="#47636a"/></g>)}
      <path d="M480 150H695V218H480Z" fill="#b9c5b5"/><path className="room-monitor" d="M508 113H669V185H508Z" fill="#253e50"/><path className="room-monitor" d="M516 121H661V177H516Z" fill="#5b969c"/><path d="M527 134H558V162H527ZM568 134H599V162H568ZM609 134H640V162H609Z" fill="#a4d6cd"/>
      <path d="M480 324H695V399H480Z" fill="#b5a17b"/><path d="M505 337H515V375H505ZM493 333H527V344H493Z" fill="#36586a"/><path d="M563 336H590V345H577V376H567V345H563Z" fill="#c3d8cc"/><path d="M622 341H665V370H622Z" fill="#e0b76d"/>
    </>}
    <path d="M345 418H435V463H345Z" fill="#1d3544"/><path d="M352 425H428V455H352Z" fill="#bfcbb3"/><path d="M365 436H415V444H365Z" fill="#5c7b7e"/>
    <RoomDetails id={id}/>
    <InteriorActivity id={id}/>
  </svg>;
}
