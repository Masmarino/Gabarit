import { InjectionToken, type Signal } from '@angular/core'

export type NavTabsOrientation = 'horizontal' | 'vertical'

export interface NavTabsHost {
  readonly orientation: Signal<NavTabsOrientation>
}

export const GBT_NAV_TABS = new InjectionToken<NavTabsHost>('GBT_NAV_TABS')
