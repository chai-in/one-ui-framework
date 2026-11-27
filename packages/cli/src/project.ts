import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { THEME_PRESETS } from '@one-ui/core'
import type { ThemePreset } from '@one-ui/core'
import { asset, notices, ProjectFiles, read } from './files.ts'

export const platforms = ['auto', 'web', 'tailwind', 'react', 'apple', 'android', 'flutter', 'all'] as const
export const motions = ['calm', 'tactile', 'reduced'] as const
export const ruleFiles = ['AGENTS.md', 'GEMINI.md', 'CLAUDE.md'] as const
type Platform = Exclude<typeof platforms[number], 'auto' | 'all'>
export type Motion = typeof motions[number]
export interface Config {
  version: string
  platforms: Platform[]
  preset: ThemePreset
  motion: Motion
  compatAsterline: boolean
}
export const configPath = 'one-ui.config.json'
export const isWeb = (items: readonly string[]) => items.some(p => ['web', 'tailwind', 'react'].includes(p))

export function readConfig(root: string): Config | undefined {
  const source = read(join(root, configPath))
  if (source === undefined) return undefined
  const c = JSON.parse(source)
  if (!c || c.version !== '1.0.0' || !Array.isArray(c.platforms) || !c.platforms.length ||
    !c.platforms.every((p: string) => platforms.includes(p as Platform) && p !== 'auto' && p !== 'all') ||
    !Object.hasOwn(THEME_PRESETS, c.preset) || !motions.includes(c.motion) || typeof c.compatAsterline !== 'boolean') {
    throw new Error(`Invalid or unsupported ${configPath}`)
  }
  return c
}

function detect(root: string): Platform[] {
  const names = existsSync(root) ? readdirSync(root) : []
  const pkg = JSON.parse(read(join(root, 'package.json')) ?? '{}')
  const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies }
  const found: Platform[] = []
  if ('react' in deps || 'next' in deps || '@astrojs/react' in deps) found.push('react')
  if (['@tailwindcss/vite', '@tailwindcss/postcss', '@tailwindcss/cli'].some(k => k in deps) ||
    /^(?:workspace:)?(?:[~^>= ]*4(?:\D|$)|latest$)/.test(deps.tailwindcss ?? '')) found.push('tailwind')
  if (!found.length && ['vite', 'astro', 'tailwindcss', 'next', 'react-dom'].some(k => k in deps)) found.push('web')
  if (names.includes('Package.swift') || names.some(n => n.endsWith('.xcodeproj'))) found.push('apple')
  if (names.some(n => /^build\.gradle(?:\.kts)?$/.test(n))) found.push('android')
  if (names.includes('pubspec.yaml')) found.push('flutter')
  return found.length ? found : ['web']
}

export function nativePaths(root: string): Record<string, string> {
  // Place Swift tokens into the project's source target when it is unambiguous.
  const sources = join(root, 'Sources')
  const targets = existsSync(sources) ? readdirSync(sources, { withFileTypes: true }).filter(e => e.isDirectory()) : []
  const swiftDir = targets.length === 1 ? 'Sources/' + targets[0].name : 'Sources/OneUI'
  const androidDir = existsSync(join(root, 'app')) ? 'app/src/main' : 'src/main'
  return {
    apple: swiftDir + '/OneDesignTokens.generated.swift',
    android: androidDir + '/java/one/ui/OneDesignTokens.generated.kt',
    flutter: 'lib/one_ui/one_design_tokens.g.dart',
  }
}

export function styleNames(config?: Config) {
  const sheets = ['one-tokens.css', 'one-primitives.css', 'one-layout.css', 'one-moments.css']
  if (config?.platforms.includes('tailwind')) sheets.push('one-tailwind-v4.css')
  if (config?.compatAsterline) sheets.push('one-compat-asterline.css')
  return sheets
}

