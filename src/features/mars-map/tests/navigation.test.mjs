import test from 'node:test'
import assert from 'node:assert/strict'
import { findRoute, clearSegment, advanceRoute, scenePoint, nearestPoint, walkable, SURFACE_MESH, ROOM_MESH, FACILITY_FOOTPRINTS, facilityApproachPoint, distance } from '../navigation/navigation.ts'
import { MOVEMENT_CONFIG } from '../navigation/movementConfig.ts'
test('routes to every building and research point avoid all collision footprints', () => {
  for (const target of [{x:38,y:56},{x:62,y:56},{x:38,y:86},{x:62,y:86},{x:15,y:19},{x:85,y:19},{x:19,y:87}]) {
    const route = findRoute({x:50,y:58}, target, SURFACE_MESH)
    assert.ok(route.length >= 2)
    for (let i=1;i<route.length;i++) assert.ok(clearSegment(route[i-1],route[i],SURFACE_MESH))
    assert.ok(walkable(route.at(-1),SURFACE_MESH))
  }
})
test('obstacles and out-of-bounds clicks resolve to safe nearby ground', () => {
  for (const point of [{x:38,y:32},{x:62,y:67},{x:-100,y:999}]) {
    assert.equal(walkable(point,SURFACE_MESH),false)
    assert.ok(walkable(nearestPoint(point,SURFACE_MESH),SURFACE_MESH))
    assert.ok(findRoute({x:50,y:58},point,SURFACE_MESH).length)
  }
})
test('sealed regions cannot be crossed', () => {
  const mesh={bounds:{left:6,top:16,right:94,bottom:94},aspect:1,obstacles:[{left:46,top:16,right:54,bottom:94}]}
  assert.deepEqual(findRoute({x:20,y:50},{x:80,y:50},mesh),[])
})
test('room approaches avoid benches, machinery and walls', () => {
  for (const target of [{x:23,y:56},{x:72,y:56},{x:54,y:72},{x:50,y:86}]) {
    const route=findRoute({x:50,y:82},target,ROOM_MESH)
    for(let i=1;i<route.length;i++) assert.ok(clearSegment(route[i-1],route[i],ROOM_MESH))
    assert.ok(route.length)
  }
})
test('movement uses elapsed time, crosses segments, arrives exactly and reverses facing', () => {
  const path=[{x:10,y:10},{x:20,y:10},{x:20,y:20},{x:10,y:20}]
  let a={position:path[0],index:1}
  for(let i=0;i<30;i++) a=advanceRoute(a.position,path,a.index,.1,10,1)
  const b=advanceRoute(path[0],path,1,3,10,1)
  assert.ok(Math.abs(a.position.x-b.position.x)<1e-8)
  assert.equal(b.arrived,true)
  assert.deepEqual(b.position,path.at(-1))
  assert.equal(b.facing,-1)
  assert.deepEqual(b.velocity,{x:0,y:0})
  assert.equal(advanceRoute(path[0],path,1,.1,10,1).velocity.x,10)
})
test('scaled, resized, offset and touch client coordinates map to the same scene', () => {
  for(const width of [320,700,1400]) {
    const rect={left:33,top:89,width,height:width*.7}
    const p=scenePoint({x:33+width*.5,y:89+rect.height*.5},rect)
    assert.ok(Math.abs(p.x-50)<1e-9 && Math.abs(p.y-50)<1e-9)
  }
})

test('central open road crosses directly; the solid flag platform needs only a short local detour',()=>{
  const road=findRoute({x:20,y:56},{x:80,y:56},SURFACE_MESH)
  assert.deepEqual(road,[{x:20,y:56},{x:80,y:56}])
  const aroundFlag=findRoute({x:50,y:58},{x:50,y:40},SURFACE_MESH)
  assert.ok(aroundFlag.length>=3)
  assert.ok(aroundFlag.every(point=>point.x>=40&&point.x<=60&&point.y>=40&&point.y<=58))
  const length=aroundFlag.slice(1).reduce((sum,point,index)=>sum+distance(aroundFlag[index],point,SURFACE_MESH.aspect),0)
  assert.ok(length<32,`Road detour was ${length}`)
  for(let i=1;i<aroundFlag.length;i++)assert.ok(clearSegment(aroundFlag[i-1],aroundFlag[i],SURFACE_MESH))
  assert.equal(walkable({x:50,y:50},SURFACE_MESH),false)
})
test('all facility walls remain solid and shared entrance approaches are reachable exactly',()=>{
  for(const [index,id]of ['habitat','solar-array','greenhouse','research-lab'].entries()){
    const box=FACILITY_FOOTPRINTS[index];assert.equal(walkable({x:(box.left+box.right)/2,y:(box.top+box.bottom)/2},SURFACE_MESH),false)
    const target=facilityApproachPoint(id),route=findRoute({x:50,y:58},target,SURFACE_MESH)
    assert.deepEqual(route.at(-1),target)
    for(let i=1;i<route.length;i++)assert.ok(clearSegment(route[i-1],route[i],SURFACE_MESH))
  }
  assert.deepEqual(findRoute({x:38,y:32},{x:50,y:58},SURFACE_MESH),[])
})
test('thin walls and obstacle corners cannot be skipped by path smoothing',()=>{
  const mesh={bounds:{left:0,top:0,right:100,bottom:100},aspect:1,obstacles:[{left:49.91,right:49.92,top:49,bottom:51}]}
  assert.equal(clearSegment({x:10,y:50},{x:90,y:50},mesh),false)
})
test('configured movement is 25% faster with matching gait cadence and stable elapsed-time travel',()=>{
  assert.equal(MOVEMENT_CONFIG.outdoorSpeed/14,1.25);assert.equal(MOVEMENT_CONFIG.indoorSpeed/20,1.25);assert.equal(MOVEMENT_CONFIG.roverSpeed/22,1.25)
  assert.equal(MOVEMENT_CONFIG.cadence.eva*MOVEMENT_CONFIG.travelMultiplier,.72)
  const route=[{x:20,y:56},{x:80,y:56}]
  for(const hz of [30,60,120]){let result={position:route[0],index:1};for(let frame=0;frame<hz;frame++)result=advanceRoute(result.position,route,result.index,1/hz,MOVEMENT_CONFIG.outdoorSpeed,.7);assert.ok(Math.abs(result.position.x-37.5)<1e-8)}
})
