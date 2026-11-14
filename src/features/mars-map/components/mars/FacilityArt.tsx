import type { FacilityId } from '../../types/marsMap';
import { useId } from 'react';
import './MarsActivity.css';

// Original pixel geometry in a common slightly angled perspective; no external assets.
export function FacilityArt({ id }: { id: FacilityId }) {
  const solarClip = `${useId()}-solar`;
  return <svg viewBox="0 0 120 90" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
    <defs><clipPath id={solarClip}><path d="M12 32H47L42 55H7ZM73 32H108L113 55H78Z"/></clipPath></defs>
    <path d="M14 72H108V80H98V84H24V80H14Z" fill="#783c3c" opacity=".6" />
    {id === 'habitat' && <>
      <path d="M20 34H28V22H40V16H82V22H94V34H102V70H20Z" fill="#24364c" />
      <path d="M24 36H32V26H44V20H78V26H90V36H98V64H24Z" fill="#f6e0bd" />
      <path d="M24 52H98V64H24Z" fill="#d59469"/><path d="M32 29H88V35H32Z" fill="#ffbd66"/>
      <path d="M33 40H49V51H33ZM73 40H89V51H73Z" fill="#2c627a"/><path className="habitat-window" d="M35 40H47V44H35ZM75 40H87V44H75Z" fill="#a5eff6"/>
      <path d="M53 44H69V70H53Z" fill="#24364c"/><path d="M57 48H65V65H57Z" fill="#6ba6b4"/><path d="M65 58H68V61H65Z" fill="#ffcf70"/>
      <path d="M48 70H74V75H48Z" fill="#ebc49b"/><path d="M58 7H62V17H58Z" fill="#24364c"/><path className="habitat-flag" d="M62 7H75V14H62Z" fill="#ffcf70"/>
    </>}
    {id === 'solar-array' && <>
      <path d="M27 54H33V74H27ZM87 54H93V74H87ZM57 36H63V71H57Z" fill="#24364c"/>
      <path d="M8 28H52L45 60H1ZM68 28H112L119 60H75Z" fill="#24364c"/>
      <path d="M12 32H47L42 55H7ZM73 32H108L113 55H78Z" fill="#428ac3"/>
      <path d="M22 32L17 55M34 32L29 55M9 43H45M84 32L89 55M96 32L101 55M76 43H110" stroke="#a6e6f5" strokeWidth="2"/>
      <g clipPath={`url(#${solarClip})`}><path className="solar-glint" d="M-18 27H-10L1 61H-7Z" fill="#e6fff6" opacity="0"/></g>
      <path d="M53 54H69V71H53Z" fill="#e9d5b6"/><path d="M57 58H65V62H57Z" fill="#ffcf70"/><path d="M22 74H38V78H22ZM82 74H98V78H82Z" fill="#d9ac85"/>
    </>}
    {id === 'greenhouse' && <>
      <path d="M17 38L36 18H84L103 38V68H17Z" fill="#24364c"/>
      <path d="M23 39L40 24H80L97 39V61H23Z" fill="#75b7ac"/>
      <path d="M26 42H94V60H26Z" fill="#305f63"/>
      {[33,54,75].map(x => <g key={x}><path d={`M${x} 55h12v7h-12Z`} fill="#c48b61"/><path d={`M${x+4} 43h4v13h-4Z`} fill="#a9dd7c"/><path className="outpost-leaf" d={`M${x} 44h6v6h-6ZM${x+7} 40h6v7h-6Z`} fill="#79c985"/></g>)}
      <path d="M20 64H100V71H20ZM55 23H60V64H55ZM23 36H97V41H23Z" fill="#e8d8b7"/><path d="M39 28H50V32H35Z" fill="#d5f4e2"/>
      <path d="M14 71H106V76H14Z" fill="#b98165"/>
    </>}
    {id === 'research-lab' && <>
      <path d="M20 31H91V39H101V70H20Z" fill="#24364c"/><path d="M24 35H87V43H97V64H24Z" fill="#e0d9e7"/>
      <path d="M24 58H97V65H24Z" fill="#9484b1"/><path d="M31 42H58V53H31Z" fill="#466f8e"/><path d="M34 42H56V46H34Z" fill="#a7eaf1"/>
      <path className="lab-scan" d="M34 48H39V50H34Z" fill="#c7edcd"/>
      <path d="M70 44H86V70H70Z" fill="#24364c"/><path d="M74 48H82V65H74Z" fill="#a396c6"/>
      <path d="M43 22H49V32H43Z" fill="#24364c"/><path d="M29 8H35V13H41V18H55V24H41V20H35V15H29Z" fill="#a6d8e2"/>
      <path className="lab-signal" d="M53 9H57V16H53ZM58 6H62V10H58Z" fill="#ffcf70"/><path d="M12 54H21V68H12Z" fill="#a396c6"/>
      <path d="M66 70H91V75H66Z" fill="#d3bed4"/>
    </>}
    {id === 'habitat' && <g><path d="M24 52H43V55H24ZM78 52H98V55H78Z" fill="#ec9d64"/><path d="M28 58H39V61H28ZM82 58H93V61H82Z" fill="#b17d65"/><path d="M36 23H42V26H36ZM46 20H74V23H46Z" fill="#fff1d2"/><path d="M9 48H19V65H9Z" fill="#a8c7bf"/><path d="M11 50H16V53H11ZM11 56H16V59H11Z" fill="#356673"/></g>}
    {id === 'solar-array' && <g><path d="M13 34H20L15 53H8ZM75 34H82L87 53H80Z" fill="#75c6db" opacity=".7"/><path d="M48 71H73V77H48Z" fill="#c7a67b"/><path d="M58 58H64V60H58Z" fill="#b8f2d4"/><path d="M50 65H53V70H50ZM69 65H72V70H69Z" fill="#9a775b"/></g>}
    {id === 'greenhouse' && <g><path d="M26 34L40 24H50L36 34Z" fill="#def8d6" opacity=".6"/><path d="M64 26H68V34H64ZM80 30H84V36H80Z" fill="#b6edcf"/><path d="M102 48H112V67H102Z" fill="#b4cebb"/><path d="M104 51H110V54H104ZM104 58H110V61H104Z" fill="#396b66"/><path d="M25 68H38V70H25ZM82 68H95V70H82Z" fill="#fcdb9e"/></g>}
    {id === 'research-lab' && <g><path d="M29 36H64V39H29Z" fill="#fff1ec"/><path d="M31 57H58V59H31Z" fill="#817595"/><path d="M90 46H96V50H90Z" fill="#b4efcf"/><path d="M14 55H18V58H14Z" fill="#d3eff0"/><path d="M86 26H96V37H86Z" fill="#80849b"/><path d="M88 27H94V30H88Z" fill="#bed2d1"/><path d="M35 44H39V51H35ZM48 44H52V51H48Z" fill="#8ecbd4"/></g>}
  </svg>;
}
