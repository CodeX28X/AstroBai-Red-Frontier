import test from 'node:test';
import assert from 'node:assert/strict';
import { facilityApproach, planFacilityWalk, walkerHome } from '../data/facilityWalkRoutes.ts';

test('all four facilities have distinct front courtyards and axis-aligned paths', () => {
  const facilities = [{x:38,y:32},{x:62,y:32},{x:38,y:67},{x:62,y:67}];
  const destinations = facilities.map(point=>facilityApproach(point));
  assert.equal(new Set(destinations.map(p=>`${p.x},${p.y}`)).size,4);
  for(const destination of destinations) {
    const route=planFacilityWalk(walkerHome,destination);
    assert.deepEqual(route.at(-1),destination);
    for(let i=1;i<route.length;i++) {
      assert.ok(route[i].x===route[i-1].x || route[i].y===route[i-1].y);
      assert.ok(route[i].x>=0&&route[i].x<=100&&route[i].y>=0&&route[i].y<=100);
    }
  }
});

test('compact destinations stay at inner-side entrances, leaving building labels clear', () => {
  assert.deepEqual(facilityApproach({x:38,y:32},true),{x:47,y:32});
  assert.deepEqual(facilityApproach({x:62,y:32},true),{x:53,y:32});
  assert.deepEqual(facilityApproach({x:38,y:67},true),{x:47,y:67});
  assert.deepEqual(facilityApproach({x:62,y:67},true),{x:53,y:67});
});

test('switching destinations mid-walk preserves current position and uses the central connector', () => {
  const current={x:43,y:86};
  const route=planFacilityWalk(current,{x:62,y:50});
  assert.deepEqual(route[0],current);
  assert.deepEqual(route.slice(1),[{x:50,y:86},{x:50,y:50},{x:62,y:50}]);
});

test('returning home works and stationary routes have no zero-duration segments', () => {
  assert.deepEqual(planFacilityWalk(walkerHome,walkerHome),[walkerHome]);
  const route=planFacilityWalk({x:62,y:86},walkerHome);
  assert.deepEqual(route.at(-1),walkerHome);
  for(let i=1;i<route.length;i++) assert.notDeepEqual(route[i],route[i-1]);
});

test('returning from any facility stays put instead of walking via the hub again', () => {
  for(const compact of [false,true]) {
    for(const facility of [{x:38,y:32},{x:62,y:32},{x:38,y:67},{x:62,y:67}]) {
      const arrived=facilityApproach(facility,compact);
      assert.deepEqual(planFacilityWalk(arrived,arrived),[arrived]);
    }
  }
});
