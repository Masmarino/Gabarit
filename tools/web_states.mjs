#!/usr/bin/env node
// What tools/states_check.py does for GTK and WinUI, for the web, on the compiled CSS: every clickable selector has its
// hover and its press, and every transition or animation stops under reduced motion, selector by selector (a rule of
// lower specificity would not stop it). A modifier (`__wash--a`) counts as its base: same specificity, and the media
// query comes later.
import { readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import * as sass from 'sass'

const LIB = join(dirname(fileURLToPath(import.meta.url)), '../projects/gabarit')

// Clickable, but what answers is inside or elsewhere.
const NO_STATES = new Map([
  ['.gbt-popover__trigger', 'wraps the application’s own control'],
  ['input[type]', 'its thumb answers, in pseudo-elements'],
])

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (/^(node_modules|fonts|\.storybook)$/.test(name)) return []
    if (statSync(path).isDirectory()) return walk(path)
    return name.endsWith('.scss') &&
      (!name.startsWith('_') || name === '_utilities.scss') &&
      name !== 'index.scss'
      ? [path]
      : []
  })

const STATES =
  /:(hover|active|focus-visible|focus-within|focus|disabled|not\([^()]*(\([^()]*\))?[^()]*\))/g
// A value doesn't weigh in specificity: `[data-edge]` stops `[data-edge='left']`.
const bare = (selector) =>
  selector
    .replace(STATES, '')
    .replace(/\[([\w-]+)=[^\]]*\]/g, '[$1]')
    .replace(/\s+/g, ' ')
    .trim()
const covers = (set, selector) =>
  [...set].some(
    (other) => other === selector || other.includes(selector) || selector.endsWith(other),
  )
const stops = (set, selector) => {
  const base = selector.replace(/--[\w-]+$/, '')
  return [...set].some(
    (other) => other === selector || other === base || other.endsWith(` ${selector}`),
  )
}

const errors = []
for (const file of walk(LIB)) {
  const name = relative(LIB, file)
  const clickable = new Set()
  const hover = new Set()
  const press = new Set()
  const moving = new Set()
  const still = new Set()
  postcss.parse(sass.compile(file).css).walkRules((rule) => {
    const media = rule.parent.type === 'atrule' ? rule.parent.params : ''
    const declares = (test) => rule.some((d) => d.type === 'decl' && test(d))
    const moves = declares(
      (d) =>
        (d.prop === 'transition' || d.prop === 'animation' || d.prop === 'animation-name') &&
        d.value !== 'none',
    )
    for (const selector of rule.selectors) {
      if (/::(?!ng-deep)/.test(selector)) continue
      const plain = bare(selector)
      if (/:hover/.test(selector)) hover.add(plain)
      if (/:active/.test(selector)) press.add(plain)
      if (declares((d) => d.prop === 'cursor' && d.value === 'pointer')) clickable.add(plain)
      if (/prefers-reduced-motion: reduce/.test(media)) {
        if (declares((d) => /^(transition|animation)/.test(d.prop))) still.add(plain)
      } else if (moves && !/prefers-reduced-motion: no-preference/.test(media)) {
        moving.add(plain)
      }
    }
  })
  for (const selector of clickable) {
    if (NO_STATES.has(selector)) continue
    if (!covers(hover, selector)) errors.push(`${name}: ${selector} has no hover`)
    if (!covers(press, selector)) errors.push(`${name}: ${selector} has no press`)
  }
  for (const selector of moving) {
    if (!stops(still, selector)) errors.push(`${name}: ${selector} moves under reduced motion`)
  }
}

for (const error of errors) console.error(error)
if (errors.length) process.exit(1)
console.log('Web: every control answers the pointer and keeps still when asked')
