# RGAA Audit — CommandPalette

Verified against RGAA 4.1.2 by exercising `Organisms/CommandPalette` in Storybook (stories `Open`, `Filtered`,
`Searching`, `NoResults`, `Trigger`, `Dark`, `Phone`) and by code review.

## Checklist

| Criterion | Short title                                  | Verification                                                                                                                                                                                                             | Result    |
| --------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| 7.1       | Scripts compatible with assistive technology | A `role="dialog"` with `aria-modal`, named by `ariaLabel`. The field is a `combobox` with `aria-controls` on the `listbox` and `aria-activedescendant` on the active `option`; options are grouped with labelled `group`s. | Compliant |
| 7.3       | Scripts usable with the keyboard             | ↑ ↓ (wrapping), Ctrl/⌘+Home/End, Enter, Escape. The focus stays in the field (Tab is kept there), opens on it, and goes back to what had it on closing.                                                                     | Compliant |
| 7.5       | Status messages                              | A polite live region says how many results there are, or that a search is running.                                                                                                                                       | Compliant |
| 12.9      | No keyboard trap                             | Escape and the opening shortcut close the dialog; below 600 px, a named close button does, for touch screens.                                                                                                                                                                         | Compliant |
| 12.10     | Single-key shortcuts                         | A plain-key shortcut (e.g. `/`) never fires while someone types in a field; the default uses a modifier.                                                                                                                  | Compliant |
| 3.2       | Text contrast                                | Text uses `--text-primary` and `--text-secondary` on `--bg-principal` in both themes.                                                                                                                                     | Compliant |
| 3.1       | Information not conveyed by colour alone     | The active option is also `aria-selected`; under forced colours it gets an outline.                                                                                                                                      | Compliant |
| 13.8      | Moving content                               | The opening fade is skipped under `prefers-reduced-motion`.                                                                                                                                                              | Compliant |
| 10.7      | Visible focus                                | The trigger shows the focus ring; inside, the field keeps the focus and the active option is highlighted.                                                                                                                | Compliant |

The trigger is a `button` named by its label (kept when it folds to an icon) with `aria-haspopup="dialog"` and
`aria-keyshortcuts`.

## Accessibility test

`command-palette.spec.ts` runs axe on the open palette: 0 violations.

## Externalized strings

Every text is an input with an English default.
