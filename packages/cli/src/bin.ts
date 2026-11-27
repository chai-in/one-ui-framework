#!/usr/bin/env node
import { parseArgs } from 'node:util'
import type { ParseArgsOptionsConfig } from 'node:util'
import { THEME_PRESETS } from '@one-ui/core'
import type { ThemePreset } from '@one-ui/core'
import { add, modes } from './add.ts'
import { inspect, list, lookup } from './catalog.ts'
import { doctor, python } from './diagnostics.ts'
import { init, motions, platforms, ruleFiles } from './project.ts'
import { theme } from './theme.ts'

const version = '1.0.0'
const commands = {
  init: 'init [--dir PATH] [--platform PLATFORM] [--preset PRESET] [--motion PROFILE] [--inject-rules FILE] [--compat-asterline] [--dry-run]',
  list: 'list [--type all|controls|moments] [--category NAME] [--search TEXT]',
  inspect: 'inspect SLUG|ID',
  add: 'add SLUG|ID|CATEGORY|all ... [--dir PATH] [--mode web|react|css] [--dry-run]',
  theme: 'theme PRESET [--accent HEX] [--canvas HEX] [--out FILE] [--validate]',
  verify: 'verify [--tokens PATH]',
  audit: 'audit TARGET',
  doctor: 'doctor [--dir PATH]',
}
type Command = keyof typeof commands
const optionNames: Record<Command, string[]> = {
  init: ['dir', 'platform', 'preset', 'motion', 'inject-rules', 'compat-asterline', 'dry-run'],
  list: ['type', 'category', 'search'], inspect: [], add: ['dir', 'mode', 'dry-run'],
  theme: ['accent', 'canvas', 'out', 'validate'], verify: ['tokens'], audit: [], doctor: ['dir'],
}
const flags = ['help', 'version', 'json', 'dry-run', 'validate', 'compat-asterline']
const presets = Object.keys(THEME_PRESETS) as ThemePreset[]
const details: Record<Command, string> = {
  init: `Platforms: ${platforms.join(', ')}. Auto detects all supported stacks in the target.
Presets: ${presets.join(', ')}. Motion: ${motions.join(', ')}.
Inject a managed rules block into AGENTS.md, GEMINI.md or CLAUDE.md.`,
  list: 'Search IDs, slugs, names and categories. Combine filters to narrow the catalog.',
  inspect: 'Display the accessibility contract, attributes, events and HTML, React and SwiftUI examples.',
  add: 'Web writes standalone HTML with a local runtime. React writes package re-exports. CSS writes native-control styles.',
  theme: 'Write one-theme.css or --out FILE. --validate checks without writing unless --out is given. All writes require passing contrast.',
  verify: 'Run the bundled Python token verifier across the base palette and presets.',
  audit: 'Run the bundled Python static UI auditor on a file or directory.',
  doctor: 'Check installed files, rules, license notices, theme and reduced-motion setup.',
}

function help(command?: Command) {
  if (command) return `one-ui ${commands[command]} [--json]\n\n${details[command]}`
  return `One UI ${version}\n\nUsage: one-ui COMMAND [options]\n\n` +
    Object.values(commands).map(s => '  ' + s).join('\n') +
    '\n\nUse --json on any command for compact output. Use COMMAND --help for details.\n  --help, -h    --version, -v'
}

function choice<T extends string>(value: string | undefined, allowed: readonly T[], name: string): T | undefined {
  if (value === undefined) return undefined
  if (!allowed.includes(value as T)) throw new Error(`${name} must be one of ${allowed.join(', ')}.`)
  return value as T
}

