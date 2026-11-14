import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const manifest = JSON.parse(readFileSync(new URL('../../../../public/assets/story/manifest.json', import.meta.url), 'utf8'))
test('all sixteen supplied PNGs exist with valid dimensions and unique names', () => {
  assert.equal(manifest.length, 16)
  assert.equal(new Set(manifest.map(item => item.name)).size, 16)
  for (const item of manifest) {
    const bytes = readFileSync(new URL(`../../../../public/assets/story/${item.file}`, import.meta.url))
    assert.equal(bytes.toString('hex', 0, 8), '89504e470d0a1a0a')
    assert.equal(bytes.readUInt32BE(16), item.width)
    assert.equal(bytes.readUInt32BE(20), item.height)
    assert.ok(item.width > 0 && item.height > 0)
  }
})
test('every scene artwork key points to a supplied file, excluding baked UI references', () => {
  const source = readFileSync(new URL('../data/sceneArtwork.ts', import.meta.url), 'utf8')
  const keys = [...source.matchAll(/id: '([^']+)'/g)].map(match => match[1])
  assert.equal(keys.length, 12)
  for (const key of keys) {
    assert.ok(existsSync(new URL(`../../../../public/assets/story/${key}.png`, import.meta.url)))
    assert.ok(!key.startsWith('reference-'))
  }
})
