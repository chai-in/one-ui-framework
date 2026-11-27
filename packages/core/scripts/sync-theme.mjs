// Keep published packages independent of repository-relative files.
import { readFile, writeFile } from 'node:fs/promises'

const tokens = new URL('../../../tokens/', import.meta.url)
const read = async path => JSON.parse(await readFile(new URL(path, tokens), 'utf8'))
const { color } = await read('one.tokens.json')
const presets = {}
for (const id of ['default', 'obsidian-studio', 'paper-editorial', 'high-contrast']) {
  presets[id] = (await read(`themes/${id}.json`)).color
}
const render = value => JSON.stringify(value, null, 2)
await writeFile(new URL('../src/theme-data.ts', import.meta.url),
  `// Generated from tokens/one.tokens.json and tokens/themes by scripts/sync-theme.mjs.\n` +
  `export const baseColors = ${render(color)} as const\n\n` +
  `export const presetColors = ${render(presets)} as const\n`)
