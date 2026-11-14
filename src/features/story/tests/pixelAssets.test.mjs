import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { RESOURCE_ASSETS, EQUIPMENT_ART } from '../../../shared/assets/gameAssets.ts'
import { CHARACTERS } from '../data/characters.ts'
import { EQUIPMENT_CATALOG } from '../../missions/data/equipmentCatalog.ts'

test('all nine supplied pixel assets are PNGs with alpha and valid dimensions; matching fallbacks exist',()=>{
  const assets=[...Object.values(RESOURCE_ASSETS).map(asset=>({src:asset.src,fallback:asset.fallback})),...Object.values(CHARACTERS).filter(character=>character.portrait.endsWith('.png')).map(character=>({src:character.portrait,fallback:character.fallbackPortrait}))]
  assert.equal(assets.length,9)
  for(const asset of assets){const bytes=readFileSync(`public${asset.src}`);assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.ok(bytes.readUInt32BE(16)>0&&bytes.readUInt32BE(20)>0);assert.equal(bytes[25],6,asset.src);assert.ok(existsSync(`public${asset.fallback}`))}
})
test('resource paths match existing resource identities; equipment mappings use actual catalog IDs and files',()=>{
  assert.deepEqual(Object.keys(RESOURCE_ASSETS),['power','oxygen','water','food'])
  for(const [id,path]of Object.entries(EQUIPMENT_ART)){assert.ok(EQUIPMENT_CATALOG.some(item=>item.id===id));assert.ok(existsSync(`public${path}`))}
  assert.equal(CHARACTERS.scout.portrait,'/assets/portraits/scout.svg');assert.equal(CHARACTERS.earth.portrait,'/assets/portraits/earth.svg')
})
