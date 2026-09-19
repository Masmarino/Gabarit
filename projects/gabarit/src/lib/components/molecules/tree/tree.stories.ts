import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Tree } from './tree'
import { TreeNode } from './tree-flatten'

const meta: Meta<Tree> = {
  title: 'Molecules/Tree',
  component: Tree,
}

export default meta
type Story = StoryObj<Tree>

const REPO_TREE: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    icon: 'folder',
    children: [
      { id: 'src/main.ts', label: 'main.ts', icon: 'file' },
      {
        id: 'src/components',
        label: 'components',
        icon: 'folder',
        children: [
          { id: 'src/components/button.ts', label: 'button.ts', icon: 'file' },
          { id: 'src/components/card.ts', label: 'card.ts', icon: 'file' },
        ],
      },
    ],
  },
  { id: 'package.json', label: 'package.json', icon: 'file' },
  { id: 'readme', label: 'README.md', icon: 'file' },
]

export const Nominal: Story = {
  args: {
    items: REPO_TREE,
    ariaLabel: 'Fichiers du dépôt',
  },
}

export const ExpandedByDefault: Story = {
  args: {
    items: REPO_TREE,
    ariaLabel: 'Fichiers du dépôt',
    expandedIds: ['src'],
  },
}

export const WithSelection: Story = {
  args: {
    items: REPO_TREE,
    ariaLabel: 'Fichiers du dépôt',
    expandedIds: ['src'],
    selectedId: 'src/main.ts',
  },
}

export const Dark: Story = {
  args: {
    items: REPO_TREE,
    ariaLabel: 'Fichiers du dépôt',
    expandedIds: ['src'],
    selectedId: 'src/main.ts',
  },
  decorators: [darkTheme],
}
