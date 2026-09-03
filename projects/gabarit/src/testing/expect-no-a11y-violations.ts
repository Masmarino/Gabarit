import axe from 'axe-core'

export async function expectNoA11yViolations(element: HTMLElement): Promise<void> {
  const results = await axe.run(element, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },

    rules: { 'color-contrast': { enabled: false } },
  })
  if (results.violations.length > 0) {
    const detail = results.violations
      .map(
        (v) =>
          `${v.id} (${v.impact}) — ${v.help}\n    ${v.nodes.map((n) => n.html).join('\n    ')}`,
      )
      .join('\n  ')
    throw new Error(`Accessibility violations:\n  ${detail}`)
  }
}
