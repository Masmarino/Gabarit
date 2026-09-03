import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { IconRegistry } from './icon-registry'

@Component({
  selector: 'gbt-icon',
  standalone: true,
  template: `
    @if (svgContent(); as content) {
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        [innerHTML]="content"
      ></svg>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      width: 1.25em;
      height: 1.25em;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `,
  host: {
    '[attr.aria-hidden]': '"true"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  private readonly sanitizer = inject(DomSanitizer)
  private readonly registry = inject(IconRegistry)

  name = input.required<string>()

  protected readonly svgContent = computed(() => {
    const markup = this.registry.get(this.name())
    return markup ? this.sanitizer.bypassSecurityTrustHtml(markup) : null
  })
}
