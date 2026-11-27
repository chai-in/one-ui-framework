import { basename, dirname, resolve } from 'node:path'
import { createOneTheme } from '@one-ui/core'
import type { ColorPalette, ThemePreset } from '@one-ui/core'
import { license, ProjectFiles } from './files.ts'

export function theme(preset: ThemePreset, accent?: string, canvas?: string, out?: string, validate = false) {
  const tokens: Partial<ColorPalette> = {}
  if (accent !== undefined) tokens.action = accent
  if (canvas !== undefined) tokens.canvas = canvas
  const result = createOneTheme({ preset, tokens })
  const output = validate && !out ? null : resolve(out ?? 'one-theme.css')
  const failures = result.contrast.pairs.filter(pair => !pair.pass)
  if (!failures.length && output) {
    const plan = new ProjectFiles(dirname(output))
    plan.put(basename(output), `/* ${license} */\n${result.stylesheet}\n`, true)
    plan.finish(false)
  }
  return { preset, valid: result.contrast.pass, pairsChecked: result.contrast.pairs.length,
    failures, output: failures.length ? null : output }
}