// Match unconditional local CSS imports, skipping comments and conditional imports.
const cssImports = /\/\*[\s\S]*?\*\/|@import\s+(?:["']([^"']+)["']|url\(\s*["']?([^'"\s)]+)["']?\s*\))\s*;[^\S\r\n]*(?:\r?\n)?/gi
export function importedSheets(css: string) {
  return [...css.matchAll(cssImports)].map(m => (m[1] ?? m[2] ?? '').replace(/^\.\//, '')).filter(Boolean)
}

export function styles(plan: ProjectFiles, config?: Config, previous?: Config) {
  const sheets = styleNames(config)
  for (const sheet of sheets) plan.put('src/styles/' + sheet, asset(sheet))
  const path = 'src/styles/one-ui.css'
  const existing = read(join(plan.root, path)) ?? ''
  const wanted = config?.platforms.includes('tailwind') ? ['tailwindcss', ...sheets] : sheets
  const names = new Set([...wanted, ...styleNames(previous)])
  if (previous?.platforms.includes('tailwind')) names.add('tailwindcss')
  const remaining = existing.replace(cssImports, (statement, quoted, url) => {
    const name = (quoted ?? url ?? '').replace(/^\.\//, '')
    return names.has(name) ? '' : statement
  })
  const imports = wanted.map(name => `@import "${name === 'tailwindcss' ? '' : './'}${name}";\n`).join('')
  // Imports precede ordinary rules, and follow an optional charset.
  const charset = remaining.match(/^@charset\s+"[^"]+";[^\S\r\n]*(?:\r?\n)?/i)?.[0] ?? ''
  plan.put(path, charset + imports + remaining.slice(charset.length), true)
}

function inject(source: string, rules: string) {
  const newline = source.includes('\r\n') ? '\r\n' : '\n'
  const snippet = ['<!-- one-ui:v1.0 -->', rules.trim(), '<!-- /one-ui:v1.0 -->'].join('\n').replaceAll('\n', newline)
  const marker = /<!-- (one-ui:v1\.0|asterline-ui:v0\.3) -->[\s\S]*?<!-- \/\1 -->/g
  const leftover = source.replace(marker, '')
  if (/<!-- \/?(?:one-ui:v1\.0|asterline-ui:v0\.3) -->/.test(leftover)) {
    throw new Error('Unpaired One UI rules marker. Repair the marker before injecting rules.')
  }
  let found = false
  const updated = source.replace(marker, () => {
    if (found) return ''
    found = true
    return snippet
  })
  if (found) return updated
  const separator = source ? (source.endsWith('\n') ? newline : newline + newline) : ''
  return source + separator + snippet + newline
}

interface Init {
  dir: string
  platform?: typeof platforms[number]
  preset?: ThemePreset
  motion?: Motion
  compat?: boolean
  injectRules?: typeof ruleFiles[number]
  dryRun: boolean
}

export function init(options: Init) {
  const plan = new ProjectFiles(options.dir)
  const previous = readConfig(plan.root)
  const requested = options.platform
  let selected: Platform[]
  if (requested === 'all') selected = ['web', 'react', 'tailwind', 'apple', 'android', 'flutter']
  else if (requested && requested !== 'auto') selected = [requested]
  else selected = (!requested && previous?.platforms) || detect(plan.root)
  const config: Config = {
    ...previous, version: '1.0.0', platforms: selected, preset: options.preset ?? previous?.preset ?? 'default',
    motion: options.motion ?? previous?.motion ?? 'calm',
    compatAsterline: options.compat ?? previous?.compatAsterline ?? false,
  }
  const usage: string[] = []
  if (isWeb(selected)) {
    styles(plan, config, previous)
    usage.push('Import src/styles/one-ui.css in the application entry point.',
      `Set data-one-preset="${config.preset}" and data-one-motion="${config.motion}" on <html>.`)
  }
  const native = nativePaths(plan.root)
  for (const platform of selected) {
    const path = native[platform]
    if (path) {
      plan.put(path, asset(path.split('/').at(-1)!))
      usage.push(`Include ${path} in your ${platform} application target.`)
    }
  }
  const rules = asset('RULES.md')
  plan.put('one-ui/RULES.md', rules)
  notices(plan)
  if (options.injectRules) {
    const source = read(join(plan.root, options.injectRules)) ?? ''
    plan.put(options.injectRules, inject(source, rules), true)
  }
  plan.put(configPath, JSON.stringify(config, null, 2) + '\n', Boolean(previous))
  return { ...plan.finish(options.dryRun), config, usage }
}
