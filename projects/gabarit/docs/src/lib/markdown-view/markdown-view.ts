import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  afterRenderEffect,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core'
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser'
import { Router } from '@angular/router'
import { marked, type Token } from 'marked'
import DOMPurify, { type Config, type DOMPurify as Purifier } from 'dompurify'
import { docsLabels } from '../docs-labels'

// Anyone who can write a page writes this Markdown, so it gets a stricter DOMPurify than the default: no restyling,
// no fake UI, no colliding ids. Its own instance, so these hooks don't leak into the app's DOMPurify. Browser only.
let purifier: Purifier | null = null

function purify(): Purifier | null {
  if (purifier || typeof window === 'undefined') {
    return purifier
  }
  purifier = DOMPurify(window)

  // Only task-list checkboxes survive, every other <input> goes.
  purifier.addHook('uponSanitizeElement', (node, data) => {
    if (
      data.tagName === 'input' &&
      (node as Element).getAttribute('type')?.toLowerCase() !== 'checkbox'
    ) {
      node.parentNode?.removeChild(node)
    }
  })

  purifier.addHook('afterSanitizeAttributes', (node) => {
    // A task-list checkbox is a mark, not a control.
    if (node.nodeName === 'INPUT') {
      node.setAttribute('disabled', '')
    }
    // Remote images are fine, but they shouldn't send the page's URL to their host or load before they're seen.
    if (node.nodeName === 'IMG') {
      node.setAttribute('referrerpolicy', 'no-referrer')
      node.setAttribute('loading', 'lazy')
    }
  })

  // Otherwise a page could borrow the app's own classes to fake its UI. Code blocks keep language-* for highlighting.
  purifier.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName === 'class') {
      const kept = data.attrValue.split(/\s+/).filter((c) => /^language-[\w+#.-]+$/.test(c))
      if (kept.length) {
        data.attrValue = kept.join(' ')
      } else {
        data.keepAttr = false
      }
    }
  })
  return purifier
}

const SANITIZE_CONFIG: Config = {
  FORBID_TAGS: [
    'style',
    'form',
    'button',
    'textarea',
    'select',
    'option',
    'optgroup',
    'fieldset',
    'dialog',
  ],
  // IDREFs could reach the app's own controls (a <label for> flipping a real switch), tabindex the tab order.
  FORBID_ATTR: [
    'style',
    'popover',
    'popovertarget',
    'popovertargetaction',
    'for',
    'tabindex',
    'aria-owns',
    'aria-controls',
    'aria-labelledby',
    'aria-describedby',
  ],
  // Prefixes id and name with user-content-, so the page's own ids stay safe.
  SANITIZE_NAMED_PROPS: true,
}

/** One heading of the rendered content, for an "On this page" outline. */
export interface MarkdownOutlineEntry {
  /** The level as rendered, after `headingOffset`: 2, 3 or 4. */
  level: number
  text: string
  id: string
}

const ID_PREFIX = 'user-content-'

/** GitHub-like slug, accents kept. `section` when nothing is left, e.g. a title made only of emoji. */
export function headingSlug(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'section'
}

/**
 * Stable ids on h1–h4 and the h2–h4 outline. Runs after sanitising, so an author's id can't clash with one of ours.
 * Headings inside a quote or <details> get an id but stay out of the outline.
 */
function applyHeadingIds(root: HTMLElement): MarkdownOutlineEntry[] {
  const headings = Array.from(root.querySelectorAll<HTMLHeadingElement>('h1, h2, h3, h4'))
  const used = new Set<string>()
  const outline: MarkdownOutlineEntry[] = []
  for (const heading of headings) {
    const text = (heading.textContent ?? '').replace(/\s+/g, ' ').trim()
    const base = ID_PREFIX + headingSlug(text)
    let id = base
    for (let n = 2; used.has(id); n++) {
      id = `${base}-${n}`
    }
    used.add(id)
    heading.id = id
    const level = Number(heading.tagName[1])
    if (level >= 2 && !heading.parentElement?.closest('blockquote, details')) {
      outline.push({ level, text, id })
    }
  }
  for (const node of Array.from(root.querySelectorAll('[id]'))) {
    if (used.has(node.id) && !headings.includes(node as HTMLHeadingElement)) {
      node.removeAttribute('id')
    }
  }
  return outline
}

export function decodeFragment(rawFragment: string): string {
  try {
    return decodeURIComponent(rawFragment)
  } catch {
    return rawFragment
  }
}

/** The element a `#fragment` points at: the plain `id`, else the `user-content-` id or `<a name>` the sanitiser made. */
export function findAnchorTarget(root: HTMLElement, rawFragment: string): HTMLElement | null {
  const fragment = decodeFragment(rawFragment)
  if (!fragment) {
    return null
  }
  for (const wanted of [fragment, ID_PREFIX + fragment]) {
    for (const node of Array.from(root.querySelectorAll<HTMLElement>('[id], a[name]'))) {
      if (node.id === wanted || (node.tagName === 'A' && node.getAttribute('name') === wanted)) {
        return node
      }
    }
  }
  return null
}

