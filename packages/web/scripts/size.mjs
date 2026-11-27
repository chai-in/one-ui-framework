import { readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

const bundle = await readFile(new URL('../dist/one-ui-web.bundle.js', import.meta.url))
console.log(`one-ui-web.bundle.js: ${bundle.length} bytes raw, ${gzipSync(bundle, { level: 9 }).length} bytes gzip (-9)`)
