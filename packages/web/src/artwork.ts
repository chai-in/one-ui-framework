import type { ControlSlug, MomentSlug } from '@one-ui/core'

const path = (d: string, part = 'moving') => `<path class="${part}" d="${d}"/>`
const circle = (x: number, y: number, r: number, part = 'moving') => `<circle class="${part}" cx="${x}" cy="${y}" r="${r}"/>`
const rect = (x: number, y: number, w: number, h: number, r: number, part = 'moving') =>
  `<rect class="${part}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`
const repeat = (count: number, draw: (i: number) => string) => Array.from({ length: count }, (_, i) =>
  `<g style="--one-index:${i}">${draw(i)}</g>`).join('')
const track = rect(6, 9, 52, 22, 11, 'track')
const line = path('M6 20H58', 'line')
const lens = circle(27, 16, 10, 'outline') + path('M35 24l12 12', 'line')
const art: Record<MomentSlug, string> = {
  'bars-fade': repeat(6, i => rect(6 + 9*i, 8, 5, 24, 2)),
  'bloom-toggle': repeat(6, i => `<g transform="rotate(${60*i} 32 20)">${circle(32, 12, 6, 'petal')}</g>`) + circle(32, 20, 6, 'solid'),
  'snap-grid': repeat(4, i => rect(16 + i%2*17, 4 + Math.floor(i/2)*17, 13, 13, 2)),
  'card-fan': rect(19, 4, 26, 32, 3) + path('M25 13h14m-14 5h9', 'cut'),
  'gooey-tab-bar': track + circle(32, 20, 8),
  'blocks-scale': repeat(5, i => rect(3 + i*12, 15, 10, 10, 2)),
  'stretch-toggle': track + rect(10, 12, 18, 16, 8),
  'merge-drops': circle(17, 20, 9, 'drop-left') + circle(47, 20, 10, 'drop-right'),
  'paper-plane': path('M7 20L56 4 37 35l-8-10-9 6 3-10z') + path('M23 21L49 9', 'cut'),
  'detent-dial': circle(32, 20, 17, 'track') + path('M30 6h4v14h-4z'),
  'domino-row': repeat(6, i => rect(4 + 10*i, 9, 5, 23, 2)),
  'pebble-rating': path('M12 24Q10 13 25 9Q41 2 50 16Q60 35 33 35Q15 36 12 24Z'),
  'jelly-pad': rect(11, 6, 42, 28, 8),
  'swipe-confirm': track + path('M11 20l8-8 8 8-8 8z'),
  'bookmark': path('M20 4h24v32l-12-9-12 9z'),
  'depth-stack': rect(12, 11, 34, 23, 3, 'track') + rect(18, 6, 34, 23, 3),
  'menu-morph': path('M13 10h38', 'line bar-a') + path('M13 20h38', 'line bar-b') + path('M13 30h38', 'line bar-c'),
  'elastic-string': path('M4 20Q32 20 60 20', 'line string') + circle(32, 20, 3),
  'ripple-pad': circle(32, 20, 15, 'outline moving') + circle(32, 20, 5, 'solid'),
  'worm-dots': rect(22, 13, 20, 14, 7),
  'download-ring': circle(32, 20, 16, 'outline track-ring') + '<circle class="meter" cx="32" cy="20" r="16" pathLength="1"/>' + path('M32 12v14m-6-6 6 6 6-6', 'line'),
  'leaf-tabs': path('M13 32Q10 4 51 6Q51 35 13 32z') + path('M17 28L44 12', 'cut'),
  'bell-toggle': path('M17 27q6-5 6-14a9 9 0 0 1 18 0q0 9 6 14z') + circle(32, 31, 3, 'solid'),
  'ink-switch': track + circle(18, 20, 8),
  'rocker-switch': track + rect(12, 13, 40, 14, 5),
  'scrub-wave': repeat(15, i => { const h = 6 + Math.abs(Math.sin(i * 1.8))*23; return rect(3+i*4, 20-h/2, 2, h, 1, 'track') }) + rect(3, 3, 3, 34, 1),
  'squash-play': path('M22 5l26 15-26 15z', 'play') + path('M20 6h8v28h-8zm16 0h8v28h-8z', 'pause'),
  'rubber-search': lens,
  'odometer': '',
  'tide-progress': rect(6, 4, 52, 32, 4, 'track') + path('M6 5q9-5 17 0t17 0t18 0v31H6z'),
  'eclipse-half': circle(32, 20, 15, 'solid') + circle(14, 13, 14, 'moon'),
  'magnet-grid': repeat(4, i => circle(24+i%2*16, 12+Math.floor(i/2)*16, 5)),
  'checklist': rect(17, 5, 30, 30, 5, 'track') + path('M23 20l6 6 13-14', 'line tick'),
  'flip-coin': circle(32, 20, 17, 'moving') + path('M32 10l6 10-6 10-6-10z', 'cut'),
  'radial-menu': repeat(5, i => `<g transform="rotate(${72*i} 32 20)">${circle(32, 7, 3, 'satellite')}</g>`) + circle(32, 20, 5, 'solid'),
  'dot-revolve': circle(32, 20, 14, 'outline track-ring') + circle(32, 6, 4),
}

export function artwork(slug: MomentSlug | ControlSlug) {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  icon.setAttribute('class', 'one-art')
  icon.setAttribute('viewBox', '0 0 64 40')
  icon.setAttribute('aria-hidden', 'true')
  icon.setAttribute('focusable', 'false')
  // Only closed, author-defined SVG shapes enter this template.
  icon.innerHTML = art[slug as MomentSlug] ?? ''
  return icon
}
