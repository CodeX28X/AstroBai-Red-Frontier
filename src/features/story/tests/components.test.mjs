import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Bundle the real components with the team's installed Vite compiler.
// React stays external; no extra compiler or DOM dependency is installed.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = resolve(root, '../../..');
const cache = join(projectRoot, 'node_modules', '.cache');
mkdirSync(cache, { recursive: true });
const scratch = mkdtempSync(join(cache, 'astrobai-component-tests-'));
after(() => {
  assert.ok(resolve(scratch).startsWith(resolve(cache) + sep));
  rmSync(scratch, { recursive: true, force: true });
});
const entries = [
  ['CharacterDialogue', 'components/CharacterDialogue.tsx'],
  ['AdventurePreparation', 'components/AdventurePreparation.tsx'],
  ['CHARACTERS', 'data/characters.ts'],
  ['createInitialGameState', '../../shared/store/gameReducer.ts'],
  ['gameReducer', '../../shared/store/gameReducer.ts'],
  ['ResourceHud', 'components/ResourceHud.tsx'],
  ['MissionEnding', 'components/MissionEnding.tsx'],
  ['HudObjective', 'components/HudObjective.tsx'],
  ['PixelImage', '../../shared/components/PixelImage.tsx'],
  ['ExpeditionEquipment', 'components/ExpeditionEquipment.tsx'],
  ['FacilityProduction', 'components/FacilityProduction.tsx'],
  ['selectIceboundContext', '../../shared/store/iceboundSelectors.ts'],
  ['CAMPAIGN_OPTIONS', '../../shared/store/campaign.ts'],
  ['MainMenu', 'components/MainMenu.tsx'],
  ['SceneFrame', 'components/SceneFrame.tsx'],
  ['OutpostSlot', 'components/OutpostSlot.tsx'],
  ['DeveloperAExperience', 'components/DeveloperAExperience.tsx'],
  ['FacilityInspection', 'components/FacilityInspection.tsx'],
  ['PowerPlanPanel', 'components/PowerPlanPanel.tsx'],
  ['experienceFixture', 'preview/experienceFixtures.ts'],
  ['previewPresets', 'preview/experienceFixtures.ts'],
  ['presetValidation', 'preview/experienceFixtures.ts'],
  ['feedbackCopy', 'data/feedbackCopy.ts'],
  ['formatCopy', 'data/formatCopy.ts'],
];
writeFileSync(join(scratch, 'entry.ts'), entries.map(([name, file]) =>
  'export { ' + name + ' } from ' + JSON.stringify(join(root, file).replaceAll('\\', '/')) + ';'
).join('\n'));
await build({
  configFile: false, root: projectRoot, logLevel: 'silent',
  build: {
    outDir: scratch, emptyOutDir: false, minify: false,
    lib: { entry: join(scratch, 'entry.ts'), formats: ['cjs'], fileName: () => 'components.cjs' },
    rolldownOptions: { external: ['react', 'react/jsx-runtime'] },
  },
});
const require = createRequire(import.meta.url);
const { MainMenu, SceneFrame, OutpostSlot, DeveloperAExperience, FacilityInspection, PowerPlanPanel, experienceFixture, previewPresets, presetValidation, feedbackCopy, formatCopy, CharacterDialogue, AdventurePreparation, CHARACTERS, createInitialGameState, gameReducer, ResourceHud, CAMPAIGN_OPTIONS, ExpeditionEquipment, FacilityProduction, selectIceboundContext, MissionEnding, HudObjective, PixelImage } = require(join(scratch, 'components.cjs'));
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));
test('spoken dialogue has the correct replaceable portrait, name and continue control', () => {
  for (const [speakerId, speaker] of Object.entries(CHARACTERS)) {
    const guide = { id: `portrait.${speakerId}`, speakerId, speakerName: speaker.name, text: 'Let us check together.', objectiveId: 'presentation', title: 'Hello', actionLabel: 'Explore' };
    const html = render(CharacterDialogue, { guide, completed: false, onComplete() {}, actionRef: { current: null } });
    assert.ok(html.includes(speaker.portrait));assert.ok(html.includes(`${speaker.name} portrait`));assert.match(html,/Tap to continue/);assert.match(html,/type="button"/);
  }
});

