import { contrastRatio } from './contrast.ts'
import type { ContrastKind } from './contrast.ts'
import { baseColors, presetColors } from './theme-data.ts'

export const THEME_PRESETS = {
  default: { id: 'default', name: 'Default' },
  'obsidian-studio': { id: 'obsidian-studio', name: 'Obsidian Studio' },
  'paper-editorial': { id: 'paper-editorial', name: 'Paper Editorial' },
  'high-contrast': { id: 'high-contrast', name: 'High Contrast' },
} as const satisfies Record<keyof typeof presetColors, { id: string; name: string }>

export type ThemePreset = keyof typeof THEME_PRESETS
export type ColorRole = keyof typeof baseColors.light
export type ColorPalette = Record<ColorRole, string>
export type ColorScheme = 'light' | 'dark'

export interface OneThemeOptions {
  preset?: ThemePreset
  theme?: ColorScheme | 'system'
  motion?: 'calm' | 'tactile' | 'reduced'
  density?: 'compact' | 'comfortable'
  actionBorder?: 'borderless-filled' | 'bordered'
  /** Shared semantic colors. Per-scheme overrides take precedence. */
  tokens?: Partial<ColorPalette>
  color?: Partial<Record<ColorScheme, Partial<ColorPalette>>>
}

export interface ThemeContrastPair {
  scheme: ColorScheme
  foreground: ColorRole
  background: ColorRole
  kind: ContrastKind
  threshold: number
  ratio: number
  pass: boolean
}

function contrastPairs(palette: ColorPalette, scheme: ColorScheme): ThemeContrastPair[] {
  const pairs: ThemeContrastPair[] = []
  function add(foreground: ColorRole, background: ColorRole, kind: ContrastKind = 'text') {
    const ratio = contrastRatio(palette[foreground], palette[background])
    const threshold = kind === 'text' ? 4.5 : 3
    pairs.push({ scheme, foreground, background, kind, threshold, ratio, pass: ratio >= threshold })
  }
  for (const surface of ['canvas', 'surface', 'surfaceSubtle', 'surfaceRaised'] as const) {
    for (const role of ['textPrimary', 'textSecondary', 'textMuted', 'placeholder'] as const) add(role, surface)
    for (const role of ['borderControl', 'borderStrong', 'borderHighContrast', 'focus'] as const) add(role, surface, 'ui')
  }
  for (const [label, variants] of [
    ['onAction', ['action', 'actionHover', 'actionActive']],
    ['onAccept', ['accept', 'acceptHover', 'acceptActive']],
    ['onDecline', ['decline', 'declineHover', 'declineActive']],
    ['onDestructive', ['destructive', 'destructiveHover', 'destructiveActive']],
    ['onNeutral', ['neutral', 'neutralHover', 'neutralActive']],
    ['onCategory', ['categoryBlue', 'categoryGreen', 'categoryLavender']],
    ['onSelected', ['selected']], ['disabledText', ['disabledFill']],
    ['successText', ['successFill']], ['warningText', ['warningFill']],
    ['dangerText', ['dangerFill']], ['infoText', ['infoFill']],
  ] as const) {
    for (const background of variants) add(label, background)
  }
  add('focus', 'focusGap', 'ui')
  return pairs
}

function resolvePalette(preset: ThemePreset, scheme: ColorScheme, options: OneThemeOptions): ColorPalette {
  const result: ColorPalette = { ...baseColors[scheme], ...presetColors[preset][scheme] }
  for (const overrides of [options.tokens, options.color?.[scheme]]) {
    for (const [role, value] of Object.entries(overrides ?? {})) {
      if (!Object.hasOwn(result, role)) throw new TypeError(`Unknown semantic color role: ${role}`)
      const hex = role === 'overlay' ? /^#(?:[a-f0-9]{3,4}|[a-f0-9]{6}|[a-f0-9]{8})$/i : /^#(?:[a-f0-9]{3}|[a-f0-9]{6})$/i
      if (typeof value !== 'string' || !hex.test(value)) throw new TypeError(`Invalid hex color for ${role}.`)
      result[role as ColorRole] = value.toLowerCase()
    }
  }
  return result
}

export function createOneTheme(options: OneThemeOptions = {}) {
  const preset = options.preset ?? 'default'
  const theme = options.theme ?? 'system'
  const motion = options.motion ?? 'calm'
  const density = options.density ?? 'comfortable'
  const actionBorder = options.actionBorder ?? 'borderless-filled'
  if (!Object.hasOwn(THEME_PRESETS, preset) || !['light', 'dark', 'system'].includes(theme) ||
      !['calm', 'tactile', 'reduced'].includes(motion) || !['comfortable', 'compact'].includes(density) ||
      !['borderless-filled', 'bordered'].includes(actionBorder)) throw new TypeError('Invalid One UI theme option.')
  const light = resolvePalette(preset, 'light', options)
  const dark = resolvePalette(preset, 'dark', options)
  const schemes: ColorScheme[] = theme === 'system' ? ['light', 'dark'] : [theme]
  const palettes = { light, dark }
  const pairs = schemes.flatMap(scheme => contrastPairs(palettes[scheme], scheme))
  const cssVariables: Record<string, string> = {}
  for (const role of Object.keys(light) as ColorRole[]) {
    const name = '--one-color-' + role.replace(/[A-Z]/g, c => '-' + c.toLowerCase())
    cssVariables[name] = theme === 'system'
      ? light[role] === dark[role] ? light[role] : `light-dark(${light[role]}, ${dark[role]})`
      : palettes[theme][role]
  }
  const colorScheme = theme === 'system' ? 'light dark' : theme
  const declarations = Object.entries(cssVariables).map(([key, value]) => `  ${key}: ${value};`).join('\n')
  const stylesheet = `:root {\n  color-scheme: ${colorScheme};\n${declarations}\n}`
  return {
    preset, theme, motion, density, actionBorder, palettes, cssVariables, stylesheet, colorScheme,
    contrast: { pass: pairs.every(pair => pair.pass), pairs },
  }
}

export type OneTheme = ReturnType<typeof createOneTheme>

/** Structural DOM surface, so server-side consumers may omit lib.dom from their TypeScript configuration. */
export interface ThemeTarget {
  setAttribute(name: string, value: string): void
  style: { setProperty(name: string, value: string): void }
}

/** Applies a scoped theme to a node, or the root document element when targetEl is omitted. */
export function applyOneTheme(targetEl?: ThemeTarget | null, options: OneThemeOptions = {}) {
  if (typeof document === 'undefined') return
  const target = targetEl ?? document.documentElement
  const result = createOneTheme(options)
  target.setAttribute('data-one-theme', result.theme)
  target.setAttribute('data-one-preset', result.preset)
  target.setAttribute('data-one-motion', result.motion)
  target.setAttribute('data-one-density', result.density)
  target.setAttribute('data-one-action-border', result.actionBorder)
  target.style.setProperty('color-scheme', result.colorScheme)
  for (const [key, value] of Object.entries(result.cssVariables)) target.style.setProperty(key, value)
  return result
}
