import * as esbuild from 'esbuild'
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await collect(path))
    else if (/\.(?:tsx?|js|json)$/.test(entry.name)) files.push(path)
  }
  return files
}

const entryPoints = (await collect(join(root, 'src'))).filter((file) => /\.tsx?$/.test(file))
await esbuild.build({
  entryPoints,
  outbase: join(root, 'src'),
  outdir: join(root, 'dist'),
  format: 'esm',
  platform: 'node',
  target: 'node20',
  jsx: 'automatic',
  tsconfigRaw: { compilerOptions: { experimentalDecorators: true } },
  packages: 'external',
  sourcemap: true,
  logLevel: 'info',
})

for (const file of await collect(join(root, 'dist'))) {
  if (!file.endsWith('.js')) continue
  let content = await readFile(file, 'utf8')
  content = content.replace(/(from\s+["'])(\.[^"']+)(["'])/g, (match, before, path, after) =>
    /\.(?:js|json)$/.test(path) ? match : `${before}${path}.js${after}`,
  )
  content = content.replace(/(import\(\s*["'])(\.[^"']+)(["']\s*\))/g, (match, before, path, after) =>
    /\.(?:js|json)$/.test(path) ? match : `${before}${path}.js${after}`,
  )
  await writeFile(file, content)
}

for (const file of await collect(join(root, 'src'))) {
  const relativePath = relative(join(root, 'src'), file)
  const isSchemaDiscoveryFile = /(^|[/\\])(?:entities|schema)\.ts$/.test(relativePath)
  if (!file.endsWith('.json') && !isSchemaDiscoveryFile) continue
  const outputPath = join(root, 'dist', relativePath)
  await mkdir(dirname(outputPath), { recursive: true })
  await copyFile(file, outputPath)
}

console.log(`Built ${entryPoints.length} Channel Architect module files from ${relative(process.cwd(), resolve(root, 'src'))}.`)
