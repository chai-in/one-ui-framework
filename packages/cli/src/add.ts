import { componentName, htmlElement, select } from './catalog.ts'
import { asset, license, notices, ProjectFiles } from './files.ts'
import { readConfig, styles } from './project.ts'
import type { CatalogEntry } from '@one-ui/core'

export const modes = ['web', 'react', 'css'] as const
type Mode = typeof modes[number]

function skin(entry: CatalogEntry) {
  const target = `[data-one-component="${entry.slug}"]`
  return `/* ${license}
 * Apply data-one-component="${entry.slug}" to the native ${entry.semanticRole}.
 * ${entry.ariaPattern}
 * ${entry.reducedMotionBehavior}
 */
@import "../../styles/one-ui.css";

${target} {
  color: var(--one-color-text-primary);
  accent-color: var(--one-color-focus);
}
${target}:focus-visible {
  outline: var(--one-focus-width) solid var(--one-color-focus);
  outline-offset: var(--one-focus-offset);
  box-shadow: 0 0 0 var(--one-focus-offset) var(--one-color-focus-gap);
}
`
}

export function add(dir: string, names: string[], requested: Mode | undefined, dryRun: boolean) {
  const entries = select(names)
  const plan = new ProjectFiles(dir)
  const config = readConfig(plan.root)
  const mode = requested ?? (config?.platforms.includes('react') ? 'react' : 'web')
  styles(plan, config)
  notices(plan)
  const folder = 'src/components/one-ui/'
  const usage = []
  if (mode === 'web') {
    plan.put(folder + 'one-ui-web.bundle.js', '/* ' + license + ' */\n' + asset('one-ui-web.bundle.js'))
    usage.push('Serve the generated HTML files with your project, or copy their module import and component tag into your page.')
  } else if (mode === 'react') {
    usage.push('Install @one-ui/core and @one-ui/react from source with React and React DOM 18 or later. See https://github.com/chai-in/one-ui-framework#install-the-web-or-react-package-from-source. Import the local component in your application.')
  } else {
    usage.push('Import the generated stylesheet and apply its data-one-component attribute to your native control.')
  }
  for (const entry of entries) {
    const name = componentName(entry)
    const path = folder + entry.slug
    if (mode === 'web') {
      plan.put(path + '.html', `<!doctype html>
<!-- ${license} -->
<html lang="en" data-one-preset="${config?.preset ?? 'default'}" data-one-motion="${config?.motion ?? 'calm'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${entry.name}</title>
  <link rel="stylesheet" href="../../styles/one-ui.css">
  <script type="module">
    import { registerOneUI } from './one-ui-web.bundle.js'
    registerOneUI()
  </script>
</head>
<body>
  ${htmlElement(entry)}
</body>
</html>
`)
    } else if (mode === 'react') {
      plan.put(path + '.tsx', `// ${license}\n'use client'\n\nimport '../../styles/one-ui.css'\nimport '@one-ui/react/styles.css'\nexport { ${name}, ${name} as default } from '@one-ui/react'\n`)
    } else {
      plan.put(path + '.css', skin(entry))
    }
  }
  return { ...plan.finish(dryRun), mode, components: entries.map(e => e.slug), usage }
}
