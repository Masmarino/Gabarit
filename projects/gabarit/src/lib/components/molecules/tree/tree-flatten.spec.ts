import { TreeNode, flattenTree } from './tree-flatten'

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

describe('flattenTree', () => {
  it('includes only root nodes when nothing is expanded', () => {
    const flat = flattenTree(TREE, new Set())
    expect(flat.map((f) => f.node.id)).toEqual(['src', 'readme'])
  })

  it('includes direct children of an expanded node, in order', () => {
    const flat = flattenTree(TREE, new Set(['src']))
    expect(flat.map((f) => f.node.id)).toEqual(['src', 'src/app.ts', 'src/utils', 'readme'])
  })

  it('includes grandchildren only when both ancestors are expanded', () => {
    const flat = flattenTree(TREE, new Set(['src', 'src/utils']))
    expect(flat.map((f) => f.node.id)).toEqual([
      'src',
      'src/app.ts',
      'src/utils',
      'src/utils/date.ts',
      'readme',
    ])
  })

  it('does not include grandchildren when only the grandchild-holding node is "expanded" but its parent is not', () => {
    const flat = flattenTree(TREE, new Set(['src/utils']))
    expect(flat.map((f) => f.node.id)).toEqual(['src', 'readme'])
  })

  it('computes depth relative to nesting level', () => {
    const flat = flattenTree(TREE, new Set(['src', 'src/utils']))
    const byId = Object.fromEntries(flat.map((f) => [f.node.id, f.depth]))
    expect(byId['src']).toBe(0)
    expect(byId['src/app.ts']).toBe(1)
    expect(byId['src/utils/date.ts']).toBe(2)
  })

  it('marks hasChildren correctly', () => {
    const flat = flattenTree(TREE, new Set())
    const byId = Object.fromEntries(flat.map((f) => [f.node.id, f.hasChildren]))
    expect(byId['src']).toBe(true)
    expect(byId['readme']).toBe(false)
  })

  it('tracks each node’s parentId', () => {
    const flat = flattenTree(TREE, new Set(['src', 'src/utils']))
    const byId = Object.fromEntries(flat.map((f) => [f.node.id, f.parentId]))
    expect(byId['src']).toBeNull()
    expect(byId['src/app.ts']).toBe('src')
    expect(byId['src/utils/date.ts']).toBe('src/utils')
  })

  it('treats a node with an empty children array as having no children', () => {
    const flat = flattenTree([{ id: 'a', label: 'a', children: [] }], new Set(['a']))
    expect(flat).toEqual([{ node: { id: 'a', label: 'a', children: [] }, depth: 0, hasChildren: false, parentId: null }])
  })
})
