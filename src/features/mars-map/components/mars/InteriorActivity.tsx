import type { FacilityId } from '../../types/marsMap';
import './MarsActivity.css';

/** No gauges or outcome simulation: only tiny lights, a fan and equipment detail. */
export function InteriorActivity({ id }: { id: FacilityId }) {
  return <g>
    {(id === 'habitat' || id === 'solar-array') && <g>
      <path d="M421 79H451V107H421Z" fill="#203b49"/><path d="M425 83H447V103H425Z" fill="#6b8c8b"/>
      <path className="room-fan-blades" d="M433 84H439V91H446V97H439V102H433V97H426V91H433Z" fill="#c0cbb1"/>
    </g>}
    {id === 'habitat' && <path className="mug-steam" d="M590 157V151H593V146H590V141" stroke="#e2d5b4" strokeWidth="2" fill="none" opacity="0"/>}
    {id === 'greenhouse' && <>
      <path className="water-bubble" d="M530 187H534V191H530Z" fill="#d3eede" opacity="0"/>
      <path className="water-bubble second" d="M627 187H631V191H627Z" fill="#d3eede" opacity="0"/>
    </>}
    {id === 'research-lab' && <>
      <path className="sample-glimmer" d="M116 173H119V186H116ZM206 174H209V187H206Z" fill="#d0e8d8"/>
      <path className="monitor-cursor" d="M523 306H525V343H523Z" fill="#d7f0cc" opacity=".55"/>
    </>}
    {id === 'solar-array' && <>
      <path className="bay-indicator" d="M533 145H542V151H533Z" fill="#b7e9b7"/>
      <path className="bay-indicator second" d="M614 145H623V151H614Z" fill="#b7e9b7"/>
    </>}
  </g>;
}
