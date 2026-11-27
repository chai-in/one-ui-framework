import { copyFile, readFile, writeFile } from 'node:fs/promises'

const destination = new URL('../dist/', import.meta.url)
const exports = []
await copyFile(new URL('../../../platforms/web/one-layout.css', import.meta.url), new URL('one-layout.css', destination))
for (const name of ['tokens', 'primitives', 'moments']) {
  const filename = `one-${name}.css`
  const source = new URL(`../../../platforms/web/${filename}`, import.meta.url)
  await copyFile(source, new URL(filename, destination))
  exports.push(`export const ${name} = ${JSON.stringify(await readFile(source, 'utf8'))}`)
}
await writeFile(new URL('styles.js', destination), exports.join('\n') + '\n')
await copyFile(new URL('../src/styles.d.ts', import.meta.url), new URL('styles.d.ts', destination))
for (const filename of ['LICENSE', 'NOTICE.md']) {
  await copyFile(new URL('../../../' + filename, import.meta.url), new URL(filename, destination))
}
