import { useEffect, useRef, useState } from 'react'
import { advanceRoute, distance, findRoute, type NavigationMesh, type NavigationRequest, type Point } from '../../navigation/navigation'
import { ExpeditionMarker } from './ExpeditionMarker'
import './navigation.css'

export function NavigatingActor({ request, mesh, initial, indoor = false, active = true, reducedMotion = false, onArrive, onBlocked, visible = true }: {
  request?: NavigationRequest; mesh: NavigationMesh; initial: Point; indoor?: boolean; active?: boolean; reducedMotion?: boolean;
  visible?: boolean; onArrive?: (id: number) => void; onBlocked?: () => void;
}) {
  const actor = useRef<HTMLDivElement>(null), follower = useRef<HTMLDivElement>(null)
  const position = useRef(initial), arrived = useRef<number | null>(null)
  const actorPositions = useRef({ astronaut: initial, rover: initial })
  const currentKind = useRef<'astronaut' | 'rover'>('astronaut')
  const followerPosition = useRef({ x: initial.x, y: initial.y + 10 })
  const facing = useRef(1)
  const playedCue = useRef('')
  const callbacks = useRef({ onArrive, onBlocked })
  const [state, setState] = useState('idle')
  const [kind, setKind] = useState<'astronaut' | 'rover'>('astronaut')
  useEffect(() => { callbacks.current = { onArrive, onBlocked } }, [onArrive, onBlocked])
  // State changes mark animation boundaries only; frame positions stay in refs/DOM.
  /* oxlint-disable react/set-state-in-effect */
  useEffect(() => {
    if (!request || !active || !visible) return
    if (arrived.current === request.id) {
      const cue = `${request.id}:${request.activity ?? 'idle'}`
      if (playedCue.current === cue) { setState('idle'); return }
      playedCue.current = cue
      setState(request.activity ?? 'idle')
      const resting = window.setTimeout(() => setState('idle'), 1400)
      return () => clearTimeout(resting)
    }
    const element = actor.current
    if (!element) return
    const requestedKind = request.kind ?? 'astronaut'
    if (requestedKind !== currentKind.current) {
      actorPositions.current[currentKind.current] = position.current
      position.current = actorPositions.current[requestedKind]
      currentKind.current = requestedKind
      element.style.left = `${position.current.x}%`; element.style.top = `${position.current.y}%`
    }
    const route = findRoute(position.current, request.point, mesh)
    if (!route.length) { setState('waiting'); callbacks.current.onBlocked?.(); return }
    setKind(request.kind ?? 'astronaut')
    const isRover = request.kind === 'rover'
    setState(!indoor && !isRover ? 'airlock' : 'turning')
    let frame = 0, index = 1, followerIndex = 1, previous = 0, elapsed = 0, cancelled = false, restTimer = 0
    const followerRoute = request.companion ? [...findRoute(followerPosition.current, position.current, mesh), ...route.slice(1)] : []
    const totalLength = route.reduce((total, p, i) => i ? total + Math.hypot(p.x-route[i-1].x, (p.y-route[i-1].y)*mesh.aspect) : 0, 0)
    const speed = reducedMotion ? Math.max(15, totalLength / .35) : indoor ? 20 : isRover ? 22 : 14
    function place(node: HTMLDivElement | null, p: Point, facing: number) {
      if (!node) return
      node.style.left = `${p.x}%`; node.style.top = `${p.y}%`
      node.style.setProperty('--facing', `${facing}`)
      node.style.zIndex = `${100 + Math.round(p.y)}`
    }
    function finish() {
      if (cancelled) return
      arrived.current = request!.id
      setState('arriving')
      timer = window.setTimeout(() => {
        playedCue.current = `${request!.id}:${request!.activity ?? 'idle'}`
        setState(request!.activity ?? 'idle')
        callbacks.current.onArrive?.(request!.id)
        restTimer = window.setTimeout(() => setState('idle'), 1400)
      }, reducedMotion ? 0 : 160)
    }
    function step(now: number) {
      if (document.hidden) { previous = now; frame = requestAnimationFrame(step); return }
      const dt = previous ? Math.min((now - previous) / 1000, .08) : 0
      previous = now; elapsed += dt
      const result = advanceRoute(position.current, route, index, dt, speed, mesh.aspect)
      position.current = result.position; index = result.index
      if (result.facing) facing.current = result.facing
      place(element, result.position, facing.current)
      if (element) { element.dataset.velocityX = `${result.velocity.x}`; element.dataset.velocityY = `${result.velocity.y}` }
      const separated = distance(followerPosition.current, result.position, mesh.aspect) >= 5.5
      if (request!.companion && elapsed > (reducedMotion ? .08 : .55) && (!result.arrived || separated)) {
        const following = advanceRoute(followerPosition.current, followerRoute, followerIndex, dt, speed, mesh.aspect)
        followerPosition.current = following.position; followerIndex = following.index
        place(follower.current, following.position, following.facing || facing.current)
      }
      if (result.arrived && (!request!.companion || !separated || followerIndex >= followerRoute.length)) { finish(); return }
      frame = requestAnimationFrame(step)
    }
    let timer = window.setTimeout(() => { setState('walking'); frame = requestAnimationFrame(step) }, reducedMotion ? 0 : !indoor && !isRover ? 500 : 120)
    return () => { cancelled = true; cancelAnimationFrame(frame); clearTimeout(timer); clearTimeout(restTimer) }
  }, [request, mesh, indoor, active, reducedMotion, visible])
  /* oxlint-enable react/set-state-in-effect */
  return <>
    {request && ['airlock','turning','walking'].includes(state) && active && <span className="destination-ring" style={{ left: `${request.point.x}%`, top: `${request.point.y}%` }} aria-hidden="true">⌖</span>}
    <div ref={actor} hidden={!visible} className={`nav-actor ${indoor ? 'nav-indoor' : 'nav-outdoor'} nav-${state} nav-${kind}${reducedMotion ? ' nav-still' : ''}`} data-motion={state} data-kind={kind} style={{ left: `${initial.x}%`, top: `${initial.y}%` }}>
      <span className="nav-shadow"/><span className="nav-body"><ExpeditionMarker kind={kind}/></span>
      <span className="nav-label">{state === 'airlock' ? 'Airlock · suit check' : kind === 'rover' ? 'Scout' : indoor ? 'Captain Kiki' : 'Kiki · EVA suit'}</span>
      {['working', 'scanning', 'sampling'].includes(state) && <span className="nav-tool" aria-hidden="true">✧</span>}
    </div>
    <div ref={follower} hidden={!request?.companion || !visible} className={`nav-actor nav-companion nav-${state} nav-${request?.companionKind ?? 'astronaut'}`} style={{ left: `${initial.x}%`, top: `${initial.y + 10}%` }} aria-label={request?.companionKind === 'rover' ? 'Assigned rover following' : 'Assigned crew following'}><span className="nav-body"><ExpeditionMarker kind={request?.companionKind ?? 'astronaut'}/></span></div>
  </>
}