/** A keyboard only scrolls a wide code block or table it has focused (WCAG 2.1.1): each gets a tab stop. */
export function makeScrollableBlocksFocusable(
  container: HTMLElement,
  names: { codeBlock: string; table: string },
): void {
  for (const pre of Array.from(container.querySelectorAll('pre'))) {
    pre.setAttribute('tabindex', '0')
    pre.setAttribute('role', 'region')
    pre.setAttribute('aria-label', names.codeBlock)
  }
  for (const table of Array.from(container.querySelectorAll('table'))) {
    table.setAttribute('tabindex', '0')
    table.setAttribute('aria-label', names.table)
  }
}

/** Names each task-list checkbox after its item, so a screen reader says what's done. */
export function nameTaskCheckboxes(container: HTMLElement): void {
  for (const box of Array.from(
    container.querySelectorAll<HTMLInputElement>(
      'li > input[type="checkbox"], li > p:first-child > input[type="checkbox"]',
    ),
  )) {
    const item = box.closest('li')!
    box.setAttribute('aria-label', (item.textContent ?? '').replace(/\s+/g, ' ').trim())
  }
}

/**
 * Markdown rendered to sanitised HTML, with the reading styles of the design system: headings, lists, code, tables,
 * quotes. Every heading gets a stable id, and the h2–h4 outline is emitted after each render.
 */
@Component({
  selector: 'gbt-markdown-view',
  standalone: true,
  // Delegated from the links inside, which handle focus and keys themselves.
  template: `<!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
    <div
      class="gbt-markdown-view"
      #container
      [innerHTML]="renderedHtml()"
      (click)="onClick($event)"
    ></div>`,
  styleUrl: './markdown-view.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownView {
  content = input.required<string>()
  /** Levels added to every heading (up to h6), so a `# Title` under the page's own headings keeps the outline. */
  headingOffset = input(0)
  /** Links under this prefix (say `/docs`) go through the router instead of reloading the app. Off by default. */
  routedLinkPrefix = input<string | null>(null)
  /** The h2–h4 headings, emitted after each render once their ids are in the DOM. */
  outline = output<MarkdownOutlineEntry[]>()

  private readonly sanitizer = inject(DomSanitizer)
  private readonly router = inject(Router, { optional: true })
  private readonly labels = docsLabels()
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('container')

  constructor() {
    afterRenderEffect({
      write: () => {
        this.renderedHtml()
        const container = this.container().nativeElement
        makeScrollableBlocksFocusable(container, this.labels())
        nameTaskCheckboxes(container)
        this.outline.emit(applyHeadingIds(container))
      },
    })
  }

  /**
   * A bare #anchor resolves against <base href="/"> and would load the home page, so a plain click scrolls here
   * instead. Modified and middle clicks are the browser's.
   */
  protected onClick(event: MouseEvent): void {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }
    const container = this.container().nativeElement
    const routed = this.routedHref(event.target)
    if (routed !== null) {
      event.preventDefault()
      void this.router!.navigateByUrl(routed)
      return
    }
    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null
    if (!link || !container.contains(link)) {
      return
    }
    event.preventDefault()
    const target = findAnchorTarget(container, link.getAttribute('href')!.slice(1))
    if (!target) {
      return
    }
    const reduceMotion =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView?.({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    // Headings aren't focusable; -1 lets the next Tab carry on from the section just reached.
    if (target.tabIndex < 0) {
      target.setAttribute('tabindex', '-1')
    }
    target.focus({ preventScroll: true })
  }

  /** The `href` of a clicked in-content link under `routedLinkPrefix`, or `null` when the browser should follow it. */
  private routedHref(target: EventTarget | null): string | null {
    const prefix = this.routedLinkPrefix()
    const link =
      prefix && this.router && target instanceof Element ? target.closest('a[href]') : null
    if (!link || !this.container().nativeElement.contains(link) || link.hasAttribute('target')) {
      return null
    }
    const href = link.getAttribute('href')!
    const rest = href.startsWith(prefix!) ? href.slice(prefix!.length) : null
    return rest !== null && (rest === '' || /^[/#?]/.test(rest)) ? href : null
  }

  // marked.parse is sync without async extensions, hence the cast. A per-call walkTokens stays with that call.
  protected readonly renderedHtml = computed<SafeHtml>(() => {
    const offset = this.headingOffset()
    const walkTokens =
      offset > 0
        ? (token: Token) => {
            if (token.type === 'heading') {
              token.depth = Math.min(6, token.depth + offset)
            }
          }
        : null
    const sanitizer = purify()
    if (!sanitizer) {
      return ''
    }
    const rawHtml = marked.parse(this.content(), { async: false, walkTokens }) as string
    return this.sanitizer.bypassSecurityTrustHtml(sanitizer.sanitize(rawHtml, SANITIZE_CONFIG))
  })
}
