// SPDX-License-Identifier: AGPL-3.0-only
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('../skills/one-ui/scripts/report_feedback.py', import.meta.url))
const python = execFileSync('python3', ['-c', 'import sys; print(sys.executable)'], { encoding: 'utf8' }).trim()
const repo = 'chai-in/one-ui-framework'
const issueUrl = number => `https://github.com/${repo}/issues/${number}`
const fields = [
  '--title', 'Sticky footer clips keyboard focus ring',
  '--kind', 'bug',
  '--area', 'a11y,tokens,a11y',
  '--platform', 'web,apple',
  '--law', 'ONE-11',
  '--source-project', 'Generic settings app',
  '--context', 'At 200% zoom, keyboard focus reaches the final footer action.',
  '--proposal', 'Reserve enough space for the full ring.',
  '--acceptance', 'Tab keeps the full ring visible.',
]

function issue(number, title, body = '', extra = {}) {
  return {
    number, title, body, html_url: issueUrl(number), updated_at: '2026-01-01T00:00:00Z',
    labels: [{ name: 'design-feedback' }, { name: 'a11y' }],
    ...extra,
  }
}

function setup(t, fixture = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'one ui feedback-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const env = {
    ...process.env,
    HOME: directory,
    USERPROFILE: directory,
    PATH: directory,
    ONE_UI_TEST_NODE: process.execPath,
    ONE_UI_TEST_MOCK: join(directory, 'gh.cjs'),
    ONE_UI_TEST_FIXTURE: JSON.stringify(fixture),
    ONE_UI_TEST_LOG: join(directory, 'invocations.jsonl'),
  }
  writeFileSync(join(directory, 'gh'), '#!/bin/sh\nexec "$ONE_UI_TEST_NODE" "$ONE_UI_TEST_MOCK" "$@"\n',
    { mode: 0o700 })
  writeFileSync(env.ONE_UI_TEST_MOCK, `
    const { appendFileSync, readFileSync } = require('node:fs')
    const args = process.argv.slice(2)
    const options = JSON.parse(process.env.ONE_UI_TEST_FIXTURE)
    const body = readFileSync(0, 'utf8')
    appendFileSync(process.env.ONE_UI_TEST_LOG, JSON.stringify({ args, body }) + '\\n')
    if (options.status) process.exit(options.status)
    if (args[0] === 'api') console.log(JSON.stringify(options.pages ?? [[]]))
    else if (args[0] === 'repo') console.log(JSON.stringify({ viewerPermission: options.permission ?? 'WRITE' }))
    else if (args[1] === 'view') console.log(JSON.stringify(options.target))
    else if (args[1] === 'create') console.log(${JSON.stringify(issueUrl(12))})
    else if (args[1] === 'comment') console.log(${JSON.stringify(issueUrl(8) + '#issuecomment-1')})
    else process.exit(99)
  `)
  return {
    directory, env,
    run: (...args) => spawnSync(python, [script, ...args], { env, encoding: 'utf8' }),
    calls: () => existsSync(env.ONE_UI_TEST_LOG)
      ? readFileSync(env.ONE_UI_TEST_LOG, 'utf8').trim().split('\n').map(line => JSON.parse(line))
      : [],
    drafts: join(directory, '.one-ui/pending-feedback'),
  }
}

