import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { controlHeightPx } from '../../testing/control-height'

const COMPONENTS = join(process.cwd(), 'projects/gabarit/src/lib/components')
const read = (file: string) => readFileSync(join(COMPONENTS, file), 'utf8')

/** The declarations of the first rule whose selector is exactly `selector` (nested rules left out). */
function ruleBody(source: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const found = new RegExp(`^[ \\t]*${escaped} \\{`, 'm').exec(source)
  if (!found) {
    throw new Error(`no rule '${selector}'`)
  }
  let depth = 0
  let body = ''
  for (let i = source.indexOf('{', found.index); i < source.length; i++) {
    const ch = source[i]
    if (ch === '{') {
      depth++
      if (depth === 1) continue
    } else if (ch === '}') {
      depth--
      if (depth === 0) return body
    }
    if (depth === 1) body += ch
  }
  throw new Error(`unclosed rule '${selector}'`)
}

// jsdom lays nothing out, so these read the stylesheets: every single-line control takes its height
// from the shared scale, so controls of one tier line up (measured in Storybook, see the AUDITs).
describe('control heights', () => {
  it('resolves the scale to 32 / 38 / 44px', () => {
    expect(controlHeightPx('sm')).toBe(32)
    expect(controlHeightPx('md')).toBe(38)
    expect(controlHeightPx('lg')).toBe(44)
  })

  it.each([
    ['atoms/input/input.scss', 'input', 'height', 'md'],
    ['atoms/input/input.scss', '&--sm input', 'height', 'sm'],
    ['molecules/select/select.scss', '.gbt-select__trigger', 'height', 'md'],
    ['molecules/select/select.scss', ':host(.gbt-select--sm) .gbt-select__trigger', 'height', 'sm'],
    ['molecules/autocomplete/autocomplete.scss', '.gbt-autocomplete__input', 'height', 'md'],
    ['molecules/date-picker/date-picker.scss', '.gbt-date-picker__trigger', 'height', 'md'],
    [
      'molecules/date-range-picker/date-range-picker.scss',
      '.gbt-date-range-picker__trigger',
      'height',
      'md',
    ],
    ['molecules/tag-input/tag-input.scss', '.gbt-tag-input__field', 'min-height', 'md'],
    ['molecules/list-toolbar/list-toolbar.scss', '.gbt-list-toolbar__direction', 'height', 'md'],
    ['molecules/list-toolbar/list-toolbar.scss', '.gbt-list-toolbar__direction', 'width', 'md'],
    ['molecules/copy-field/copy-field.scss', '.gbt-copy-field__value', 'min-height', 'sm'],
    ['molecules/secret-reveal/secret-reveal.scss', '.gbt-secret-reveal__value', 'min-height', 'sm'],
  ])('%s: `%s` takes its %s from the %s control height', (file, selector, property, tier) => {
    expect(ruleBody(read(file), selector)).toMatch(
      new RegExp(`(^|[\\s;])${property}:\\s*var\\(--gbt-control-height-${tier}\\);`),
    )
  })

  it('makes the segmented control, track included, the sm control height', () => {
    // The option is the control height minus the track's 2px padding on each side.
    const scss = read('molecules/segmented-control/segmented-control.scss')
    expect(ruleBody(scss, '.gbt-segmented-control')).toMatch(/\spadding: 2px;/)
    expect(ruleBody(scss, '.gbt-segmented-control__option')).toMatch(
      /\smin-height: calc\(var\(--gbt-control-height-sm\) - 4px\);/,
    )
    // `size="sm"` keeps that height: only its text and sides shrink.
    expect(ruleBody(scss, '.gbt-segmented-control--sm .gbt-segmented-control__option')).not.toMatch(
      /height/,
    )
  })

  it.each([
    'atoms/input/input.scss',
    'molecules/select/select.scss',
    'molecules/autocomplete/autocomplete.scss',
    'molecules/date-picker/date-picker.scss',
    'molecules/date-range-picker/date-range-picker.scss',
    'molecules/tag-input/tag-input.scss',
    'molecules/list-toolbar/list-toolbar.scss',
  ])('%s hard-codes none of the old control heights', (file) => {
    expect(read(file)).not.toMatch(/(^|\s)(min-)?height:\s*(40px|35px|2\.5rem|2\.1875rem);/m)
  })
})
