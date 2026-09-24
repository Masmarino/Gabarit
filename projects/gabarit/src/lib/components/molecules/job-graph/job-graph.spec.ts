import { TestBed } from '@angular/core/testing'
import { JobGraph } from './job-graph'
import { linkPath } from './job-graph-layout'
import type { JobGraphStage } from './job-graph.types'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

const STAGES: JobGraphStage[] = [
  {
    name: 'prepare',
    jobs: [{ id: 'j1', name: 'hello', status: 'success', durationLabel: '3s', needs: [] }],
  },
  {
    name: 'check',
    jobs: [
      { id: 'j2', name: 'app-health', status: 'failed', needs: ['hello'] },
      { id: 'j3', name: 'parallel-a', status: 'running', needs: ['hello'] },
    ],
  },
  {
    name: 'report',
    jobs: [{ id: 'j4', name: 'summary', status: 'pending', needs: ['app-health', 'parallel-a'] }],
  },
]

function setup(selectedJobId: string | null = null) {
  const fixture = TestBed.createComponent(JobGraph)
  fixture.componentRef.setInput('stages', STAGES)
  fixture.componentRef.setInput('selectedJobId', selectedJobId)
  fixture.detectChanges()
  return fixture
}

const nodes = (f: ReturnType<typeof setup>): HTMLButtonElement[] => [
  ...f.nativeElement.querySelectorAll('button.gbt-job-graph__node'),
]

describe('JobGraph', () => {
  it('renders an ol of stages, each with a heading and a ul of jobs', () => {
    const fixture = setup()
    const stages = fixture.nativeElement.querySelectorAll('ol.gbt-job-graph__stages > li')
    expect(stages.length).toBe(3)
    expect(stages[1].querySelector('h3')?.textContent?.trim()).toBe('check')
    expect(stages[1].querySelectorAll('ul > li').length).toBe(2)
  })

  it('renders one button per job carrying its status', () => {
    const fixture = setup()
    expect(nodes(fixture).map((n) => n.getAttribute('data-status'))).toEqual([
      'success',
      'failed',
      'running',
      'pending',
    ])
  })

  it('shows a job duration label when given', () => {
    const fixture = setup()
    expect(nodes(fixture)[0].textContent).toContain('3s')
  })

  it('emits the job id when a node is clicked', () => {
    const fixture = setup()
    const emitted: string[] = []
    fixture.componentInstance.jobSelected.subscribe((id) => emitted.push(id))
    nodes(fixture)[1].click()
    expect(emitted).toEqual(['j2'])
  })

  it('marks the selected job with aria-current', () => {
    const fixture = setup('j3')
    expect(nodes(fixture)[2].getAttribute('aria-current')).toBe('true')
    expect(nodes(fixture)[0].getAttribute('aria-current')).toBeNull()
  })

  it('announces the status and dependencies as visually-hidden text', () => {
    const fixture = setup()
    const text = nodes(fixture)[3].querySelector('.sr-only')?.textContent ?? ''
    expect(text).toContain('Pending')
    expect(text).toContain('Needs')
    expect(text).toContain('app-health, parallel-a')
  })

  it('draws one aria-hidden path per dependency', () => {
    const fixture = setup()
    const svg = fixture.nativeElement.querySelector('svg.gbt-job-graph__links')
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.querySelectorAll('path').length).toBe(4)
  })

  it('offsets link coordinates by the root scroll position', () => {
    const fixture = setup()
    const root: HTMLElement = fixture.nativeElement.querySelector('.gbt-job-graph')
    Object.defineProperty(root, 'scrollLeft', { value: 30, configurable: true })
    Object.defineProperty(root, 'scrollTop', { value: 7, configurable: true })
    const rects: Record<string, [number, number]> = { hello: [110, 60], 'app-health': [400, 60] }
    const rect = (left: number, top: number, width: number, height: number) =>
      ({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this === root) return rect(100, 50, 800, 300)
      const [left, top] = rects[this.dataset['jobName'] ?? ''] ?? [0, 0]
      return rect(left, top, 200, 40)
    })
    fixture.componentRef.setInput('stages', [...STAGES])
    fixture.detectChanges()
    const expected = linkPath(
      { left: 10 + 30, top: 10 + 7, width: 200, height: 40 },
      { left: 300 + 30, top: 10 + 7, width: 200, height: 40 },
    )
    const first = fixture.nativeElement.querySelector('svg.gbt-job-graph__links path')
    vi.restoreAllMocks()
    expect(first.getAttribute('d')).toBe(expected)
  })

  it('has no accessibility violations', async () => {
    const fixture = setup('j1')
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
