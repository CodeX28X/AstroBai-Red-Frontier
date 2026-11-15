import test from 'node:test'
import assert from 'node:assert/strict'
import { createDialogueSpeech } from '../data/speech.ts'
test('speech cancels previous playback, speaks only supplied captions, respects rate, and ignores stale voice events', () => {
  const lines=[],statuses=[];let cancels=0
  const speech=createDialogueSpeech({cancel(){cancels++},speak(line){lines.push(line)},getVoices(){return[{lang:'en-US',name:'A'},{lang:'en-GB',name:'B'}]}},text=>({text}))
  speech.play('bai','BAI is ready.','bai',.9,message=>statuses.push(message));assert.equal(lines[0].text,'Bay is ready.');assert.equal(lines[0].rate,.9)
  speech.play('kofi','Our sample is uncertain.','kofi',.75,message=>statuses.push(message));assert.equal(cancels,2);assert.equal(lines[1].voice.name,'B')
  const before=statuses.length;lines[0].onstart();assert.equal(statuses.length,before);lines[1].onstart();assert.equal(statuses.at(-1),'Speaking')
  speech.cancel('bai');assert.equal(cancels,2);speech.cancel('kofi');assert.equal(cancels,3)
  lines[1].onerror();assert.equal(statuses.at(-1),'Speaking')
})
test('failed voice playback is reported honestly and never throws into gameplay',()=>{
  const statuses=[],speech=createDialogueSpeech({cancel(){},getVoices(){return[]},speak(){throw Error('Device unavailable')}},text=>({text}))
  assert.doesNotThrow(()=>speech.play('line','Keep reading.','bai',.9,message=>statuses.push(message)));assert.match(statuses.at(-1),/could not play/)
})
