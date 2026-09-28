import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { JobGraph } from '../../molecules/job-graph/job-graph'
import type { JobGraphStage } from '../../molecules/job-graph/job-graph.types'
import { JobStatus, JobStatusValue } from './job-status'

const STATUSES: JobStatusValue[] = ['pending', 'running', 'success', 'failed', 'canceled']

function setup(inputs: Record<string, unknown>) {
  const fixture = TestBed.createComponent(JobStatus)
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value)
  }
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return { fixture, root }
}

describe('JobStatus', () => {
  it('draws a check for success, an alert for failed and a cross for canceled: three different glyphs', () => {
    const shapes = ['success', 'failed', 'canceled'].map((status) => {
      const { root } = setup({ status })
      expect(root.querySelector('gbt-icon'), status).not.toBeNull()
      expect(root.querySelector('.gbt-job-status__dot'), status).toBeNull()
      return Array.from(root.querySelectorAll('gbt-icon path'))
        .map((p) => p.getAttribute('d'))
        .join('|')
    })

    expect(shapes.every(Boolean)).toBe(true)
    expect(new Set(shapes).size).toBe(3)
  })

  it('draws a ring for pending and running, with no icon', () => {
    for (const status of ['pending', 'running']) {
      const { root } = setup({ status })
      expect(root.querySelector('.gbt-job-status__dot'), status).not.toBeNull()
      expect(root.querySelector('gbt-icon'), status).toBeNull()
    }
  })

  it('carries its status as data-status on the host', () => {
    for (const status of STATUSES) {
      expect(setup({ status }).root.getAttribute('data-status')).toBe(status)
    }
  })

  it('is hidden from assistive technology without a label', () => {
    const { root } = setup({ status: 'success' })

    expect(root.getAttribute('aria-hidden')).toBe('true')
    expect(root.querySelector('.sr-only')).toBeNull()
  })

  it('says the status in hidden text with a label, keeping the glyph decorative', () => {
    const { root } = setup({ status: 'failed', label: 'Failed' })

    expect(root.hasAttribute('aria-hidden')).toBe(false)
    expect(root.querySelector('.sr-only')?.textContent).toBe('Failed')
    expect(root.querySelector('.gbt-job-status__glyph')?.getAttribute('aria-hidden')).toBe('true')
    expect(root.querySelector('.gbt-job-status__glyph gbt-icon')).not.toBeNull()
  })

  it('stops the running ring under prefers-reduced-motion (asserted on the stylesheet)', () => {
    const scss = readFileSync(
      join(process.cwd(), 'projects/gabarit/src/lib/components/atoms/job-status/job-status.scss'),
      'utf8',
    )
    expect(scss).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*animation: none/)
    expect(scss).toContain('border-top-color: var(--primary)')
  })

  it('has no accessibility violations (every status, with and without a label)', async () => {
    for (const status of STATUSES) {
      await expectNoA11yViolations(setup({ status }).root)
      await expectNoA11yViolations(setup({ status, label: status }).root)
    }
  })
})

describe('gbt-job-graph draws its nodes with JobStatus', () => {
  const STAGES: JobGraphStage[] = [
    {
      name: 'build',
      jobs: STATUSES.map((status, i) => ({ id: `j${i}`, name: status, status, needs: [] })),
    },
  ]

  function graph() {
    const fixture = TestBed.createComponent(JobGraph)
    fixture.componentRef.setInput('stages', STAGES)
    fixture.detectChanges()
    return fixture.nativeElement as HTMLElement
  }

  it('renders one hidden gbt-job-status per node, in the old glyph position', () => {
    const root = graph()
    const glyphs = Array.from(root.querySelectorAll('button.gbt-job-graph__node > [data-glyph]'))

    expect(glyphs.length).toBe(5)
    for (const glyph of glyphs) {
      expect(glyph.tagName).toBe('GBT-JOB-STATUS')
      expect(glyph.classList.contains('gbt-job-graph__glyph')).toBe(true)
      expect(glyph.getAttribute('aria-hidden')).toBe('true')
      expect(glyph.querySelector('.sr-only')).toBeNull()
    }
    expect(glyphs.map((g) => g.getAttribute('data-status'))).toEqual(STATUSES)
  })

  it('keeps the icon or ring directly inside the glyph, as before', () => {
    const glyphs = Array.from(graph().querySelectorAll('[data-glyph]'))
    const first = glyphs.map((g) => g.firstElementChild?.tagName.toLowerCase())

    expect(first).toEqual(['span', 'span', 'gbt-icon', 'gbt-icon', 'gbt-icon'])
  })

  it('keeps the exact hidden text of a node: status, then the dependencies, no stray space', () => {
    const fixture = TestBed.createComponent(JobGraph)
    fixture.componentRef.setInput('stages', [
      { name: 'a', jobs: [{ id: '1', name: 'build', status: 'success', needs: [] }] },
      { name: 'b', jobs: [{ id: '2', name: 'test', status: 'failed', needs: ['build'] }] },
    ])
    fixture.detectChanges()
    const texts = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button .sr-only'),
    ).map((e) => e.textContent?.trim())

    expect(texts).toEqual(['— Succeeded', '— Failed. Needs: build'])
  })

  it('still reads the status once, in the node text', () => {
    const node = graph().querySelector('button.gbt-job-graph__node[data-status="failed"]')!
    expect(node.querySelector('.sr-only')?.textContent).toContain('Failed')
  })
})
