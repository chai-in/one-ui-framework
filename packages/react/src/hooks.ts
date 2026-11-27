'use client'

import * as React from 'react'
import { createOneTheme, createSpringDriver, SPRING_PRESETS } from '@one-ui/core'
import type { OneTheme, OneThemeOptions, SpringConfig, SpringPreset } from '@one-ui/core'

export interface OneThemeContext extends OneTheme {
  /** Change uncontrolled options. Explicit provider props remain controlled by the parent. */
  updateTheme(options: OneThemeOptions): void
}
interface ThemeScope {
  options: OneThemeOptions
  value: OneThemeContext
}
const Context = React.createContext<ThemeScope | null>(null)
let fallback: OneThemeContext | undefined

export interface OneProviderProps extends OneThemeOptions {
  children?: React.ReactNode
  className?: string
  defaultOptions?: OneThemeOptions
  onThemeChange?: (options: OneThemeOptions) => void
}

export function OneProvider({ children, className, defaultOptions, onThemeChange,
  theme, preset, motion, density, actionBorder, tokens, color }: OneProviderProps): React.ReactElement {
  const parent = React.useContext(Context)
  const [local, setLocal] = React.useState<OneThemeOptions>(defaultOptions ?? {})
  const options = React.useMemo(() => {
    const base = { ...parent?.options, ...local }
    return {
      theme: theme ?? base.theme, preset: preset ?? base.preset, motion: motion ?? base.motion,
      density: density ?? base.density, actionBorder: actionBorder ?? base.actionBorder,
      tokens: { ...parent?.options.tokens, ...local.tokens, ...tokens },
      color: {
        light: { ...parent?.options.color?.light, ...local.color?.light, ...color?.light },
        dark: { ...parent?.options.color?.dark, ...local.color?.dark, ...color?.dark },
      },
    }
  }, [parent, local, theme, preset, motion, density, actionBorder, tokens, color])
  const updateTheme = React.useCallback((patch: OneThemeOptions) => {
    setLocal(previous => ({ ...previous, ...patch }))
    onThemeChange?.({ ...options, ...patch })
  }, [onThemeChange, options])
  const resolved = React.useMemo(() => createOneTheme(options), [options])
  const scope = React.useMemo(() => ({ options, value: { ...resolved, updateTheme } }), [options, resolved, updateTheme])
  // Render the same scoped theme on the server and client, including custom properties.
  return React.createElement(Context.Provider, { value: scope }, React.createElement('div', {
    className: ['one-provider', className].filter(Boolean).join(' '), 'data-one-theme': resolved.theme, 'data-one-preset': resolved.preset,
    'data-one-motion': resolved.motion, 'data-one-density': resolved.density,
    'data-one-action-border': resolved.actionBorder,
    style: { ...resolved.cssVariables, colorScheme: resolved.colorScheme },
  }, children))
}

export function useOneTheme(): OneThemeContext {
  return React.useContext(Context)?.value ?? (fallback ??= { ...createOneTheme(), updateTheme() {} })
}

const query = '(prefers-reduced-motion: reduce)'
function media() { return typeof window === 'undefined' ? undefined : window.matchMedia?.(query) }
let activeMedia: MediaQueryList | undefined
const listeners = new Set<() => void>()
const notifyListeners = () => { for (const notify of listeners) notify() }
function subscribe(notify: () => void) {
  if (!listeners.size) {
    activeMedia = media()
    activeMedia?.addEventListener('change', notifyListeners)
  }
  listeners.add(notify)
  return () => {
    listeners.delete(notify)
    if (!listeners.size) {
      activeMedia?.removeEventListener('change', notifyListeners)
      activeMedia = undefined
    }
  }
}
const snapshot = () => (activeMedia ?? media())?.matches ?? false
const serverSnapshot = () => false

export function useReducedMotion() {
  const system = React.useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  return useOneTheme().motion === 'reduced' || system
}

/** Returns position in caller units. Retargeting preserves displacement and velocity. */
export function useOneSpring(target: number, presetOrConfig: SpringPreset | SpringConfig = 'snappy') {
  const { stiffness, damping, mass } = typeof presetOrConfig === 'string' ? SPRING_PRESETS[presetOrConfig] : presetOrConfig
  const reduced = useReducedMotion()
  const [position, setPosition] = React.useState(target)
  const driver = React.useRef<ReturnType<typeof createSpringDriver> | null>(null)
  const config = React.useRef<SpringConfig | null>(null)
  React.useEffect(() => {
    const previous = driver.current?.state
    if (!driver.current || config.current?.stiffness !== stiffness || config.current.damping !== damping || config.current.mass !== mass) {
      config.current = { stiffness, damping, mass }
      driver.current = createSpringDriver({ from: previous?.position ?? target, velocity: previous?.velocity, config: config.current })
    }
    const current = driver.current
    const instant = reduced || typeof window === 'undefined' || !window.requestAnimationFrame
    current.setMotionMode(instant ? 'reduced' : 'full')
    const state = current.retarget(target)
    setPosition(state.position)
    if (state.position === target && state.velocity === 0) return
    let last = window.performance.now()
    let frame: number
    function tick(now: number) {
      const next = current.step(Math.max(0, now - last))
      last = now
      setPosition(next.position)
      if (next.position !== target || next.velocity !== 0) frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [target, stiffness, damping, mass, reduced])
  return reduced ? target : position
}
