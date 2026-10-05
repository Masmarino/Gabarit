# BackupCodes

The backup codes of an account, which the server shows **once**: a numbered grid of the codes,
"Copy codes" and "Download" (a text file), and the acknowledgement checkbox ("I have saved my
backup codes"). It has no primary button: the parent owns the next step and gates it on
`acknowledged`. Used by `gbt-mfa-enrollment` and `gbt-mfa-settings`; usable alone.

**Selector**: `gbt-backup-codes`

## Inputs

| Input          | Type                         | Default    | Role                                                                                   |
| -------------- | ---------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| `codes`        | `string[]`                   | (required) | The codes, as the server issued them, in order.                                        |
| `acknowledged` | `boolean` (model)            | `false`    | The user ticked the acknowledgement. Two-way bindable: `[(acknowledged)]`.             |
| `labels`       | `Partial<BackupCodesLabels>` | `{}`       | Strings to change, over `provideAuthLabels({ backupCodes })` and the English defaults. |

## Outputs

| Output               | Payload   | Role                                                |
| -------------------- | --------- | --------------------------------------------------- |
| `acknowledgedChange` | `boolean` | The acknowledgement changed (the `model`'s output). |

## Behaviour

- **The grid**: an `<ol>` named by `listLabel`, two columns; each code is cut into two lines of two
  groups of eight characters, so a 32-character code fits a half-width cell on a 375 px phone. The
  groups are for reading only: copy and download give the codes as issued.
- **Copy codes**: puts the codes on the clipboard, one per line, and says `copied` in a polite live
  region right after the button (the button keeps its name; it clears after 2 s). When the
  clipboard is refused or missing (plain HTTP), the codes are selected for Ctrl+C and the region
  says `copyFailed`.
- **Download**: a `text/plain` file named `fileName` (`backup-codes.txt`) whose first lines are
  `fileTitle` and `fileNotice`, then the codes, one per line. The anchor is created from the
  injected `DOCUMENT` and never attached to the page.
- The small buttons get a 44 px hit area, and the whole acknowledgement row (44 px high) is the
  checkbox's label.

## Example

```ts
// app.config.ts: the kit's backends and, once, the application's language
providers: [
  { provide: AUTH_PORT, useClass: HttpAuthPort }, // gbt-mfa-enrollment
  { provide: MFA_PORT, useClass: HttpMfaPort }, // gbt-mfa-settings
  provideAuthLabels({
    backupCodes: {
      copy: 'Copier les codes',
      download: 'Télécharger',
      fileName: 'acme-codes-de-secours.txt',
      fileTitle: 'Acme - codes de secours',
    },
  }),
]
```

```html
<gbt-backup-codes [codes]="codes()" [(acknowledged)]="saved" />
<gbt-button text="Continue" [disabled]="!saved()" (clicked)="done()" />
```

## Accessibility

See [AUDIT.md](AUDIT.md). Note that Safari and VoiceOver drop the list semantics of an `ol` whose
numbers are removed with `list-style: none`.
