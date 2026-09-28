# RGAA Audit — BackupCodes

Verified against RGAA 4.1.2 by the unit tests (`backup-codes.spec.ts`, including axe-core runs
before and after the acknowledgement), by the Storybook stories (`Auth/BackupCodes`: `Default`,
`Acknowledged`, `Copied`, `CopyFailed`, `Dark`, `Phone`, `Localised`) and by code review
(`backup-codes.ts`, `backup-codes.html`, `backup-codes.scss`). The copy widget itself is
`gbt-copy-button` and the checkbox `gbt-checkbox` (see their own audits).

## Checklist

| Criterion | Short title                  | Verification                                                                                                                                                                                                                                       | Result                  |
| --------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 9.3       | Lists                        | The codes are an `<ol>` of ten `<li>`, in order, named "Backup codes" (`listLabel`) (spec; `Default` finds the list by role and name and counts ten items). Safari/VoiceOver drop the list role when numbers are removed: documented.              | Compliant (documented)  |
| 11.1      | Form fields have a label     | The acknowledgement checkbox is labelled "I have saved my backup codes" (spec; `Localised` finds it by role and French name).                                                                                                                      | Compliant               |
| 7.1       | Scripts compatible with AT   | One polite live region for the copy, in the DOM before any copy and right after its button; it says "Codes copied" or "Copy failed, codes selected" and clears after a moment; the button keeps its name meanwhile (spec, `Copied`, `CopyFailed`). | Compliant               |
| 7.1       | Copy failure has a way out   | With the clipboard refused or absent, the codes are selected for a manual copy (spec checks the selection) and a download is offered.                                                                                                              | Compliant               |
| 7.3       | Keyboard operable            | Copy and Download are native `<button>`s, the checkbox a native `<input type="checkbox">`; no primary button (spec), so the parent's own action comes next in the tab order.                                                                       | Compliant               |
| 11.9      | Button names                 | "Copy codes" and "Download", in that order (spec).                                                                                                                                                                                                 | Compliant               |
| 3.2       | Text contrast                | Theme tokens (`--text-primary` on `--bg-panel`); `Dark` renders the dark theme. Not measured by the specs (axe's `color-contrast` is off).                                                                                                         | Visually checked        |
| —         | Target size (WCAG 2.2 2.5.8) | The 32 px small buttons get a 44 px hit area through an invisible `::after`; the acknowledgement row is 44 px high and full width (code review; not measured by a story).                                                                          | Compliant (code review) |
| 10.11     | Reflow                       | Each code is cut into two lines of two groups of eight so that two codes fit a row at 375 px: `Phone` checks no horizontal overflow and every code inside the grid.                                                                                | Compliant               |

axe-core (WCAG 2.0/2.1/2.2 A and AA rules, contrast excepted) reports no violation before and after
the acknowledgement.

## Externalized strings

Every string is in `BackupCodesLabels` (English defaults in `DEFAULT_BACKUP_CODES_LABELS`):
`listLabel`, `copy`, `copied`, `copyFailed`, `download`, `acknowledge`, and the downloaded file's
`fileName` (`backup-codes.txt`), `fileTitle` and `fileNotice`. They are changed for the whole
application with `provideAuthLabels({ backupCodes })` and per instance with the `labels` input, which
wins (both verified by the spec, the file's name and lines included). The `Localised` story renders
them in French.
