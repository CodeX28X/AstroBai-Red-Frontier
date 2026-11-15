import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { decodeSave } from '../src/shared/store/saveGame.ts'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright')
const output='docs/qa/resource-balancing'
await mkdir(output,{recursive:true})
const server=await createServer({server:{host:'127.0.0.1',port:4188,strictPort:true}})
await server.listen()
const browser=await chromium.launch({channel:process.env.QA_BROWSER ?? 'chrome',headless:true,env:{...process.env,SSLKEYLOGFILE:''}})
const results=[],errors=[]
const context=await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'})
const page=await context.newPage()
page.on('pageerror',error=>errors.push(error.message))
page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
const button=name=>page.getByRole('button',{name,exact:true})
const state=async()=>decodeSave(await page.evaluate(()=>localStorage.getItem('astrobai.adventure.save.v1'))).state
const close=()=>page.keyboard.press('Escape')
const shot=name=>page.screenshot({path:`${output}/${name}.png`})
async function hud(){
  const current=await state()
  for(const [id,name] of Object.entries({power:'Energy',oxygen:'Oxygen',water:'Water',food:'Food'})){
    const bar=page.getByRole('progressbar',{name:`${name} reserve`,exact:true})
    assert.equal(await bar.getAttribute('value'),String(current.resources[id]))
    assert.equal(await bar.getAttribute('max'),'10')
    assert.equal(await bar.evaluate(node=>node.position),current.resources[id]/10)
    assert.ok((await bar.locator('..').innerText()).includes(`${current.resources[id]}/10`))
  }
}
async function fits(label){
  const overflow=await page.evaluate(()=>({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight}))
  assert.ok(overflow.sw<=overflow.w&&overflow.sh<=overflow.h,`${label}: ${JSON.stringify(overflow)}`)
  const bars=await page.locator('.resource-indicator').all()
  for(const bar of bars){const rect=await bar.boundingBox();assert.ok(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=overflow.w&&rect.y+rect.height<=overflow.h)}
  const map=await page.locator('.map-section').boundingBox()
  assert.ok(Math.abs(map.width-overflow.w)<1&&Math.abs(map.height-overflow.h)<1)
  const hudBox=await page.locator('.adventure-hud').boundingBox(),objective=await page.locator('.adventure-objective').boundingBox()
  assert.ok(hudBox.y+hudBox.height<=objective.y,`${label}: HUD overlaps objective`)
  assert.equal(await page.locator('.adventure-hud').evaluate(node=>getComputedStyle(node).position),'absolute')
  results.push(`${label}: four readable resource bars, viewport overlays, no page overflow`)
}
async function rest(){await button('End sol →').click();await button('Rest until next sol').click()}
async function command(label,type){
  if(await button('Check energy').isVisible()){await button('Check energy').click();await close()}
  await button(label).click()
  await page.waitForFunction(t=>JSON.parse(localStorage.getItem('astrobai.adventure.save.v1')).actions.some(a=>a.type==='ICEBOUND_COMMAND'&&a.intent.type===t),type)
  await hud()
}
try{
  await page.goto('http://127.0.0.1:4188/')
  await button('New Mission').click()
  for(const name of ['Energy Pack','Oxygen Tank','Water Container','Food Pack'])assert.equal(await page.getByLabel(`${name} quantity`,{exact:true}).innerText(),'5/10')
  assert.match(await page.locator('.cargo-meter').innerText(),/20 \/ 35/)
  assert.deepEqual((await state()).resources,{power:0,oxygen:0,water:0,food:0})
  for(const name of ['Energy Pack','Oxygen Tank','Water Container'])for(let n=0;n<5;n++)await button(`Pack ${name}`).click()
  assert.match(await page.locator('.cargo-meter').innerText(),/35 \/ 35/)
  assert.ok(await button('Pack Food Pack').isDisabled())
  for(let n=0;n<10;n++)await button('Remove Energy Pack').click()
  assert.equal(await page.getByLabel('Energy Pack quantity',{exact:true}).innerText(),'0/10')
  assert.ok(await button('Remove Energy Pack').isDisabled())
  await button('Use suggested supplies').click()
  await button('Check with Mission Control').click();await shot('preparation-1366')
  await button('Confirm cargo').click()
  assert.deepEqual((await state()).resources,{power:5,oxygen:5,water:5,food:5})
  assert.deepEqual((await state()).preparation.manifest.optionalCargo,[])
  results.push('Preparation: 5/10 defaults, 20/35 cargo, ±1 controls, 0–10 bounds, capacity enforcement, exact confirmation')
  await button('Go to launch →').click();await button('Launch our rocket →').click();await button('Approach Mars →').click()
  const safe=page.getByRole('button',{name:/Choose a Safe Landing Spot/}),research=page.getByRole('button',{name:/Choose a Science Spot/})
  assert.match(await safe.innerText(),/-1 power · \+1 oxygen/)
  assert.match(await research.innerText(),/-2 power · \+2 water/)
  await safe.click();await hud()
  assert.deepEqual((await state()).resources,{power:4,oxygen:6,water:5,food:5})
  results.push('Landing: visible configured costs/benefits match committed resource values')
  for(const [width,height] of [[1366,768],[1920,1080],[1024,768],[390,844]]){
    await page.setViewportSize({width,height});await fits(`${width}×${height}`);await shot(`hud-${width}`)
  }
  await page.setViewportSize({width:1366,height:768})
  while((await state()).sol<3)await rest()
  await command('Send Scout','RECON')
  await button('Compare research sites').click();await button('Explore Lumen Shelf').click()
  await page.getByRole('button',{name:/^▣ Scout/}).click();await button('Next: sampling').click()
  await button('Drill below the surface').click();await button('Next: tools').click()
  assert.equal(await page.locator('.tool-check').count(),0)
  await button('Next: review').click();await button('Check with Mission Control').click();await button('Confirm expedition plan').click();await close()
  await command('Start expedition','EXECUTE_EXPEDITION');await button('Rest until next sol').click()
  await button('Check crew supplies').click();await close()
  await command('Collect sample','COLLECT_SAMPLE')
  await command('Analyze sample','ANALYZE_SAMPLE')
  await page.getByRole('progressbar',{name:'Energy reserve'}).locator('..').click();await close()
  await command('Record science report','GENERATE_REPORT')
  await button('Read our findings').click();assert.ok(await page.getByRole('heading',{name:'Not Sure Yet',level:3,exact:true}).isVisible());await shot('no-optional-tools-report');await close()
  const snapshot=await state();await page.reload();await button('Continue Mission').click();assert.deepEqual(await state(),snapshot);await hud()
  while((await state()).sol<10)await rest()
  await button('Finish Sol 10 →').click();await button('Finish the outpost mission').click();await button('Mission debrief →').click()
  assert.equal((await state()).outcome,'success');assert.equal((await state()).icebound.report.completionStatus,'complete')
  results.push('No optional cargo: reconnaissance, selection, review/confirmation, expedition, drilling, analysis/report, save/reload, ten-sol debrief')
  assert.deepEqual(errors,[])
  await writeFile(`${output}/browser-results.json`,JSON.stringify({results,errors},null,2)+'\n')
  console.log(JSON.stringify({results,errors},null,2))
}catch(error){await shot('failure');console.error((await page.locator('body').innerText()).slice(-3500));throw error}
finally{await browser.close();await server.close()}
