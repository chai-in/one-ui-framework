/** OKLCH lightness in [0,1], nonnegative chroma, hue in degrees. */
export interface Oklch { l: number; c: number; h: number }
export type ContrastKind = 'text' | 'ui'

function linearRgb(hex: string): [number, number, number] {
  if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) throw new TypeError('An opaque #RGB or #RRGGBB color is required.')
  const digits = hex.length === 4 ? hex.slice(1).replace(/./g, c => c + c) : hex.slice(1)
  const rgb = Number.parseInt(digits, 16)
  return [linearize(rgb >>> 16), linearize((rgb >>> 8) & 255), linearize(rgb & 255)]
}

function linearize(byte: number) {
  const v = byte / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = linearRgb(hex)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(fg: string, bg: string): number {
  const a = relativeLuminance(fg)
  const b = relativeLuminance(bg)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

export function meetsWcagAA(fg: string, bg: string, kind: ContrastKind = 'text'): boolean {
  return contrastRatio(fg, bg) >= (kind === 'text' ? 4.5 : 3)
}

export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = linearRgb(hex)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  if (r === g && g === b) return { l: lightness, c: 0, h: 0 }
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const blueYellow = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return { l: lightness, c: Math.hypot(a, blueYellow), h: (Math.atan2(blueYellow, a) * 180 / Math.PI + 360) % 360 }
}

/** Convert to 8-bit sRGB, clipping out-of-gamut channels before encoding. */
export function oklchToHex({ l, c, h }: Oklch): string {
  if (!(l >= 0 && l <= 1) || !Number.isFinite(c) || c < 0 || !Number.isFinite(h)) throw new RangeError('Invalid OKLCH color.')
  const angle = (h % 360) * Math.PI / 180
  const a = c * Math.cos(angle)
  const b = c * Math.sin(angle)
  const long = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const medium = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const short = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const channels = [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  ]
  return '#' + channels.map(channel => {
    const v = Math.max(0, Math.min(1, channel))
    const encoded = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055
    return Math.round(encoded * 255).toString(16).padStart(2, '0')
  }).join('')
}
