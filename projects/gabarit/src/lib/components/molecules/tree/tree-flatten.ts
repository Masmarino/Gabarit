export interface TreeNode {
  id: string
  label: string
  icon?: string
  children?: TreeNode[]
}

export interface FlatTreeNode {
  node: TreeNode
  depth: number
  hasChildren: boolean
  parentId: string | null
}

export function flattenTree(
  nodes: TreeNode[],
  expandedIds: ReadonlySet<string>,
  depth = 0,
  parentId: string | null = null,
): FlatTreeNode[] {
  const result: FlatTreeNode[] = []
  for (const node of nodes) {
    const hasChildren = !!node.children && node.children.length > 0
    result.push({ node, depth, hasChildren, parentId })
    if (hasChildren && expandedIds.has(node.id)) {
      result.push(...flattenTree(node.children!, expandedIds, depth + 1, node.id))
    }
  }
  return result
}
