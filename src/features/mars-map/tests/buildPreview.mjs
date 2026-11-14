// Verify both B preview entries without changing the team's Vite config or dist.
import { build } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const featureRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = resolve(featureRoot, '../../..');
await build({
  configFile: false,
  root: projectRoot,
  build: {
    outDir: resolve(projectRoot, 'node_modules/.cache/mars-map-preview-build'),
    rolldownOptions: {
      input: [resolve(featureRoot, 'preview/index.html'), resolve(featureRoot, 'preview/props.html')],
    },
  },
});
