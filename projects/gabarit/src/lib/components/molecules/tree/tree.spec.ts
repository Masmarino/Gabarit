import { TestBed } from '@angular/core/testing'
import { Tree } from './tree'
import { TreeNode } from './tree-flatten'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

const TREE: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      { id: 'src/app.ts', label: 'app.ts' },
      { id: 'src/utils', label: 'utils', children: [{ id: 'src/utils/date.ts', label: 'date.ts' }] },
    ],
  },
  { id: 'readme', label: 'README.md' },
]

function setup(items: TreeNode[] = TREE) {
  const fixture = TestBed.createComponent(Tree)
  fixture.componentRef.setInput('items', items)
  fixture.componentRef.setInput('ariaLabel', 'Fichiers')
  fixture.detectChanges()
  return fixture
}

const items = (f: ReturnType<typeof setup>): HTMLLIElement[] => [
  ...f.nativeElement.querySelectorAll('.gbt-tree__item'),
]

const itemById = (f: ReturnType<typeof setup>, id: string): HTMLLIElement =>
  f.nativeElement.querySelector(`[data-node-id="${CSS.escape(id)}"]`)

function press(el: HTMLElement, key: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

describe('Tree', () => {
  it('renders only root nodes by default', () => {
    const fixture = setup()
    expect(items(fixture).map((el) => el.textContent?.trim())).toEqual(['src', 'README.md'])
  })

  it('has role tree with the given aria-label', () => {
    const fixture = setup()
    const tree = fixture.nativeElement.querySelector('[role="tree"]')
    expect(tree.getAttribute('aria-label')).toBe('Fichiers')
  })

  it('marks a leaf node with no aria-expanded', () => {
    const fixture = setup()
    expect(itemById(fixture, 'readme').getAttribute('aria-expanded')).toBeNull()
  })

  it('marks a parent node as collapsed by default', () => {
    const fixture = setup()
    expect(itemById(fixture, 'src').getAttribute('aria-expanded')).toBe('false')
  })

  it('expands a node on click, revealing its children', () => {
    const fixture = setup()
    itemById(fixture, 'src').click()
    fixture.detectChanges()

    expect(itemById(fixture, 'src').getAttribute('aria-expanded')).toBe('true')
    expect(items(fixture).map((el) => el.getAttribute('data-node-id'))).toEqual([
      'src',
      'src/app.ts',
      'src/utils',
      'readme',
    ])
  })

  it('sets aria-level according to nesting depth', () => {
    const fixture = setup()
    itemById(fixture, 'src').click()
    fixture.detectChanges()
    expect(itemById(fixture, 'src').getAttribute('aria-level')).toBe('1')
    expect(itemById(fixture, 'src/app.ts').getAttribute('aria-level')).toBe('2')
  })

  it('selects a node on click, marking it aria-selected', () => {
    const fixture = setup()

    itemById(fixture, 'readme').click()
    fixture.detectChanges()

    expect(itemById(fixture, 'readme').getAttribute('aria-selected')).toBe('true')
    expect(itemById(fixture, 'src').getAttribute('aria-selected')).toBe('false')
    expect(fixture.componentInstance.selectedId()).toBe('readme')
  })

  it('gives only one node a tabIndex of 0 (roving tabindex)', () => {
    const fixture = setup()
    const tabIndexes = items(fixture).map((el) => el.tabIndex)
    expect(tabIndexes.filter((t) => t === 0).length).toBe(1)
  })

  describe('keyboard navigation', () => {
    // The roving-tabindex attribute (rather than real DOM focus) is the
    // assertion target here, the same convention `DatePicker`'s own grid
    // keyboard tests use — the actual `.focus()` call is scheduled via
    // `afterNextRender`, which doesn't reliably flush inside a single
    // synchronous `detectChanges()` in this test environment.
    it('ArrowDown moves the active node to the next visible node', () => {
      const fixture = setup()
      press(itemById(fixture, 'src'), 'ArrowDown')
      fixture.detectChanges()
      expect(itemById(fixture, 'readme').tabIndex).toBe(0)
      expect(itemById(fixture, 'src').tabIndex).toBe(-1)
    })

    it('ArrowUp moves the active node to the previous visible node', () => {
      const fixture = setup()
      press(itemById(fixture, 'readme'), 'ArrowUp')
      fixture.detectChanges()
      expect(itemById(fixture, 'src').tabIndex).toBe(0)
    })

    it('ArrowRight expands a collapsed node without moving the active node', () => {
      const fixture = setup()
      press(itemById(fixture, 'src'), 'ArrowRight')
      fixture.detectChanges()
      expect(itemById(fixture, 'src').getAttribute('aria-expanded')).toBe('true')
      expect(itemById(fixture, 'src').tabIndex).toBe(0)
    })

    it('ArrowRight on an already-expanded node moves the active node to its first child', () => {
      const fixture = setup()
      press(itemById(fixture, 'src'), 'ArrowRight')
      fixture.detectChanges()
      press(itemById(fixture, 'src'), 'ArrowRight')
      fixture.detectChanges()
      expect(itemById(fixture, 'src/app.ts').tabIndex).toBe(0)
    })

    it('ArrowLeft collapses an expanded node without moving the active node', () => {
      const fixture = setup()
      press(itemById(fixture, 'src'), 'ArrowRight')
      fixture.detectChanges()
      press(itemById(fixture, 'src'), 'ArrowLeft')
      fixture.detectChanges()
      expect(itemById(fixture, 'src').getAttribute('aria-expanded')).toBe('false')
      expect(itemById(fixture, 'src').tabIndex).toBe(0)
    })

    it('ArrowLeft on a collapsed child node moves the active node to its parent', () => {
      const fixture = setup()
      press(itemById(fixture, 'src'), 'ArrowRight')
      fixture.detectChanges()
      press(itemById(fixture, 'src'), 'ArrowRight')
      fixture.detectChanges()
      press(itemById(fixture, 'src/app.ts'), 'ArrowLeft')
      fixture.detectChanges()
      expect(itemById(fixture, 'src').tabIndex).toBe(0)
    })

    it('Home moves the active node to the first visible node', () => {
      const fixture = setup()
      press(itemById(fixture, 'src'), 'ArrowDown')
      fixture.detectChanges()
      press(itemById(fixture, 'readme'), 'Home')
      fixture.detectChanges()
      expect(itemById(fixture, 'src').tabIndex).toBe(0)
    })

    it('End moves the active node to the last visible node', () => {
      const fixture = setup()
      press(itemById(fixture, 'src'), 'End')
      fixture.detectChanges()
      expect(itemById(fixture, 'readme').tabIndex).toBe(0)
    })

    it('Enter selects the active node', () => {
      const fixture = setup()
      // Nothing selected/focused yet, so the active node defaults to the
      // first one ('src').
      press(itemById(fixture, 'src'), 'Enter')
      fixture.detectChanges()
      expect(itemById(fixture, 'src').getAttribute('aria-selected')).toBe('true')
    })
  })

  it('has no a11y violations, collapsed', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })

  it('has no a11y violations, expanded with a selection', async () => {
    const fixture = setup()
    itemById(fixture, 'src').click()
    fixture.detectChanges()
    itemById(fixture, 'src/app.ts').click()
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
