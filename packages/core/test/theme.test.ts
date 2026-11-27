import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { relativeLuminance, contrastRatio, meetsWcagAA, hexToOklch, oklchToHex, createOneTheme, applyOneTheme, THEME_PRESETS } from '../src/index.ts'

test('WCAG sRGB uses both transfer branches and unrounded thresholds', () => {
  assert.equal(relativeLuminance('#000'), 0)
  assert.equal(relativeLuminance('#fff'), 1)
  assert.equal(relativeLuminance('#f00'), 0.2126)
  assert.ok(Math.abs(relativeLuminance('#0a0a0a') - (10 / 255 / 12.92)) < 1e-15)
  assert.ok(Math.abs(relativeLuminance('#0b0b0b') - ((11 / 255 + 0.055) / 1.055) ** 2.4) < 1e-15)
  assert.equal(contrastRatio('#000000', '#ffffff'), 21)
  assert.ok(Math.abs(contrastRatio('#dfd49a', '#000') - 14.02160723759407) < 1e-9)
  assert.ok(Math.abs(contrastRatio('#3f7057', '#fff') - 5.727307368) < 1e-9)
  assert.equal(meetsWcagAA('#777', '#fff', 'text'), false)
  assert.equal(meetsWcagAA('#777', '#fff', 'ui'), true)
  assert.equal(meetsWcagAA('#767676', '#fff', 'text'), true)
  assert.throws(() => relativeLuminance('#00000080'), TypeError)
})

test('OKLCH neutral handling, known red coordinates and round trips on an RGB lattice', () => {
  const red = hexToOklch('#f00')
  assert.ok(Math.abs(red.l - 0.62795536) < 1e-7)
  assert.ok(Math.abs(red.c - 0.2576833) < 1e-7)
  assert.ok(Math.abs(red.h - 29.233885) < 1e-5)
  assert.equal(hexToOklch('#888').c, 0)
  assert.equal(hexToOklch('#fff').h, 0)
  const grid = [0, 10, 11, 64, 128, 192, 254, 255]
  for (const r of grid) for (const g of grid) for (const b of grid) {
    const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
    assert.equal(oklchToHex(hexToOklch(hex)), hex)
  }
  assert.throws(() => oklchToHex({ l: 1.1, c: 0, h: 0 }), RangeError)
})

test('shipped presets match repository tokens and pass all declared contrast pairs', () => {
  const read = (path: string) => JSON.parse(readFileSync(new URL('../../../tokens/' + path, import.meta.url), 'utf8'))
  const base = read('one.tokens.json').color
  assert.deepEqual(Object.keys(THEME_PRESETS), ['default', 'obsidian-studio', 'paper-editorial', 'high-contrast'])
  for (const preset of Object.keys(THEME_PRESETS) as (keyof typeof THEME_PRESETS)[]) {
    const theme = createOneTheme({ preset })
    const overrides = read('themes/' + preset + '.json').color
    for (const scheme of ['light', 'dark'] as const) assert.deepEqual(theme.palettes[scheme], { ...base[scheme], ...overrides[scheme] })
    assert.equal(theme.contrast.pass, true)
    assert.ok(theme.contrast.pairs.length > 100)
    assert.ok(theme.contrast.pairs.every(pair => pair.pass && pair.ratio >= pair.threshold))
  }
})

test('color overrides report each failing pair and preserve the raw ratio', () => {
  const theme = createOneTheme({ theme: 'light', tokens: { action: '#777777', onAction: '#ffffff', focus: '#ffffff' } })
  const action = theme.contrast.pairs.find(p => p.foreground === 'onAction' && p.background === 'action')!
  assert.equal(theme.contrast.pass, false)
  assert.equal(action.pass, false)
  assert.equal(action.ratio, contrastRatio('#fff', '#777'))
  assert.equal(action.threshold, 4.5)
  assert.ok(theme.contrast.pairs.some(p => p.foreground === 'focus' && !p.pass && p.threshold === 3))
  assert.equal(theme.cssVariables['--one-color-action'], '#777777')
  assert.match(theme.stylesheet, /--one-color-on-action: #ffffff;/)
  assert.equal(createOneTheme().cssVariables['--one-color-action'], '#dfd49a')
})

test('system themes emit light-dark values and allow scheme-specific overrides', () => {
  const result = createOneTheme({ tokens: { action: '#fafafa' }, color: { dark: { action: '#cccccc' } } })
  assert.equal(result.cssVariables['--one-color-action'], 'light-dark(#fafafa, #cccccc)')
  assert.equal(result.cssVariables['--one-color-accept'], '#3f7057')
  assert.ok(result.stylesheet.startsWith(':root {\n  color-scheme: light dark;'))
})

test('applying a theme is SSR safe and validates all input before DOM writes', () => {
  const attrs = new Map<string, string>()
  const css = new Map<string, string>()
  const element = {
    setAttribute(name: string, value: string) { attrs.set(name, value) },
    style: { setProperty(name: string, value: string) { css.set(name, value) } },
  }
  assert.equal(applyOneTheme(element), undefined)
  assert.equal(attrs.size, 0)
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { documentElement: element } })
  try {
    assert.throws(() => applyOneTheme(null, { tokens: { action: 'red; } :root {' } }), TypeError)
    assert.throws(() => createOneTheme({ preset: '__proto__' as 'default' }), TypeError)
    assert.throws(() => createOneTheme({ tokens: JSON.parse('{"__proto__":"#fff"}') }), TypeError)
    assert.equal(attrs.size, 0)
    const result = applyOneTheme(null, { theme: 'dark', preset: 'obsidian-studio', motion: 'reduced', density: 'compact', actionBorder: 'bordered' })!
    assert.deepEqual(Object.fromEntries(attrs), {
      'data-one-theme': 'dark', 'data-one-preset': 'obsidian-studio', 'data-one-motion': 'reduced',
      'data-one-density': 'compact', 'data-one-action-border': 'bordered',
    })
    assert.equal(css.get('color-scheme'), 'dark')
    assert.equal(css.get('--one-color-canvas'), result.palettes.dark.canvas)
    applyOneTheme(element, { theme: 'light' })
    assert.equal(css.get('--one-color-canvas'), '#ffffff')
  } finally {
    Reflect.deleteProperty(globalThis, 'document')
  }
})
