import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core'
import { Icon } from '../../atoms/icon/icon'
import { FlatTreeNode, TreeNode, flattenTree } from './tree-flatten'

@Component({
  selector: 'gbt-tree',
  standalone: true,
  imports: [Icon],
  templateUrl: './tree.html',
  styleUrl: './tree.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tree {
  private readonly elementRef = inject(ElementRef)
  private readonly injector = inject(Injector)

  items = input.required<TreeNode[]>()
  ariaLabel = input<string>('')
  selectedId = model<string | null>(null)
  expandedIds = model<string[]>([])
  expandLabel = input<string>('Expand')
  collapseLabel = input<string>('Collapse')

  protected readonly focusedId = signal<string | null>(null)

  private readonly expandedSet = computed(() => new Set(this.expandedIds()))
  protected readonly flatNodes = computed(() => flattenTree(this.items(), this.expandedSet()))

  protected readonly activeId = computed(() => {
    const focused = this.focusedId()
    const flat = this.flatNodes()
    if (focused && flat.some((f) => f.node.id === focused)) {
      return focused
    }
    const selected = this.selectedId()
    if (selected && flat.some((f) => f.node.id === selected)) {
      return selected
    }
    return flat[0]?.node.id ?? null
  })

  protected isExpanded(id: string): boolean {
    return this.expandedSet().has(id)
  }

  protected toggle(id: string): void {
    const set = new Set(this.expandedIds())
    if (set.has(id)) {
      set.delete(id)
    } else {
      set.add(id)
    }
    this.expandedIds.set([...set])
  }

  protected select(node: TreeNode): void {
    this.selectedId.set(node.id)
    this.focusedId.set(node.id)
  }

  protected onItemClick(flat: FlatTreeNode): void {
    this.select(flat.node)
    if (flat.hasChildren) {
      this.toggle(flat.node.id)
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const flat = this.flatNodes()
    const index = flat.findIndex((f) => f.node.id === this.activeId())
    if (index === -1) {
      return
    }
    const current = flat[index]
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        this.focusIndex(Math.min(index + 1, flat.length - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        this.focusIndex(Math.max(index - 1, 0))
        break
      case 'ArrowRight':
        event.preventDefault()
        if (current.hasChildren && !this.isExpanded(current.node.id)) {
          this.toggle(current.node.id)
        } else if (current.hasChildren) {
          this.focusIndex(index + 1)
        }
        break
      case 'ArrowLeft':
        event.preventDefault()
        if (current.hasChildren && this.isExpanded(current.node.id)) {
          this.toggle(current.node.id)
        } else if (current.parentId) {
          const parentIndex = flat.findIndex((f) => f.node.id === current.parentId)
          if (parentIndex !== -1) {
            this.focusIndex(parentIndex)
          }
        }
        break
      case 'Home':
        event.preventDefault()
        this.focusIndex(0)
        break
      case 'End':
        event.preventDefault()
        this.focusIndex(flat.length - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        this.select(current.node)
        break
      default:
        return
    }
  }

  private focusIndex(index: number): void {
    const target = this.flatNodes()[index]
    if (!target) {
      return
    }
    this.focusedId.set(target.node.id)
    afterNextRender(
      () => {
        const host = this.elementRef.nativeElement as HTMLElement
        host.querySelector<HTMLElement>(`[data-node-id="${cssEscape(target.node.id)}"]`)?.focus()
      },
      { injector: this.injector },
    )
  }
}

function cssEscape(value: string): string {
  return typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(value) : value.replace(/"/g, '\\"')
}
