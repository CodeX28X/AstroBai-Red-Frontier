import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { decodeSave } from '../src/shared/store/saveGame.ts'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright')
const output='docs/qa/hud-supplies'
await mkdir(output,{recursive:true})
const server=await createServer({server:{host:'127.0.0.1',port:4188,strictPort:true}})
await server.listen()
const browser=await chromium.launch({channel:process.env.QA_BROWSER ?? 'chrome',headless:true,env:{...process.env,SSLKEYLOGFILE:''}})
const results=[],errors=[]
let currentPage
function observe(p){p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});currentPage=p}
const state=async p=>decodeSave(await p.evaluate(()=>localStorage.getItem('astrobai.adventure.save.v1'))).state
const b=(p,name)=>p.getByRole('button',{name,exact:true})
const shot=(p,name)=>p.screenshot({path:`${output}/${name}.png`})
async function fits(p,label){const d=await p.evaluate(()=>({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight}));assert.ok(d.sw<=d.w&&d.sh<=d.h,`${label}: ${JSON.stringify(d)}`);results.push(`${label}: no page overflow`)}
async function mapFits(p,label){await fits(p,label);const r=await p.locator('.map-section').boundingBox(),v=p.viewportSize();assert.ok(Math.abs(r.width-v.width)<1&&Math.abs(r.height-v.height)<1&&r.x===0&&r.y===0);assert.equal(await p.locator('.adventure-hud').evaluate(n=>getComputedStyle(n).position),'absolute');const plane=await p.locator('.map-playfield').boundingBox();assert.ok(Math.abs(plane.width/plane.height-10/7)<.01);const blocked=await p.locator('.mars-facility,.science-site').evaluateAll(nodes=>nodes.filter(n=>{const q=n.getBoundingClientRect(),hit=document.elementFromPoint(q.x+q.width/2,q.y+q.height/2);return !hit||!n.contains(hit)}).map(n=>n.getAttribute('aria-label')));assert.deepEqual(blocked,[],`${label}: HUD must not cover target centers`);results.push(`${label}: full viewport map, overlay HUD, proportional artwork, unobstructed targets`)}
async function clearContext(p){if(await b(p,'Close building actions').isVisible())await b(p,'Close building actions').click()}
const close=p=>p.keyboard.press('Escape')
async function suppliesCheck(p){if(await b(p,'Check crew supplies').isVisible()){await b(p,'Check crew supplies').click();await close(p)}}
async function rest(p){await b(p,'End sol →').click();await b(p,'Rest until next sol').click()}
const recorded=(p,type)=>p.waitForFunction(t=>JSON.parse(localStorage.getItem('astrobai.adventure.save.v1')).actions.some(a=>a.type==='ICEBOUND_COMMAND'&&a.intent.type===t),type)
async function start(p,kit=true){
  await p.goto('http://127.0.0.1:4188/');await b(p,'New Mission').click();await b(p,'Use suggested supplies').click()
  await fits(p,`preparation ${p.viewportSize().width}×${p.viewportSize().height}`);await shot(p,`preparation-${p.viewportSize().width}`)
  if(kit)await p.getByRole('checkbox',{name:/ICEBOUND science kit/}).check()
  await b(p,'Check with Mission Control').click();await b(p,'Confirm cargo').click();await b(p,'Go to launch →').click();await b(p,'Launch our rocket →').click();await b(p,'Approach Mars →').click();await p.getByRole('button',{name:/Choose a Safe Landing Spot/}).click()
}
async function investigate(p,site,method,drill=false){
  while((await state(p)).sol<3)await rest(p)
  await b(p,'Send Scout').click();await recorded(p,'RECON');await b(p,'Compare research sites').click();await b(p,`Explore ${site}`).click()
  await p.getByRole('button',{name:method}).click();await b(p,'Next: sampling').click();await b(p,drill?'Drill below the surface':'Surface material').click();await b(p,'Next: tools').click();await b(p,'Next: review').click();await b(p,'Check with Mission Control').click();await b(p,'Confirm expedition plan').click();await close(p)
  await b(p,'Start expedition').click();await recorded(p,'EXECUTE_EXPEDITION');await b(p,'Rest until next sol').click();await suppliesCheck(p)
  await b(p,'Collect sample').click();await recorded(p,'COLLECT_SAMPLE');await b(p,'Analyze sample').click();await recorded(p,'ANALYZE_SAMPLE');await p.locator('.facility-interior').waitFor({state:'visible'})
  await b(p,'Record science report').click();await recorded(p,'GENERATE_REPORT');await b(p,'Read our findings').click()
}
try{
  const context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage();observe(page)
  await page.goto('http://127.0.0.1:4188/');await b(page,'New Mission').click();await fits(page,'preparation 1366×768');assert.equal(await page.locator('[data-supply]').count(),4)
  for(const name of ['Energy Pack','Oxygen Tank','Water Container','Food Pack'])assert.equal(await page.getByLabel(`${name} quantity`,{exact:true}).innerText(),'0')
  for(let n=0;n<10;n++)await b(page,'Pack Energy Pack').click();assert.equal(await page.getByLabel('Energy Pack quantity',{exact:true}).innerText(),'10');assert.ok(await b(page,'Pack Energy Pack').isDisabled())
  for(let n=0;n<10;n++)await b(page,'Remove Energy Pack').click();assert.ok(await b(page,'Remove Energy Pack').isDisabled())
  await b(page,'Check with Mission Control').click();assert.equal(await page.locator('.supply-needs-help').getAttribute('data-supply'),'power');await b(page,'Add Energy Pack').click();assert.equal(await page.locator('.supply-needs-help').getAttribute('data-supply'),'oxygen')
  await b(page,'Use suggested supplies').click();await page.getByRole('checkbox',{name:/ICEBOUND science kit/}).check();for(const name of ['Energy Pack','Oxygen Tank','Water Container','Food Pack'])assert.ok(await b(page,`Pack ${name}`).isDisabled())
  await b(page,'Check with Mission Control').click();await shot(page,'preparation-1366');await b(page,'Confirm cargo').click();assert.deepEqual((await state(page)).resources,{power:48,oxygen:36,water:36,food:36});assert.ok(await page.getByRole('checkbox',{name:/ICEBOUND science kit/}).isDisabled())
  results.push('Zero counters, ±1, max 10, immediate capacity, targeted review, locked conversion')
  await b(page,'Go to launch →').click();await b(page,'Launch our rocket →').click();await b(page,'Approach Mars →').click();await page.getByRole('button',{name:/Choose a Safe Landing Spot/}).click()
  await mapFits(page,'outpost 1366×768');await shot(page,'outpost-1366')
  const speech=page.locator('.character-dialogue');assert.match(await speech.locator('img').getAttribute('src'),/bai.svg/);await speech.click();assert.match(await speech.locator('img').getAttribute('src'),/kiki.svg/);await speech.click();assert.equal((await state(page)).guidance.completedDialogueIds.length,0)
  await page.waitForTimeout(360);await speech.focus();await page.keyboard.press('Space');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('astrobai.adventure.save.v1')).actions.some(a=>a.type==='ACKNOWLEDGE_DIALOGUE'));assert.equal(await page.evaluate(()=>document.activeElement.textContent.includes('Explore the habitat')),true)
  results.push('Portrait sequence, double-click debounce, Space completion and action focus verified')
  await b(page,'Explore the habitat').click();await b(page,'Enter Habitat').waitFor({timeout:15000});await shot(page,'habitat-context');await clearContext(page)
  await b(page,'Inspect solar array').click();await b(page,'Enter Solar Array').waitFor({timeout:15000});await clearContext(page);await b(page,'Check energy').click();await close(page);await b(page,'Next sol').click()
  await b(page,'Inspect solar array').click();await b(page,'Enter Solar Array').waitFor({timeout:15000});await clearContext(page);await b(page,'Check energy').click();await close(page);await b(page,'Next sol').click()
  await b(page,'Settings').click();await page.getByLabel('Less animation').check();await close(page)
  await investigate(page,'Lumen Shelf',/^▣ Scout/,true);assert.ok(await page.getByRole('heading',{name:'Ice Evidence Found',level:3,exact:true}).isVisible());await shot(page,'positive-result');await close(page)
  const snapshot=await state(page);await page.reload();await b(page,'Continue Mission').click();assert.deepEqual(await state(page),snapshot);results.push('Guided early sols, stepped plan, positive ICEBOUND, save/dialogue persistence')
  for(const [w,h,label] of [[1920,1080,'desktop-1920'],[1024,768,'tablet'],[390,844,'mobile']]){await page.setViewportSize({width:w,height:h});await mapFits(page,label);await shot(page,`outpost-${label}`)}
  await page.setViewportSize({width:1366,height:768});await b(page,'Crew').click();assert.equal(await page.locator('dialog .crew-grid img').count(),7);await close(page)
  while((await state(page)).sol<10)await rest(page)
  await b(page,'Finish Sol 10 →').click();await b(page,'Finish the outpost mission').click();await b(page,'Mission debrief →').click();assert.ok(await page.getByRole('heading',{name:'A small crew. A big adventure.'}).isVisible());await shot(page,'debrief');results.push('Ten-sol ending with real science and non-negative resources')
  for(const [site,method,expected,touch] of [['Cinder Flats',/^★ \+ ▣ Together/,'No Ice Found Here',true],['Echo Ridge',/^★ Crew/,'Not Sure Yet',false]]){
    const c=await browser.newContext({viewport:touch?{width:390,height:844}:{width:1024,height:768},hasTouch:touch,reducedMotion:'reduce'}),p=await c.newPage();observe(p);await start(p);await investigate(p,site,method);assert.ok(await p.getByRole('heading',{name:expected,level:3,exact:true}).isVisible());await shot(p,touch?'negative-mobile':'inconclusive-tablet');await close(p)
    if(touch){const plane=p.locator('.map-playfield'),r=await plane.boundingBox();await plane.tap({position:{x:r.width*.76,y:r.height*.5}});await p.waitForFunction(()=>['idle','waiting'].includes(document.querySelector('.map-playfield .nav-actor')?.dataset.motion))}
    results.push(`${site}: ${expected}, assigned actors, reduced motion${touch?', touch input':''}`);await c.close()
  }
  const c=await browser.newContext({viewport:{width:1024,height:768},reducedMotion:'reduce'}),p=await c.newPage();observe(p);await start(p,false);while((await state(p)).sol<3)await rest(p);assert.ok(await b(p,'Send Scout').isDisabled());assert.ok((await p.locator('.blocked-guidance').innerText()).includes('Missing cargo needs a new mission'));while((await state(p)).sol<10)await rest(p);await b(p,'Finish Sol 10 →').click();await b(p,'Finish the outpost mission').click();await b(p,'Mission debrief →').click();assert.ok(await p.getByRole('heading',{name:'Investigation still in progress'}).isVisible());results.push('No science kit: actionable blocker and valid outpost ending');await c.close()
  assert.deepEqual(errors,[]);await writeFile(`${output}/browser-results.json`,JSON.stringify({results,errors},null,2)+'\n');console.log(JSON.stringify({results,errors},null,2))
}catch(error){if(currentPage&&!currentPage.isClosed()){await shot(currentPage,'failure');console.error((await currentPage.locator('body').innerText()).slice(-6000))}throw error}finally{await browser.close();await server.close()}
