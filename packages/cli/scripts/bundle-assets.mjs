import { chmod, copyFile, mkdir } from 'node:fs/promises'
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = new URL('../../../', import.meta.url)
const dist = new URL('../dist/', import.meta.url)
const assets = [
  'RULES.md',
  'packages/web/dist/one-ui-web.bundle.js',
  'tokens/one.tokens.json',
  ...['one-tokens', 'one-primitives', 'one-layout', 'one-moments', 'one-tailwind-v4', 'one-compat-asterline']
    .map(name => `platforms/web/${name}.css`),
  'platforms/apple/Sources/OneUI/OneDesignTokens.generated.swift',
  'platforms/android/OneDesignTokens.generated.kt',
  'platforms/flutter/one_design_tokens.g.dart',
  ...['audit_ui', 'verify_tokens', 'spring_physics'].map(name => `skills/one-ui/scripts/${name}.py`),
  ...['default', 'obsidian-studio', 'paper-editorial', 'high-contrast'].map(name => `tokens/themes/${name}.json`),
]
await mkdir(new URL('assets/themes/', dist), { recursive: true })
for (const source of assets) {
  const name = source.startsWith('tokens/themes/') ? 'themes/' + basename(source) : basename(source)
  await copyFile(new URL(source, repo), new URL('assets/' + name, dist))
}
for (const name of ['LICENSE', 'NOTICE.md']) {
  await copyFile(new URL(name, repo), new URL(name, dist))
}
await chmod(fileURLToPath(new URL('bin.js', dist)), 0o755)
