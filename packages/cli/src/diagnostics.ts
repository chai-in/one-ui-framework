import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { dist, read } from './files.ts'
import { configPath, importedSheets, isWeb, nativePaths, readConfig, ruleFiles, styleNames } from './project.ts'

export function python(command: 'verify' | 'audit', target?: string) {
  const name = command === 'verify' ? 'verify_tokens.py' : 'audit_ui.py'
  const assets = join(dist, 'assets')
  const script = join(assets, name)
  if (!existsSync(script)) return { status: 'unavailable', exitCode: 1, message: `Bundled verifier missing: ${name}` }
  if (target && !existsSync(target)) return { status: 'failed', exitCode: 1, message: `Path does not exist: ${target}` }
  const args = command === 'verify'
    ? ['--tokens', target ? resolve(target) : join(assets, 'one.tokens.json'), '--themes-dir', join(assets, 'themes')]
    : [resolve(target!)]
  const executable = process.platform === 'win32' ? 'python' : 'python3'
  const run = spawnSync(executable, ['-B', script, '--json', ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  const exitCode = run.status ?? 1
  if (run.error) return { status: 'unavailable', exitCode, message: `Cannot run ${executable}: ${run.error.message}` }
  try {
    const report = JSON.parse(run.stdout)
    return { status: exitCode === 0 ? 'passed' : 'failed', exitCode, report }
  } catch {
    return { status: 'failed', exitCode: exitCode || 1, message: run.stderr.trim() || 'Verifier returned an incomplete report.' }
  }
}

const nativeSetup = {
  apple: { suffix: '.swift', theme: /colorScheme|userInterfaceStyle/, pattern: /accessibilityReduceMotion|isReduceMotionEnabled/ },
  android: { suffix: '.kt', theme: /isSystemInDarkTheme/, pattern: /MotionDurationScale|durationScale|ANIMATOR_DURATION_SCALE/ },
  flutter: { suffix: '.dart', theme: /Brightness\.dark/, pattern: /disableAnimations|accessibleNavigation/ },
}

function hasNativeMotion(path: string, suffix: string, pattern: RegExp): boolean {
  if (!existsSync(path)) return false
  for (const item of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, item.name)
    if (item.isFile() && item.name.endsWith(suffix) && pattern.test(read(child) ?? '')) return true
    if (item.isDirectory() && !item.name.startsWith('.') &&
      !['build', 'dist', 'node_modules', 'Pods', 'DerivedData', 'vendor'].includes(item.name) &&
      hasNativeMotion(child, suffix, pattern)) return true
  }
  return false
}

export function doctor(dir: string) {
  const root = resolve(dir)
  let config
  let configError = 'Run one-ui init in this directory.'
  try {
    config = readConfig(root)
  } catch (error) {
    configError = (error as Error).message
  }
  const checks: { name: string; pass: boolean; detail: string }[] = []
  function check(name: string, pass: boolean, ok: string, fix: string) {
    checks.push({ name, pass, detail: pass ? ok : fix })
  }
  check('config', Boolean(config), configPath, configError)
  const configured = config?.platforms ?? ['web']
  const native = nativePaths(root)
  const paths = configured.flatMap(platform => native[platform] ? [native[platform]] : [])
  const web = isWeb(configured)
  const tokenPath = 'src/styles/one-tokens.css'
  if (web) paths.push(tokenPath)
  const missing = paths.filter(path => !read(join(root, path))?.trim())
  check('tokens', !missing.length, paths.join(', '), 'Missing tokens: ' + missing.join(', '))
  const rules = ['one-ui/RULES.md', 'RULES.md', ...ruleFiles].find(path => {
    const content = read(join(root, path)) ?? ''
    return content.includes('ONE-01') && content.includes('ONE-28')
  })
  check('rules', Boolean(rules), rules ?? '', 'Install the One UI rules with one-ui init.')
  const notice = ['one-ui/NOTICE.md', 'NOTICE.md'].some(p => read(join(root, p))?.includes('AGPL-3.0-only'))
  const terms = ['one-ui/LICENSE', 'LICENSE'].some(p => read(join(root, p))?.includes('GNU AFFERO GENERAL PUBLIC LICENSE'))
  check('license', notice && terms, 'AGPL-3.0-only license and notice present.', 'Include the One UI license and third-party notices.')
  if (web) {
    const tokens = read(join(root, tokenPath)) ?? ''
    const imports = importedSheets(read(join(root, 'src/styles/one-ui.css')) ?? '')
    const complete = styleNames(config).every(name => imports.includes(name) && existsSync(join(root, 'src/styles', name)))
    check('styles', complete, 'src/styles/one-ui.css imports the installed styles.', 'Restore the CSS imports in src/styles/one-ui.css.')
    check('theme', Boolean(config && tokens.includes(`[data-one-preset="${config.preset}"]`)),
      `CSS includes the ${config?.preset} preset.`, 'Restore preset tokens and select a supported preset in the config.')
    check('reduced-motion', Boolean(config && tokens.includes('prefers-reduced-motion: reduce') &&
      tokens.includes(`[data-one-motion="${config.motion}"]`)),
    'Token CSS includes the configured motion profile and system preference.', 'Restore motion profiles and the system reduced-motion media query.')
  }
  for (const [platform, { suffix, theme, pattern }] of Object.entries(nativeSetup)) {
    if (configured.some(p => p === platform)) {
      check(platform + '-theme', theme.test(read(join(root, native[platform])) ?? ''),
        'Adaptive palette present in the native token file.', 'Restore native light and dark palette support.')
      check(platform + '-reduced-motion', hasNativeMotion(root, suffix, pattern),
        'Found a native reduced-motion preference check.', `Connect the system motion preference in your ${platform} target.`)
    }
  }
  return { directory: root, healthy: checks.every(c => c.pass), checks }
}
