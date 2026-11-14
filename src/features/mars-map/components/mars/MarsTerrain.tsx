/** Original scenery; facilities remain independent interactive components above it. */
export function MarsTerrain() {
  return <svg className="terrain-art" viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true" shapeRendering="crispEdges">
    <path d="M0 0H1000V700H0Z" fill="#bc6c50"/>
    <path d="M0 130H90V105H190V80H300V60H540V85H700V105H860V140H1000V0H0Z" fill="#a55146"/>
    <path d="M0 60H75V40H170V20H240V0H0ZM1000 0H850V25H790V48H900V75H1000Z" fill="#793f40"/>
    <path d="M0 145H100V120H210V95H315V80H530V100H695V120H850V155H1000" fill="none" stroke="#dc9264" strokeWidth="9"/>
    <path d="M0 590H80V615H145V650H245V680H380V700H0ZM1000 565H935V600H880V630H800V665H685V700H1000Z" fill="#a45243"/>
    <path d="M0 585H85V610H153V645H252V675H380M1000 561H930V596H875V625H793V660H685" fill="none" stroke="#e09260" strokeWidth="7"/>
    <path d="M130 170H830V200H920V505H840V565H200V535H95V260H130Z" fill="#cc8158"/>
    <path d="M130 180H830M110 510H840" stroke="#dfa471" strokeWidth="2" strokeDasharray="3 17"/>
    <path d="M380 224H500V469H620M500 224H620M380 469H500" fill="none" stroke="#97513f" strokeWidth="38"/>
    <path d="M380 224H500V469H620M500 224H620M380 469H500" fill="none" stroke="#e0a471" strokeWidth="26"/>
    <path d="M380 224H500V469H620M500 224H620M380 469H500" fill="none" stroke="#f0c18c" strokeWidth="2" strokeDasharray="8 12"/>
    <path d="M380 364H620M500 364V602M380 602H620" fill="none" stroke="#b77654" strokeWidth="14"/>
    <path d="M380 364H620M500 364V602M380 602H620" fill="none" stroke="#dfaa77" strokeWidth="8"/>
    {[[380,224],[620,224],[380,469],[620,469]].map(([x,y]) => <g key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(.72 .85) translate(${-x} ${-y})`}>
      <path d={`M${x-108} ${y-55}h216v110h-216Z`} fill="#a65e49"/>
      <path d={`M${x-103} ${y-59}h206v105h-206Z`} fill="#d3ad83"/>
      <path d={`M${x-96} ${y-52}h192v91h-192Z`} fill="#a8876b"/>
      <path d={`M${x-83} ${y-39}h166v65h-166Z`} fill="#bca084"/>
      <path d={`M${x-96} ${y-52}h16m-16 0v16m192-16h-16m16 0v16m-192 75h16m-16 0v-16m192 16h-16m16 0v-16`} stroke="#f1d8aa" strokeWidth="4" fill="none"/>
    </g>)}
    <path d="M460 326H540V385H460Z" fill="#a05c48"/><path d="M465 320H535V377H465Z" fill="#d6b58b"/><path d="M474 329H526V368H474Z" fill="#8f8170"/><path d="M484 338H516V359H484Z" fill="#d4be99"/>
    <path d="M498 296H502V342H498Z" fill="#293b4a"/><path d="M502 298H529V314H502Z" fill="#6dc6c5"/><path d="M505 301H512V308H505Z" fill="#e2f5da"/>
    {[[72,230,1],[898,384,1.2],[125,555,.8],[810,600,1.1],[600,65,.7],[403,577,.7],[75,420,.7],[910,220,.8]].map(([x,y,s]) => <g key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-27 0H27V8H38V22H27V30H-27V22H-38V8H-27Z" fill="#9d5345"/><path d="M-21 6H21V12H29V21H-29V12H-21Z" fill="#743d3c"/><path d="M-17 12H17V19H-17Z" fill="#ad644b"/><path d="M-26 0H26V4H-26Z" fill="#e29a68"/>
    </g>)}
    {Array.from({length:68},(_,i) => { const x=(i*137+19)%1000; const y=(i*97+53)%700; return <path key={i} d={`M${x} ${y}h${i%3===0?7:3}v3h-3Z`} fill={i%2?'#e8ab72':'#a15b48'} opacity=".6"/>; })}
    {[[135,305],[855,325],[400,520],[610,170]].map(([x,y]) => <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}><path d="M0 0H23V18H0Z" fill="#684442"/><path d="M0 -4H23V12H0Z" fill="#dab482"/><path d="M3 -1H20V8H3Z" fill="#9b7960"/><path d="M9 -4H13V12H9Z" fill="#edce94"/></g>)}
    {[[190,330],[820,330],[410,450],[590,255]].map(([x,y]) => <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}><path d="M-4 0H5V18H-4Z" fill="#5f514c"/><path d="M-6 -4H7V2H-6Z" fill="#ffe0a0"/><path d="M-8 18H9V22H-8Z" fill="#a87557"/></g>)}
    <path d="M340 260H372V294H422M623 489H650V530H696" stroke="#6e5649" strokeWidth="3" fill="none"/>
    <path d="M390 410H435M390 416H435M574 291H620M574 297H620" stroke="#aa694e" strokeWidth="3" strokeDasharray="5 7"/>
    {/* Weathered mineral shelves at the exploration edges, outside the base paths. */}
    {[[150,60],[850,60],[140,637],[850,637]].map(([x,y],i)=><g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
      <path d="M-45 0H28V6H43V19H27V24H-41V17H-51V7H-45Z" fill="#744c48"/>
      <path d="M-37 -3H20V2H33V10H-40V3H-37Z" fill={i%2 ? '#a79178' : '#a8aca0'}/>
      <path d="M-34 4H23V7H-34Z" fill="#d3c2a0"/><path d="M-49 27H-22M24 30H45" stroke="#9d7563" strokeWidth="3"/>
    </g>)}
  </svg>;
}

