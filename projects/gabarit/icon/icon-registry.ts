import { Injectable } from '@angular/core'
import { BUILT_IN_ICONS } from './built-in-icons'

@Injectable({ providedIn: 'root' })
export class IconRegistry {
  private readonly icons = new Map<string, string>(Object.entries(BUILT_IN_ICONS))

  register(name: string, svgInnerMarkup: string): void {
    this.icons.set(name, svgInnerMarkup)
  }

  registerAll(icons: Record<string, string>): void {
    for (const [name, markup] of Object.entries(icons)) {
      this.icons.set(name, markup)
    }
  }

  get(name: string): string | null {
    return this.icons.get(name) ?? null
  }
}
