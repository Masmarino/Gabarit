import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core'

let nextId = 0

@Component({
  selector: 'gbt-app-shell',
  standalone: true,
  imports: [],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell {
  navLabel = input.required<string>()
  skipLabel = input.required<string>()
  openMenuLabel = input.required<string>()
  closeMenuLabel = input.required<string>()

  private readonly id = ++nextId
  protected readonly mainId = `gbt-app-shell-main-${this.id}`
  protected readonly navId = `gbt-app-shell-nav-${this.id}`

  protected readonly menuOpen = signal(false)

  protected readonly menuLabel = computed(() =>
    this.menuOpen() ? this.closeMenuLabel() : this.openMenuLabel(),
  )

  private readonly toggleButton = viewChild<ElementRef<HTMLButtonElement>>('toggle')
  private readonly nav = viewChild<ElementRef<HTMLElement>>('nav')

  protected toggleMenu(): void {
    if (this.menuOpen()) {
      this.close()
      return
    }
    this.menuOpen.set(true)
    queueMicrotask(() => this.nav()?.nativeElement.focus())
  }

  protected close(): void {
    if (!this.menuOpen()) return
    this.menuOpen.set(false)
    this.toggleButton()?.nativeElement.focus()
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close()
  }

  protected onNavKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !this.menuOpen()) return
    const nav = this.nav()?.nativeElement
    if (!nav) return

    const focusableElements = nav.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    if (focusableElements.length === 0) return

    const first = focusableElements[0]
    const last = focusableElements[focusableElements.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}
