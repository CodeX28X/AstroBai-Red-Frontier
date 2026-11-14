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
const { MainMenu, SceneFrame, OutpostSlot, DeveloperAExperience, FacilityInspection, PowerPlanPanel, experienceFixture, previewPresets, presetValidation, feedbackCopy, formatCopy } = require(join(scratch, 'components.cjs'));
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));

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
