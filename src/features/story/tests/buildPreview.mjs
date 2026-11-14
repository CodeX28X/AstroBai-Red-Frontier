// Build A's isolated preview without changing the shared Vite setup or main dist.
import { build } from 'vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const featureRoot=resolve(dirname(fileURLToPath(import.meta.url)), '..')
const projectRoot=resolve(featureRoot, '../../..')
await build({
  configFile:false,
  root:projectRoot,
  build:{outDir:resolve(projectRoot,'node_modules/.cache/a-story-preview-build'),rolldownOptions:{input:resolve(featureRoot,'preview/index.html')}},
})
