import { linkSync, lstatSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

export const dist = fileURLToPath(new URL('./', import.meta.url))
export const asset = (name: string) => readFileSync(join(dist, 'assets', name), 'utf8')
export const license = 'SPDX-License-Identifier: AGPL-3.0-only'

export function read(path: string): string | undefined {
  try {
    return readFileSync(path, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

interface Change {
  path: string
  previous?: string
  content: string
}

// Preflight the entire request before creating any files. An interrupted install
// can be retried because identical files are skipped and replacements are atomic.
export class ProjectFiles {
  readonly root: string
  readonly changes: Change[] = []

  constructor(root: string) {
    this.root = resolve(root)
  }

  put(path: string, content: string, replace = false) {
    const target = resolve(this.root, path)
    const inside = relative(this.root, target)
    if (!inside || inside === '..' || inside.startsWith('..' + sep) || isAbsolute(inside)) throw new Error('File path must be inside project')
    for (let current = target; current !== this.root; current = dirname(current)) {
      const stat = lstatSync(current, { throwIfNoEntry: false })
      if (stat?.isSymbolicLink()) throw new Error(`Refusing to write through symbolic link ${current}`)
      if (stat && current !== target && !stat.isDirectory()) throw new Error(`Expected a directory at ${current}`)
    }
    const previous = read(target)
    if (previous !== undefined && previous !== content && !replace) {
      throw new Error(`Existing file differs: ${path}. Move or merge it before retrying.`)
    }
    this.changes.push({ path, previous, content })
  }

  finish(dryRun: boolean) {
    const files = this.changes.map(({ path, previous, content }) => ({
      path, status: previous === content ? 'current' : previous === undefined ? 'create' : 'update',
    }))
    if (!dryRun) {
      for (const { path, previous, content } of this.changes) {
        if (previous === content) continue
        const target = join(this.root, path)
        mkdirSync(dirname(target), { recursive: true })
        const temporary = `${target}.${randomUUID()}.tmp`
        try {
          const mode = previous === undefined ? undefined : lstatSync(target).mode
          writeFileSync(temporary, content, { flag: 'wx', mode })
          if (previous === undefined) {
            linkSync(temporary, target)
          } else {
            if (read(target) !== previous) throw new Error(`File changed while installing: ${path}`)
            renameSync(temporary, target)
          }
        } finally {
          rmSync(temporary, { force: true })
        }
      }
    }
    return { directory: this.root, dryRun, files }
  }
}

export function notices(plan: ProjectFiles) {
  for (const name of ['LICENSE', 'NOTICE.md']) {
    plan.put('one-ui/' + name, readFileSync(join(dist, name), 'utf8'))
  }
}
