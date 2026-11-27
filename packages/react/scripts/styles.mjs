import { readFile, writeFile } from 'node:fs/promises'

const sources = ['../../../platforms/web/one-tokens.css', '../../../platforms/web/one-layout.css', '../src/styles.css']
const css = await Promise.all(sources.map(path => readFile(new URL(path, import.meta.url), 'utf8')))
await writeFile(new URL('../dist/styles.css', import.meta.url), css.join('\n'))
