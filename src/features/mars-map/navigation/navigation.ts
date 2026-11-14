import { marsLocations } from '../data/marsLocations.ts'
import type { FacilityId } from '../types/marsMap.ts'
/** Drawing coordinates (0..100); no gameplay state or resource effects. */
export interface Point { x: number; y: number }
let navigationSequence = 0
export const nextNavigationId = () => ++navigationSequence
export interface Obstacle { left: number; top: number; right: number; bottom: number }
export interface NavigationMesh { bounds: Obstacle; obstacles: readonly Obstacle[]; aspect: number }
export interface NavigationRequest {
  id: number
  point: Point
  kind?: 'astronaut' | 'rover'
  companion?: boolean
  companionKind?: 'astronaut' | 'rover'
  activity?: 'inspecting' | 'working' | 'scanning' | 'sampling' | 'waiting'
}
/** Ground pads in MarsTerrain are ~15.6% wide and 13.4% tall. Include a small wall clearance. */
export const FACILITY_FOOTPRINTS = marsLocations.map(({position:{x,y}})=>({left:x-8.5,right:x+8.5,top:y-9,bottom:y+7.5}))
export function facilityApproachPoint(id:FacilityId):Point {
  const location=marsLocations.find(location=>location.id===id)!
  return {x:location.position.x,y:location.position.y<50?42:78}
}
export const SURFACE_MESH: NavigationMesh = {
  bounds: { left: 6, top: 15, right: 94, bottom: 94 }, aspect: .7,
  obstacles: [
    ...FACILITY_FOOTPRINTS,
    { left: 46, right: 54, top: 44, bottom: 55 },
    { left: 6, right: 11, top: 31, bottom: 39 },
    { left: 86, right: 94, top: 50, bottom: 59 },
    { left: 9, right: 17, top: 75, bottom: 81 },
    { left: 77, right: 85, top: 82, bottom: 89 },
    { left: 10, right: 17, top: 41, bottom: 47 },
    { left: 83, right: 89, top: 44, bottom: 49 },
  ],
}
export const ROOM_MESH: NavigationMesh = {
  bounds: { left: 8, right: 92, top: 29, bottom: 88 }, aspect: .625,
  obstacles: [{ left: 10, right: 37, top: 29, bottom: 50 }, { left: 58, right: 90, top: 29, bottom: 50 }, { left: 58, right: 90, top: 62, bottom: 85 }],
}
export function walkable(p: Point, mesh: NavigationMesh): boolean {
  const b = mesh.bounds
  return Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= b.left && p.x <= b.right && p.y >= b.top && p.y <= b.bottom &&
    !mesh.obstacles.some(o => p.x >= o.left && p.x <= o.right && p.y >= o.top && p.y <= o.bottom)
}
export function scenePoint(client: Point, rect: { left: number; top: number; width: number; height: number }): Point {
  return { x: (client.x - rect.left) / rect.width * 100, y: (client.y - rect.top) / rect.height * 100 }
}
export function distance(a: Point, b: Point, aspect = 1): number { return Math.hypot(b.x - a.x, (b.y - a.y) * aspect) }
export function nearestPoint(target: Point, mesh: NavigationMesh, reachableFrom?:Point): Point | null {
  let best: Point | null = null, score = Infinity
  for (let x = 6; x <= 94; x += 2) for (let y = 16; y <= 94; y += 2) {
    const p = { x, y }, d = distance(p, target, mesh.aspect)
    if (walkable(p, mesh) && d < score && (!reachableFrom || clearSegment(reachableFrom,p,mesh))) { best = p; score = d }
  }
  return best
}
export function clearSegment(a: Point, b: Point, mesh: NavigationMesh): boolean {
  if(!walkable(a,mesh)||!walkable(b,mesh))return false
  // Exact segment/rectangle intersection, including corners and very thin obstacles.
  for(const obstacle of mesh.obstacles){
    let near=0,far=1
    for(const [origin,delta,min,max]of [[a.x,b.x-a.x,obstacle.left,obstacle.right],[a.y,b.y-a.y,obstacle.top,obstacle.bottom]]){
      if(delta===0){if(origin<min||origin>max){near=Infinity;break}}
      else{const t1=(min-origin)/delta,t2=(max-origin)/delta;near=Math.max(near,Math.min(t1,t2));far=Math.min(far,Math.max(t1,t2))}
    }
    if(near<=far)return false
  }
  return true
}
/** A* on a two-percent grid. Four neighbors prevent diagonal corner cutting. */
export function findRoute(start: Point, target: Point, mesh: NavigationMesh): Point[] {
  if(!walkable(start,mesh))return []
  if(clearSegment(start,target,mesh))return distance(start,target)<.001?[{...start}]:[{...start},{...target}]
  const end = nearestPoint(target, mesh), origin = nearestPoint(start, mesh, start)
  if (!end || !origin) return []
  const key = (p: Point) => `${p.x},${p.y}`
  const open = new Map<string, Point>([[key(origin), origin]])
  const costs = new Map<string, number>([[key(origin), 0]])
  const parent = new Map<string, Point>()
  const closed = new Set<string>()
  while (open.size) {
    let current = origin, best = Infinity
    for (const p of open.values()) {
      const score = costs.get(key(p))! + Math.abs(end.x - p.x) + Math.abs(end.y - p.y) * mesh.aspect
      if (score < best) { current = p; best = score }
    }
    const id = key(current)
    open.delete(id)
    if (id === key(end)) {
      const path = [current]
      while (parent.has(key(path[0]))) path.unshift(parent.get(key(path[0]))!)
      path.unshift(start)
      if(walkable(target,mesh)&&clearSegment(path.at(-1)!,target,mesh))path.push(target)
      const smooth = [path[0]]
      for (let i = 0; i < path.length - 1;) {
        let next = path.length - 1
        while (next > i + 1 && !clearSegment(path[i], path[next], mesh)) next--
        smooth.push(path[next]); i = next
      }
      return smooth
    }
    closed.add(id)
    for (const delta of [{ x: 2, y: 0 }, { x: -2, y: 0 }, { x: 0, y: 2 }, { x: 0, y: -2 }]) {
      const p = { x: current.x + delta.x, y: current.y + delta.y }, pid = key(p)
      if (closed.has(pid) || !walkable(p, mesh) || !clearSegment(current, p, mesh)) continue
      const cost = costs.get(id)! + distance(current, p, mesh.aspect)
      if (cost < (costs.get(pid) ?? Infinity)) { parent.set(pid, current); costs.set(pid, cost); open.set(pid, p) }
    }
  }
  return []
}
/** Frame-independent step, including multiple short segments in a single frame. */
export function advanceRoute(position: Point, route: readonly Point[], index: number, seconds: number, speed: number, aspect: number) {
  let p = { ...position }, remaining = Math.max(0, seconds) * speed, facing = 0
  while (index < route.length) {
    const goal = route[index], length = distance(p, goal, aspect)
    if (Math.abs(goal.x - p.x) > .01) facing = goal.x > p.x ? 1 : -1
    if (length > remaining) { const t = remaining / length; p = { x: p.x + (goal.x - p.x) * t, y: p.y + (goal.y - p.y) * t }; break }
    p = { ...goal }; remaining -= length; index++
  }
  const arrived = index >= route.length
  const velocity = seconds > 0 && !arrived ? { x: (p.x - position.x) / seconds, y: (p.y - position.y) / seconds } : { x: 0, y: 0 }
  return { position: p, index, facing, velocity, arrived }
}