test('feedback dry-run previews matching labels and fields without contacting gh', t => {
  const cli = setup(t)
  const result = cli.run(...fields, '--dry-run')
  assert.equal(result.status, 0, result.stderr)
  assert.ok(result.stdout.includes(`Dry run for ${repo}.`))
  assert.match(result.stdout, /Labels: design-feedback, baseline-improvement, bug, a11y, tokens, platform:web, platform:apple\n/)
  assert.match(result.stdout, /### Kind\n\nbug\n/)
  assert.match(result.stdout, /### One UI rule\n\nONE-11\n/)
  assert.match(result.stdout, /### Source project\n\nGeneric settings app\n/)
  assert.match(result.stdout, /### Acceptance criteria\n\nTab keeps the full ring visible\./)
  const docs = cli.run('--title', 'Clarify focus documentation', '--kind', 'docs', '--area', 'agent-ergonomics',
    '--platform', 'cross-platform', '--context', 'Unclear guidance.', '--proposal', 'Clarify it.', '--dry-run')
  assert.equal(docs.status, 0, docs.stderr)
  assert.match(docs.stdout, /Labels: design-feedback, agent-ergonomics\n/)
  assert.match(docs.stdout, /### Platform\n\ncross-platform/)
  const a11y = cli.run('--title', 'Keep the focus ring visible', '--kind', 'a11y',
    '--context', 'Some actions clip focus.', '--proposal', 'Reserve space.', '--dry-run')
  assert.equal(a11y.status, 0, a11y.stderr)
  assert.match(a11y.stdout, /Labels: design-feedback, baseline-improvement, a11y\n/)
  assert.deepEqual(cli.calls(), [])
  assert.equal(existsSync(cli.drafts), false)
})

test('feedback rejects possible credentials before output, drafts, or gh calls', t => {
  const cli = setup(t)
  for (const [field, credential] of [
    ['--title', 'gho_FAKEPATTERN'],
    ['--context', 'ghp_FAKEPATTERN'],
    ['--proposal', 'sk-FAKEPATTERN'],
    ['--acceptance', 'AKIAFAKEPATTERN'],
    ['--source-project', '-----BEGIN RSA PRIVATE KEY-----'],
    ['--context', 'Bearer FAKEPATTERN'],
  ]) {
    const args = [...fields]
    args[args.indexOf(field) + 1] = credential
    const result = cli.run(...args, '--dry-run')
    assert.equal(result.status, 2, result.stderr)
    assert.match(result.stderr, /possible credential/)
    assert.ok(!(result.stdout + result.stderr).includes(credential))
  }
  const search = cli.run('--search', 'Bearer FAKEPATTERN')
  assert.equal(search.status, 2)
  const overridden = cli.run('--context', 'Bearer FAKEPATTERN', ...fields)
  assert.equal(overridden.status, 2)
  assert.deepEqual(cli.calls(), [])
  assert.equal(existsSync(cli.drafts), false)
})

test('feedback lists and searches all open issue pages and excludes pull requests', t => {
  const cli = setup(t, { pages: [
    [issue(9, 'A motion proposal', null, { pull_request: {} }), issue(8, 'Keep focus visible', 'Check keyboard focus in sticky footers.')],
    [issue(7, 'Token for focus ring', 'Use a shared ring inset.')],
  ] })
  const list = cli.run('--list', '--label', 'a11y', '--limit', '1', '--json')
  assert.equal(list.status, 0, list.stderr)
  assert.deepEqual(JSON.parse(list.stdout).map(({ number }) => number), [8])
  const search = cli.run('--search', 'sticky keyboard')
  assert.equal(search.status, 0, search.stderr)
  assert.match(search.stdout, /#8 Keep focus visible/)
  assert.doesNotMatch(search.stdout, /#7|#9/)
  const all = cli.run('--list')
  assert.equal(all.status, 0, all.stderr)
  assert.match(all.stdout, /#7 Token for focus ring/)
  assert.doesNotMatch(all.stdout, /#9/)
  const [filtered, unfiltered] = cli.calls()
  assert.ok(filtered.args.includes('--paginate'))
  assert.ok(filtered.args.includes('state=open'))
  assert.ok(filtered.args.includes('labels=design-feedback,a11y'))
  assert.ok(unfiltered.args.includes('labels=design-feedback'))
})

test('feedback stops for overlapping open issues and only overrides when requested', t => {
  const cli = setup(t, { pages: [[
    issue(8, 'Keyboard focus ring clips in sticky footer'),
    issue(7, 'Show confirmation progress'),
  ]] })
  const duplicate = cli.run(...fields)
  assert.equal(duplicate.status, 3, duplicate.stderr)
  assert.match(duplicate.stderr, /Possible duplicates/)
  assert.match(duplicate.stdout, /#8/)
  assert.doesNotMatch(duplicate.stdout, /#7/)
  assert.deepEqual(cli.calls().map(({ args }) => args[0]), ['api'])
  const forced = cli.run(...fields, '--force-new')
  assert.equal(forced.status, 0, forced.stderr)
  assert.equal(forced.stdout.trim(), issueUrl(12))
  const [, permission, submission] = cli.calls()
  assert.deepEqual(permission.args, ['repo', 'view', repo, '--json', 'viewerPermission'])
  assert.deepEqual(submission.args.slice(0, 3), ['issue', 'create', `--title=${fields[1]}`])
  assert.deepEqual(submission.args.slice(-4), ['--repo', repo, '--body-file', '-'])
  assert.deepEqual(submission.args.flatMap((arg, index, args) => arg === '--label' ? [args[index + 1]] : []),
    ['design-feedback', 'baseline-improvement', 'bug', 'a11y', 'tokens', 'platform:web', 'platform:apple'])
  assert.match(submission.body, /### Proposal\n\nReserve enough space/)
})

test('feedback checks for duplicates before creating a distinct issue', t => {
  const cli = setup(t, { pages: [[issue(7, 'Show confirmation progress')]] })
  const result = cli.run(...fields)
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout.trim(), issueUrl(12))
  assert.deepEqual(cli.calls().map(({ args }) => args.slice(0, 2)),
    [['api', '--hostname'], ['repo', 'view'], ['issue', 'create']])
})

test('outside contributors get a local draft and the selected issue form without publishing', t => {
  const cli = setup(t, { permission: 'READ' })
  const fork = 'example/one-ui-fork'
  const preview = cli.run(...fields, '--repo', fork, '--dry-run')
  assert.equal(preview.status, 0, preview.stderr)
  assert.ok(preview.stdout.includes(`Dry run for ${fork}.`))
  assert.deepEqual(cli.calls(), [])

  const invalid = cli.run('--list', '--repo', 'example/..')
  assert.equal(invalid.status, 2)
  assert.deepEqual(cli.calls(), [])

  const result = cli.run(...fields, '--repo', fork)
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stderr, /without write access/)
  assert.ok(result.stdout.includes(`https://github.com/${fork}/issues/new?template=design-feedback.yml`))
  assert.doesNotMatch(result.stdout, /rerun:/)
  const [name] = readdirSync(cli.drafts)
  assert.match(readFileSync(join(cli.drafts, name), 'utf8'), /### Context\n\nAt 200% zoom/)
  const [search, permission] = cli.calls()
  assert.deepEqual(cli.calls().map(({ args }) => args[0]), ['api', 'repo'])
  assert.ok(search.args.includes(`repos/${fork}/issues`))
  assert.deepEqual(permission.args, ['repo', 'view', fork, '--json', 'viewerPermission'])
})

test('feedback comments only on open design-feedback issues', t => {
  const labels = [{ name: 'design-feedback' }]
  const args = ['--comment-on', '8', '--context', 'Also occurs in a scrollable dialog.',
    '--proposal', 'Reserve focus ring space there too.', '--source-project', 'Generic settings app']
  const open = setup(t, { target: { state: 'OPEN', labels } })
  const preview = open.run(...args, '--dry-run')
  assert.equal(preview.status, 0, preview.stderr)
  assert.match(preview.stdout, /Comment on #8/)
  assert.deepEqual(open.calls(), [])
  const posted = open.run(...args)
  assert.equal(posted.status, 0, posted.stderr)
  assert.equal(posted.stdout.trim(), issueUrl(8) + '#issuecomment-1')
  const [view, comment] = open.calls()
  assert.deepEqual(view.args, ['issue', 'view', '8', '--repo', repo, '--json', 'state,labels'])
  assert.deepEqual(comment.args, ['issue', 'comment', '8', '--repo', repo, '--body-file', '-'])
  assert.match(comment.body, /### Context\n\nAlso occurs in a scrollable dialog/)
  for (const target of [{ state: 'CLOSED', labels }, { state: 'OPEN', labels: [] }]) {
    const cli = setup(t, { target })
    const result = cli.run(...args)
    assert.equal(result.status, 1, result.stderr)
    assert.match(result.stderr, /is not an open design-feedback issue/)
    assert.equal(cli.calls().length, 1)
    assert.equal(existsSync(cli.drafts), false)
  }
})

test('missing gh saves a private Markdown draft with a duplicate-safe retry command', t => {
  const cli = setup(t)
  const offline = spawnSync(python, [script, ...fields], { env: { ...cli.env, PATH: '' }, encoding: 'utf8' })
  assert.equal(offline.status, 0, offline.stderr)
  assert.match(offline.stderr, /GitHub CLI \(gh\) is unavailable/)
  const [name, ...others] = readdirSync(cli.drafts)
  assert.match(name, /^feedback-.*\.md$/)
  assert.deepEqual(others, [])
  const draft = join(cli.drafts, name)
  assert.equal(statSync(draft).mode & 0o777, 0o600)
  assert.match(readFileSync(draft, 'utf8'), /# Sticky footer clips keyboard focus ring\n\nLabels: design-feedback/)
  assert.ok(offline.stdout.includes(draft))
  const command = offline.stdout.split('rerun:\n')[1].trim()
  const posted = execFileSync('/bin/sh', ['-c', command], { env: cli.env, encoding: 'utf8' })
  assert.equal(posted.trim(), issueUrl(12))
  assert.deepEqual(cli.calls().map(({ args }) => args.slice(0, 2)),
    [['api', '--hostname'], ['repo', 'view'], ['issue', 'create']])
})

test('unauthenticated gh preserves comment evidence locally and list exits with an error', t => {
  const cli = setup(t, { status: 4 })
  const result = cli.run('--comment-on', '8', '--context', 'Safe follow-up evidence.')
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stderr, /requires authentication/)
  assert.match(result.stdout, /--comment-on 8/)
  const draft = readFileSync(join(cli.drafts, readdirSync(cli.drafts)[0]), 'utf8')
  assert.ok(draft.startsWith(`# Follow-up for ${repo}#8\n`))
  assert.match(draft, /### Context\n\nSafe follow-up evidence\./)
  const list = cli.run('--list')
  assert.equal(list.status, 1, list.stderr)
  assert.match(list.stderr, /requires authentication/)
  assert.deepEqual(cli.calls().map(({ args }) => args.slice(0, 2)), [['issue', 'view'], ['api', '--hostname']])
})
