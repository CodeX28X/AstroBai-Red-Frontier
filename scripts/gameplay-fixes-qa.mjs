import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { decodeSave } from '../src/shared/store/saveGame.ts'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright')
const output=process.env.QA_OUTPUT??'docs/qa/gameplay-fixes'
await mkdir(output,{recursive:true})
const server=await createServer({server:{host:'127.0.0.1',port:4188,strictPort:true}});await server.listen()
const browser=await chromium.launch({channel:process.env.QA_BROWSER??'chrome',headless:true,env:{...process.env,SSLKEYLOGFILE:''}})
const context=await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'})
const page=await context.newPage(),results=[],errors=[]
page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
const b=name=>page.getByRole('button',{name,exact:true}),close=()=>page.keyboard.press('Escape')
const state=async()=>decodeSave(await page.evaluate(()=>localStorage.getItem('astrobai.adventure.save.v1'))).state
const shot=name=>page.screenshot({path:`${output}/${name}.png`})
async function hud(){const s=await state();for(const [id,name]of Object.entries({power:'Energy',oxygen:'Oxygen',water:'Water',food:'Food'})){const bar=page.getByRole('progressbar',{name:`${name} reserve`,exact:true});assert.equal(await bar.getAttribute('value'),String(s.resources[id]));assert.equal(await bar.evaluate(n=>n.position),s.resources[id]/10);assert.ok((await bar.locator('..').innerText()).includes(`${s.resources[id]}/10`))}}
async function rest(){const before=await state();await b('End sol →').click();await page.getByRole('dialog').getByRole('button',{name:'Rest until next sol',exact:true}).click();const after=await state();for(const key of Object.keys(before.resources))assert.equal(after.resources[key],before.resources[key]-1);assert.equal(after.outcome,null);await hud()}
async function operate(label,resource='Oxygen'){
  await page.getByRole('progressbar',{name:`${resource} reserve`,exact:true}).locator('..').click()
  const before=await state();await page.getByRole('dialog').getByRole('button',{name:label,exact:true}).click()
  const after=await state();assert.equal(after.actionsRemaining,before.actionsRemaining-1);assert.ok(await page.getByRole('dialog').locator('.production-succeeded').isVisible());await close();await hud()
}
async function command(label,type){
  for(const hint of ['Check energy','Check crew supplies'])if(await b(hint).isVisible()){await b(hint).click();await close()}
  const count=await page.evaluate(()=>JSON.parse(localStorage.getItem('astrobai.adventure.save.v1')).actions.filter(a=>a.type==='ICEBOUND_COMMAND').length)
  await b(label).click()
  await page.waitForFunction(({count,type})=>{const actions=JSON.parse(localStorage.getItem('astrobai.adventure.save.v1')).actions.filter(a=>a.type==='ICEBOUND_COMMAND');return actions.length>count&&actions.at(-1)?.intent?.type===type},{count,type})
  await hud()
}
async function plan(site){
  await b('Research sites').click();await b(`Explore ${site}`).click()
  await page.getByRole('button',{name:/^▣ Scout/}).click();await b('Next: sampling').click();await b('Drill below the surface').click();await b('Next: tools').click()
  assert.ok(await page.getByRole('list',{name:'Included standard equipment'}).isVisible());assert.equal(await page.locator('.tool-check').count(),5)
  const field=page.getByRole('checkbox',{name:/Soil Analysis Kit/});await field.uncheck();assert.ok(!(await state()).iceboundPlanning.draft.equipmentIds.includes('soil-analysis-kit'));await field.check()
  const oxygen=page.getByRole('checkbox',{name:/Portable Oxygen Kit/});await oxygen.uncheck()
  const expected=(await state()).iceboundPlanning.draft.equipmentIds
  await shot(`equipment-${site.replaceAll(' ','-')}`)
  await b('Next: review').click();await b('Check with Mission Control').click();await b('Confirm expedition plan').click();assert.deepEqual((await state()).icebound.approvedPlan.equipmentIds,expected);await close()
}
async function analyze(){await command('Analyze sample','ANALYZE_SAMPLE');await command('Record science report','GENERATE_REPORT')}
async function fits(width,height){
  await page.setViewportSize({width,height});await hud()
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight))
  const targets=await page.locator('.mars-facility').evaluateAll(nodes=>nodes.filter(node=>{const r=node.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !hit||!node.contains(hit)}).map(node=>node.getAttribute('aria-label')))
  assert.deepEqual(targets,[],`${width}: facility centers obscured`)
  const header=await page.locator('.adventure-hud').boundingBox(),objective=await page.locator('.adventure-objective').boundingBox();assert.ok(header.y+header.height<=objective.y,`${width}: header/objective overlap`)
  const footprint=()=>page.evaluate(()=>['.adventure-hud','.hud-objective-stack','.adventure-dialogue','.adventure-toolbar'].reduce((area,selector)=>{const box=document.querySelector(selector).getBoundingClientRect();return area+box.width*box.height},0))
  const expanded=await footprint();await shot(`expanded-${width}`);await b('Minimize HUD').click();assert.equal(await b('Expand HUD').getAttribute('aria-expanded'),'false');assert.ok(!(await page.locator('.adventure-objective').isVisible()));assert.ok(await page.getByRole('button',{name:/Current objective:/}).isVisible());assert.ok(await footprint()<expanded*.7,`${width}: minimized HUD footprint`);await hud();await shot(`minimized-${width}`)
  await page.getByRole('progressbar',{name:'Energy reserve'}).locator('..').click();await close();assert.ok(await b('Expand HUD').isVisible());await b('Expand HUD').click();assert.ok(await page.locator('.adventure-objective').isVisible());results.push(`${width}×${height}: compact/minimized HUD, values/bars, restore and accessible targets`)
}
try{
  await page.goto('http://127.0.0.1:4188/');await b('New Mission').click();await page.getByRole('checkbox',{name:/ICEBOUND science kit/}).check();await b('Check with Mission Control').click();await b('Confirm cargo').click();await b('Go to launch →').click();await b('Launch our rocket →').click();await b('Approach Mars →').click();await page.getByRole('button',{name:/Choose a Safe Landing Spot/}).click()
  await hud();for(const [w,h]of [[1366,768],[1920,1080],[1024,768],[390,844]])await fits(w,h)
  await page.setViewportSize({width:1366,height:768})
  await page.getByRole('button',{name:'Inspect Solar Array, operational',exact:true}).click();await b('Collect energy +5').click();assert.ok(await page.locator('.world-context .production-succeeded').isVisible());assert.ok(await b('Collect energy +5').isDisabled());await shot('facility-success');await b('Close building actions').click()
  await operate('Recycle water +4');await rest()
  await operate('Collect energy +5','Energy');await operate('Harvest food +4','Food');await rest()
  await command('Send Scout','RECON');await plan('Lumen Shelf');await command('Start expedition','EXECUTE_EXPEDITION');await rest();await command('Collect sample','COLLECT_SAMPLE');await analyze()
  assert.equal((await state()).icebound.report.conclusion,'supports-accessible-ice');const first=structuredClone((await state()).icebound.investigations[0]);await b('Read our findings').click();await shot('first-report');await close();await rest()
  await operate('Collect energy +5','Energy');await operate('Replenish oxygen +4');await rest()
  await plan('Cinder Flats');await command('Start expedition','EXECUTE_EXPEDITION');await command('Collect sample','COLLECT_SAMPLE');await rest()
  await operate('Collect energy +5','Energy');await analyze();assert.equal((await state()).icebound.report.conclusion,'no-accessible-ice-detected');assert.deepEqual((await state()).icebound.investigations[0],first);await b('Read our findings').click();await shot('second-report');await close();await rest()
  await operate('Recycle water +4');await operate('Harvest food +4','Food');await rest()
  await operate('Collect energy +5','Energy');await operate('Replenish oxygen +4');await rest()
  await b('Research sites').click();assert.ok(await b('Explore Lumen Shelf').isDisabled());assert.ok(await b('Explore Cinder Flats').isDisabled());assert.ok(await b('Explore Echo Ridge').isEnabled());await shot('site-progress');await close()
  const snapshot=await state();await page.reload();await b('Continue Mission').click();assert.deepEqual(await state(),snapshot)
  await b('Finish Sol 10 →').click();await b('Finish the outpost mission').click();await b('Mission debrief →').click();assert.equal((await state()).outcome,'success');assert.equal((await state()).icebound.samples.length,2);await shot('debrief')
  assert.ok(await page.getByRole('heading',{name:'Mission Complete!',exact:true}).isVisible());assert.ok(await page.locator('.ending-bai img[src="/assets/characters/bai/portrait.png"]').isVisible())
  for(const [width,height]of [[1366,768],[1920,1080],[1024,768],[390,844]]){await page.setViewportSize({width,height});for(const name of ['Play Again','View Mission Report','Main Menu']){const box=await b(name).boundingBox();assert.ok(box.y>=0&&box.y+box.height<=height&&box.x>=0&&box.x+box.width<=width)}assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight));if(width===1366)assert.ok(await page.locator('.ending-body').evaluate(node=>node.scrollHeight<=node.clientHeight));await shot(`ending-${width}`)}
  await page.setViewportSize({width:1366,height:768});await b('View Mission Report').click();assert.ok(await page.getByRole('dialog',{name:'Mission report',exact:true}).isVisible());assert.match(await page.getByRole('dialog').innerText(),/No Ice Found Here/);await shot('optional-mission-report');await close()
  results.push('Actual facility click, all four production jobs, once-per-sol lock, one-job cost and immediate HUD updates')
  results.push('Default supplies: two sites, selected optional tool persistence, distinct deterministic findings, retained first report, completed-site locks, daily use, reload and ten-sol success')
  await b('Play Again').click();await b('Start new adventure').click();await b('Check with Mission Control').click();await b('Confirm cargo').click();await b('Go to launch →').click();await b('Launch our rocket →').click();await b('Approach Mars →').click();await page.getByRole('button',{name:/Choose a Safe Landing Spot/}).click()
  for(let n=0;n<4;n++){await b('End sol →').click();await page.getByRole('dialog').getByRole('button',{name:'Rest until next sol',exact:true}).click()}
  assert.equal((await state()).outcome,'failure');assert.equal((await state()).resources.power,0);await hud();await b('Mission debrief').click();assert.ok(await page.getByRole('heading',{name:"Let's Try Again!"}).isVisible());await shot('supply-failure')
  results.push('Restart, ignored upkeep, natural resource depletion and failure debrief verified')
  results.push('Summary-first success/failure endings, actual resources/science, BAI artwork, optional full report and visible replay/menu controls at all four viewports')
  assert.deepEqual(errors,[]);await writeFile(`${output}/browser-results.json`,JSON.stringify({results,errors},null,2)+'\n');console.log(JSON.stringify({results,errors},null,2))
}catch(error){await shot('failure');console.error((await page.locator('body').innerText()).slice(-4500));throw error}
finally{await browser.close();await server.close()}
