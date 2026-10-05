import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export type ControlHeightTier = 'sm' | 'md' | 'lg'

const SEMANTIC_TOKENS = join(process.cwd(), 'projects/gabarit/src/lib/tokens/_semantic.scss')

/**
 * The px value of a `--gbt-control-height-*` token, read from `tokens/_semantic.scss` (1rem = 16px).
 */
export function controlHeightPx(tier: ControlHeightTier): number {
  const semantic = readFileSync(SEMANTIC_TOKENS, 'utf8')
  const match = semantic.match(new RegExp(`--gbt-control-height-${tier}:\\s*([\\d.]+)rem;`))
  if (!match) {
    throw new Error(`--gbt-control-height-${tier} is not defined in rem in _semantic.scss`)
  }
  return Number(match[1]) * 16
}

/** jsdom doesn't resolve var(), so this turns `var(--gbt-control-height-md)` (or a px value) into pixels for specs. */
export function resolveControlHeight(computed: string): number {
  const token = computed.match(/^var\(--gbt-control-height-(sm|md|lg)\)$/)
  if (token) {
    return controlHeightPx(token[1] as ControlHeightTier)
  }
  const px = computed.match(/^([\d.]+)px$/)
  if (px) {
    return Number(px[1])
  }
  throw new Error(`not a control height: '${computed}'`)
}
