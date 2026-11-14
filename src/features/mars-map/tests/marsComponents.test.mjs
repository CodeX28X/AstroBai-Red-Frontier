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
  ['Facility', 'components/mars/Facility.tsx'],
  ['ExplorationSite', 'components/mars/ExplorationSite.tsx'],
  ['ExpeditionMarker', 'components/mars/ExpeditionMarker.tsx'],
  ['marsLocations', 'data/marsLocations.ts'],
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
const { Facility, ExplorationSite, ExpeditionMarker, marsLocations } = require(join(scratch, 'components.cjs'));
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));

test('all four facilities expose native inspection buttons in every status and selection state', () => {
  assert.equal(marsLocations.length, 4);
  for (const location of marsLocations) for (const status of ['operational', 'offline', 'damaged', 'unbuilt']) for (const selected of [false, true]) {
    const html = render(Facility, { location, status, selected, onSelect: () => assert.fail('render dispatched') });
    assert.match(html, /<button type="button"/);
    assert.ok(html.includes(`Inspect ${location.label}, ${{ operational: 'Ready', offline: 'Not ready', damaged: 'Needs repair', unbuilt: 'Not built' }[status]}`));
    assert.ok(html.includes(`aria-pressed="${selected}"`));
    assert.ok(html.includes(`status-${status}`));
    assert.equal(html.includes('malfunction-plume'), status === 'damaged');
    assert.match(html, /status-symbol/);
  }
});

test('facility inspection invokes exactly its supplied callback without mutating input', () => {
  for (const location of marsLocations) {
    let calls = 0;
    const props = Object.freeze({ location: Object.freeze({ ...location }), status: 'offline', selected: false, onSelect: () => calls++ });
    const button = Facility(props);
    assert.equal(calls, 0);
    button.props.onClick();
    assert.equal(calls, 1);
    assert.equal(props.status, 'offline');
    assert.equal(props.selected, false);
  }
});

test('crew sheltering has text and an accessible facility description', () => {
  const html = render(Facility, { location: marsLocations[0], status: 'operational', selected: false, sheltering: true, onSelect() {} });
  assert.match(html, /crew sheltering/);
  assert.match(html, /Crew inside/);
});

test('site statuses remain inspectable and render their supplied positions and selection', () => {
  for (const status of ['available', 'locked', 'active', 'completed']) {
    const site = Object.freeze({ id: 'verified-site', label: 'Frost Ridge', status, position: Object.freeze({ x: 15, y: 10 }) });
    let calls = 0;
    const props = { site, selected: true, onSelect: () => calls++ };
    const html = render(ExplorationSite, props);
    assert.equal(calls, 0);
    assert.ok(html.includes(`Frost Ridge, ${status}`));
    assert.match(html, /left:15%;top:10%/);
    assert.match(html, /aria-pressed="true"/);
    assert.ok(html.includes(`site-${status}`));
    ExplorationSite(props).props.onClick();
    assert.equal(calls, 1); // Inspection only, including locked/completed sites.
    assert.equal(site.status, status);
    assert.doesNotMatch(html, /reward|Launch expedition|Start expedition/);
  }
});

test('all expedition assignment kinds have a labelled decorative SVG', () => {
  for (const kind of ['rover', 'astronaut', 'combined']) {
    const html = render(ExpeditionMarker, { kind });
    assert.ok(html.includes(`aria-label="${kind} expedition"`));
    assert.match(html, /role="img"/);
    assert.match(html, /shape-rendering="crispEdges"/);
    assert.match(html, /aria-hidden="true"/);
  }
});

test('repeated facility artwork produces unique SVG clipping identifiers', () => {
  const solar = marsLocations.find(location => location.id === 'solar-array');
  const html = renderToStaticMarkup(React.createElement(React.Fragment, null, [0, 1].map(key => React.createElement(Facility, { key, location: solar, status: 'operational', selected: false, onSelect() {} }))));
  const ids = [...html.matchAll(/<clipPath id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, 2);
  assert.equal(new Set(ids).size, 2);
});