test('a completed multi-speaker dialogue keeps its last speaker and matching line', () => {
  const guide={id:'outpost.sol1.habitat',speakerId:'bai',speakerName:'BAI',text:'Original BAI line',objectiveId:'outpost.explore',title:'Welcome',actionLabel:'Explore'};
  const html=render(CharacterDialogue,{guide,completed:true,onComplete(){},actionRef:{current:null}});
  assert.match(html,/captain-kiki\/portrait.png/);assert.match(html,/Our crew is ready, Commander/);assert.doesNotMatch(html,/Original BAI line/);
});
test('new preparation renders exactly four supply cards at zero and an opt-in science kit', () => {
  const html = render(AdventurePreparation, { state: createInitialGameState(CAMPAIGN_OPTIONS), dispatch() {} });
  assert.equal((html.match(/data-supply=/g) ?? []).length,4);
  for (const name of ['Energy Pack','Oxygen Tank','Water Container','Food Pack']) assert.ok(html.includes(`${name} quantity`));
  assert.equal((html.match(/quantity">0\/10<\/output>/g) ?? []).length,4);
  assert.match(html,/ICEBOUND science kit/);assert.doesNotMatch(html,/checked=""/);
});

test('entering preparation displays four 5/10 counters and 20/35 cargo', () => {
  const state = gameReducer(createInitialGameState(CAMPAIGN_OPTIONS), { type: 'START_GAME' });
  const html = render(AdventurePreparation, { state, dispatch() {} });
  assert.equal((html.match(/quantity">5\/10<\/output>/g) ?? []).length, 4);
  assert.match(html, /20 \/ 35/);
});

test('HUD numbers and native progress bars follow each authoritative resource update', () => {
  const state = gameReducer(createInitialGameState(), { type: 'START_GAME' });
  for (const resources of [{power:7,oxygen:2,water:0,food:10}, {power:6,oxygen:3,water:1,food:9}]) {
    const html = render(ResourceHud, { resources, onInspect() {} });
    for (const [key, name] of Object.entries({power:'Energy',oxygen:'Oxygen',water:'Water',food:'Food'})) {
      assert.ok(html.includes(`<strong>${resources[key]}/10</strong>`));
      assert.ok(html.includes(`aria-label="${name} reserve" max="10" value="${resources[key]}"`));
    }
    assert.equal((html.match(/<progress/g) ?? []).length,4);
    for(const resource of ['energy','oxygen','water','food'])assert.ok(html.includes(`/assets/resources/${resource}.png`));
  }
  assert.deepEqual(state.resources, {power:0,oxygen:0,water:0,food:0});
});

test('ending shows authoritative outcome, completed sols, resources and honest science classification', () => {
  const base={...createInitialGameState(),phase:'debrief',completedSol:4,resources:{power:0,oxygen:2,water:1,food:1}};
  const failed=render(MissionEnding,{state:{...base,outcome:'failure'},onPlayAgain(){},onReport(){},onMenu(){}});
  assert.match(failed,/Mission Paused!/);assert.doesNotMatch(failed,/Mission Complete!/);assert.match(failed,/4 \/ 10/);assert.match(failed,/0\/10/);assert.match(failed,/\/assets\/characters\/bai\/portrait.png/);
  assert.match(failed,/View Mission Report/);assert.match(failed,/Play Again/);assert.doesNotMatch(failed,/Our science notebook/);
  for(const conclusion of ['no-accessible-ice-detected','inconclusive']){
    const state={...base,outcome:'success',completedSol:10,icebound:{...base.icebound,investigations:[{siteId:'icebound.lumen-shelf',report:{conclusion}}]}};
    const html=render(MissionEnding,{state,onPlayAgain(){},onReport(){},onMenu(){}});
    assert.match(html,/Mission Complete!/);assert.match(html,/1 site reported/);assert.match(html,conclusion==='inconclusive'?/Not Sure Yet/:/No Ice Found Here/);assert.doesNotMatch(html,/failed investigation/i);
  }
});

test('minimized HUD retains objective access and actual low-resource warnings', () => {
  const state={...createInitialGameState(),resources:{power:1,oxygen:5,water:2,food:4},actionsRemaining:1};
  const html=render(HudObjective,{state,objective:'Collect a careful sample',minimized:true,onMission(){},onResource(){}});
  assert.match(html,/Current objective: Collect a careful sample/);assert.match(html,/Low Energy 1\/10 · Water 2\/10/);assert.match(html,/role="status"/);
  assert.doesNotMatch(render(HudObjective,{state:{...state,resources:{power:5,oxygen:5,water:5,food:5}},objective:'Explore',minimized:false,onMission(){},onResource(){}}),/Low Energy/);
});

test('missing equipment art renders a readable, nonbroken placeholder', () => {
  const html=render(PixelImage,{alt:'Repair Toolkit illustration',fallbackText:'⚒',width:36,height:36});
  assert.match(html,/role="img"/);assert.match(html,/Repair Toolkit illustration/);assert.doesNotMatch(html,/<img/);
});

test('equipment UI lists standard tools and only genuinely packed optional choices', () => {
  let state=gameReducer(createInitialGameState(),{type:'START_GAME'});
  function land(){for(const type of ['REVIEW_MANIFEST','CONFIRM_MANIFEST','BEGIN_LAUNCH','COMPLETE_LAUNCH'])state=gameReducer(state,{type});state=gameReducer(state,{type:'SELECT_LANDING_SITE',siteId:'landing-safe-zone'});}
  land();
  const plan={siteId:'icebound.lumen-shelf',method:'rover-only',activity:'subsurface-drilling',equipmentIds:[],supplies:{power:2}};
  let html=render(ExpeditionEquipment,{context:selectIceboundContext(state),plan,onChange(){}});
  assert.match(html,/Standard mission rover/);assert.match(html,/Drilling station/);assert.match(html,/No optional tools were packed/);assert.doesNotMatch(html,/type="checkbox"/);
  state=gameReducer(createInitialGameState(),{type:'START_GAME'});state=gameReducer(state,{type:'SET_SCIENCE_KIT',packed:true});land();
  html=render(ExpeditionEquipment,{context:selectIceboundContext(state),plan:{...plan,equipmentIds:['soil-analysis-kit']},onChange(){}});
  assert.equal((html.match(/type="checkbox"/g)??[]).length,5);assert.match(html,/Soil Analysis Kit/);assert.equal((html.match(/checked=""/g)??[]).length,1);
  const produced=gameReducer(state,{type:'OPERATE_FACILITY',operationId:'collect-energy',expectedSol:state.sol,expectedResourceRevision:state.resourceRevision});
  html=render(FacilityProduction,{building:'solar-array',state:produced,dispatch(){}});
  assert.match(html,/production-succeeded/);assert.match(html,/One Action used/);assert.match(html,/aria-disabled="true"/);
});

test('menu Continue is unavailable without a save and emits only a supplied command', () => {
  let command = null;
  const props = { onCommand: value => { command = value; }, hasSave: false };
  const html = render(MainMenu, props);
  assert.doesNotMatch(html, />Continue Mission</);
  assert.equal(command, null);
  const menu = MainMenu(props);
  menu.props.children[1].props.children[0].props.onClick();
  assert.equal(command, 'start');
});

test('scene choices are inert without a parent handler and explain a blocked choice', () => {
  const html = render(SceneFrame, { artwork: 'menu-dusk', title: 'Preview', choices: [{id: 'opaque-parent-id', label: 'Parent label', blockedReason: 'Parent supplied reason'}] });
  assert.match(html, /disabled=""/);
  assert.match(html, /aria-describedby=/);
  assert.match(html, /Parent supplied reason/);
});

test('outpost slot renders supplied children without introducing game state', () => {
  const html = render(OutpostSlot, { heading: 'Outpost', children: React.createElement('div', { 'data-testid': 'map-slot' }, 'B map goes here') });
  assert.match(html, /data-testid="map-slot"/);
  assert.match(html, /B map goes here/);
});

const inertPorts = Object.fromEntries(['onMainMenu','onChapterCardDismiss','onNewMission','onContinue','onRestart','onCargo','onChoice','onAdvanceSol','onPowerDraft','onPowerConfirm','onLabBoost','onFeedbackDismiss','onPostcardDismiss','onMessage'].map(key => [key, () => assert.fail('Rendering invoked '+key)]));

test('home check displays six supplied checks without evaluating them', () => {
 const view=experienceFixture(12,'home-check'); const before=JSON.stringify(view);
 const html=render(DeveloperAExperience,{view,ports:inertPorts});
 assert.equal((html.match(/class="a-ready"/g)||[]).length,6);
 assert.match(html,/The crew is safe/);assert.match(html,/The ice mission is done/);
 assert.equal(JSON.stringify(view),before);
});

test('all discovery results display a positive learning badge, independent of evidence arithmetic', () => {
 for(const [result,badge] of [['positive','Ice Finder'],['inconclusive','Mystery Marker'],['negative','Map Maker']]) {
  const html=render(DeveloperAExperience,{view:{...experienceFixture(10,'discovery'),scienceResult:result},ports:inertPorts});
  assert.ok(html.includes(badge)); assert.match(html,/Message to Future Explorers/);
 }
});

test('power UI renders five sliders and cannot confirm a rejected parent validation', () => {
 const view=experienceFixture(3).power;
 const html=render(PowerPlanPanel,{view:{...view,validation:{valid:false,allocated:null,remaining:null,warnings:['Parent block reason']}},onChange(){},onConfirm(){}});
 assert.equal((html.match(/type="range"/g)||[]).length,5);
 for(const match of html.matchAll(/<input id="([^"]+)" type="range"/g))assert.ok(html.includes('for="'+match[1]+'"'));
 assert.match(html,/disabled=""[^>]*>Confirm plan/);assert.match(html,/Parent block reason/);
});

test('all six GDD reference presets fit ranges and budgets; custom plans await C validation', () => {
 const maxima={life:40,habitat:30,greenhouse:25,lab:20,comms:10};
 for(const budget of [70,100])for(const preset of previewPresets[budget]) {
  assert.ok(Object.values(preset.plan).reduce((a,b)=>a+b,0)<=budget);
  for(const key of Object.keys(maxima))assert.ok(preset.plan[key]>=0&&preset.plan[key]<=maxima[key]);
 }
 assert.equal(presetValidation({life:0,habitat:0,greenhouse:0,lab:0,comms:0},100).valid,false);
});

test('all 45 GDD feedback IDs exist and copy substitution never evaluates logic', () => {
 assert.equal(Object.keys(feedbackCopy).length,45);
 for(const id of ['fb_grid_repair','fb_ls_reroute','fb_storm_continue_rover','fb_result_negative','fb_ret_c6_fail','fb_go_oxygen','fb_message_saved'])assert.ok(feedbackCopy[id]);
 assert.equal(formatCopy('Battery {battery}; unknown {missing}',{battery:60}),'Battery 60; unknown —');
});

test('each facility inspection offers free entry and forwards exactly the selected ID', () => {
 const labels={habitat:'Habitat','solar-array':'Solar Array',greenhouse:'Greenhouse','research-lab':'Research Laboratory'};
 for(const [facilityId,label] of Object.entries(labels)) {
  const calls=[]; const props=Object.freeze({facilityId,statusLine:'offline',onClose(){},onEnter:id=>calls.push(id)});
  const html=render(FacilityInspection,props);
  assert.ok(html.includes('Enter '+label+' →'));assert.match(html,/Looking is always free/);assert.equal(calls.length,0);
  FacilityInspection(props).props.children.at(-1).props.onClick();
  assert.deepEqual(calls,[facilityId]);assert.equal(props.statusLine,'offline');
 }
});
test('science-site inspection never offers a facility interior', () => {
 const html=render(FacilityInspection,{facilityId:null,site:{id:'site',label:'Frost Ridge',status:'locked',position:{x:15,y:10}},onClose(){},onEnter(){assert.fail('Site entered a room')}});
 assert.match(html,/Frost Ridge/);assert.doesNotMatch(html,/a-enter-facility/);
});
test('empty selection renders no inspection card', () => {
 assert.equal(render(FacilityInspection,{facilityId:null,onClose(){},onEnter(){}}),'');
});
