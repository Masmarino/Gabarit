import { inject, LOCALE_ID, Pipe, type PipeTransform } from '@angular/core'
import { formatBytes, type FormatBytesOptions } from '../primitives/format-bytes'
import {
  formatDateTime,
  formatRelativeTime,
  type DateInput,
  type FormatRelativeTimeOptions,
} from '../primitives/format-time'

export interface GbtPipeLocale {
  locale?: string
}

export type GbtRelativeTimePipeOptions = FormatRelativeTimeOptions &
  GbtPipeLocale & {
    now?: DateInput
  }

export type GbtBytesPipeOptions = FormatBytesOptions & GbtPipeLocale

export type GbtDateTimePipeOptions = Intl.DateTimeFormatOptions & GbtPipeLocale

@Pipe({ name: 'gbtRelativeTime', standalone: true })
export class GbtRelativeTimePipe implements PipeTransform {
  private readonly localeId = inject(LOCALE_ID)

  transform(value: DateInput | null | undefined, options: GbtRelativeTimePipeOptions = {}): string {
    const { locale, now, ...rest } = options
    return formatRelativeTime(value, locale ?? this.localeId, now, rest)
  }
}

@Pipe({ name: 'gbtBytes', standalone: true })
export class GbtBytesPipe implements PipeTransform {
  private readonly localeId = inject(LOCALE_ID)

  transform(value: number | null | undefined, options: GbtBytesPipeOptions = {}): string {
    if (value === null || value === undefined) return ''
    const { locale, ...rest } = options
    return formatBytes(value, locale ?? this.localeId, rest)
  }
}

@Pipe({ name: 'gbtDateTime', standalone: true })
export class GbtDateTimePipe implements PipeTransform {
  private readonly localeId = inject(LOCALE_ID)

  transform(value: DateInput | null | undefined, options?: GbtDateTimePipeOptions): string {
    const { locale, ...rest } = options ?? {}
    return formatDateTime(value, locale ?? this.localeId, rest)
  }
}