function main(argv: string[]) {
  const [first, ...args] = argv
  if (!first || ['--help', '-h', 'help'].includes(first)) {
    const command = first === 'help' && args[0] && Object.hasOwn(commands, args[0]) ? args[0] as Command : undefined
    console.log(help(command))
    return
  }
  if (first === '--version' || first === '-v') { console.log(version); return }
  if (!Object.hasOwn(commands, first)) throw new Error(`Unknown command "${first}". Run one-ui --help.`)
  const command = first as Command
  const options: ParseArgsOptionsConfig = {}
  for (const name of [...optionNames[command], 'help', 'json', 'version']) {
    options[name] = { type: flags.includes(name) ? 'boolean' : 'string' }
  }
  options.help.short = 'h'
  options.version.short = 'v'
  const { values, positionals } = parseArgs({ args, options, allowPositionals: true })
  if (values.help) { console.log(help(command)); return }
  if (values.version) { console.log(version); return }
  const count = positionals.length
  const expected = ['inspect', 'theme', 'audit'].includes(command) ? 1 : 0
  if (command === 'add' ? count < 1 : count !== expected) throw new Error(`Usage: one-ui ${commands[command]}`)
  const string = (name: string) => {
    const value = values[name]
    if (value === '') throw new Error(`--${name} requires a value.`)
    return typeof value === 'string' ? value : undefined
  }
  const dir = string('dir') ?? '.'
  const dry = values['dry-run'] === true
  const output = (data: unknown, human: string) => console.log(values.json ? JSON.stringify(data) : human)
  switch (command) {
    case 'list': {
      const result = list(choice(string('type'), ['controls', 'moments', 'all'], '--type') ?? 'all', string('category'), string('search'))
      const sections = Object.entries(result).filter(([, entries]) => entries.length).map(([kind, entries]) =>
        `${kind} (${entries.length})\n` + entries.map(e => `  ${e.id.padEnd(13)} ${e.slug.padEnd(18)} ${e.category}`).join('\n'))
      output(result, sections.join('\n\n') || 'No matching components.')
      break
    }
    case 'inspect': {
      const item = inspect(lookup(positionals[0]))
      output(item, [`${item.name} (${item.id}) · ${item.tagName}`, `Category: ${item.category} · Spring: ${item.springPreset}`,
        `Role: ${item.semanticRole}\nARIA: ${item.ariaPattern}`, `Reduced motion: ${item.reducedMotionBehavior}`,
        `Attributes: ${item.attributes.join(', ')}\nEvents: ${item.events.join(', ') || 'none'}`,
        `Web custom events: ${item.webEvents.join(', ') || 'none'}`,
        ...Object.entries(item.snippets).map(([language, code]) => `${language}\n${code}`)].join('\n\n'))
      break
    }
    case 'init':
    case 'add': {
      const result = command === 'init' ? init({ dir, dryRun: dry,
        platform: choice(string('platform'), platforms, '--platform'), preset: choice(string('preset'), presets, '--preset'),
        motion: choice(string('motion'), motions, '--motion'), injectRules: choice(string('inject-rules'), ruleFiles, '--inject-rules'),
        compat: values['compat-asterline'] === true || undefined,
      }) : add(dir, positionals, choice(string('mode'), modes, '--mode'), dry)
      const title = `${dry ? 'Dry run' : 'One UI'} · ${result.directory}`
      output(result, [title, ...result.files.map(f => `  ${f.status.padEnd(7)} ${f.path}`), '', ...result.usage].join('\n'))
      break
    }
    case 'theme': {
      const preset = choice(positionals[0], presets, 'Preset')!
      const result = theme(preset, string('accent'), string('canvas'), string('out'), Boolean(values.validate))
      process.exitCode = result.valid ? 0 : 1
      output(result, [`${result.valid ? 'PASS' : 'FAIL'} ${result.preset} · ${result.pairsChecked} contrast pairs checked`,
        ...result.failures.map(f => `  ${f.scheme} ${f.foreground}/${f.background}: ${f.ratio.toFixed(2)} < ${f.threshold}`),
        ...(result.output ? ['Wrote ' + result.output] : [])].join('\n'))
      break
    }
    case 'doctor': {
      const result = doctor(dir)
      process.exitCode = result.healthy ? 0 : 1
      output(result, [`One UI setup · ${result.directory}`,
        ...result.checks.map(c => `  ${c.pass ? 'PASS' : 'FAIL'} ${c.name}: ${c.detail}`)].join('\n'))
      break
    }
    case 'audit':
    case 'verify': {
      const result = python(command, command === 'verify' ? string('tokens') : positionals[0])
      process.exitCode = result.exitCode
      output(result, `${command} ${result.status}\n${result.message ?? JSON.stringify(result.report, null, 2)}`)
      break
    }
  }
}

try {
  main(process.argv.slice(2))
} catch (error) {
  process.exitCode = 1
  const message = error instanceof Error ? error.message : String(error)
  if (process.argv.slice(2).includes('--json')) console.log(JSON.stringify({ status: 'failed', error: message }))
  else console.error('one-ui: ' + message)
}
