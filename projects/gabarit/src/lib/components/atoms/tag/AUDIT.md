# Accessibility audit — Tag (RGAA 4.1.2)

| Criterion | Short title | Verification | Result |
|---|---|---|---|
| 3.2 | Text contrast | `getReadableTextColor` (tested in `tag-contrast.spec.ts`) picks whichever of `#ffffff`/`#000000` reaches the higher WCAG contrast ratio against the caller-supplied background. Worst case **4.58:1** (at `#cf0dcc`), measured by sweeping all 16 777 216 sRGB backgrounds — above the 4.5:1 AA threshold, which matters because Tag's text is 12px bold and therefore *not* "large text" (its 4.58:1 worst case is however below the AAA 7:1 target the rest of the library holds itself to, an accepted consequence of the background being the caller's to choose). The dark endpoint is `#000000` and not a softer `#1a1a1a` for exactly this reason: with `#1a1a1a` the worst case is only **4.17:1** (at `#da25c3`), an AA failure — the earlier claim that two fixed endpoints guarantee 4.5:1 "by construction" was false, since the two ratios cross *below* the threshold for mid-luminance backgrounds. Both figures are asserted in `tag-contrast.spec.ts`. Automated `color-contrast` axe checks are disabled project-wide for arbitrary-color content (see `expect-no-a11y-violations.ts`), so this criterion is verified by the dedicated unit tests, not by `tag.spec.ts`'s a11y assertions. | Conforme |
| 3.2 (input validation) | Text contrast | `getReadableTextColor` throws on anything that is not a well-formed 6-digit hex (`'#000'`, `'red'`, `'rgb(…)'`, `'#dc2626ff'`). It previously produced `NaN` ratios for those, and `NaN >= NaN` being `false` silently returned dark text for *any* unparseable input — so `'#000'` was painted dark-on-black. Failing loudly is the only option that can't ship an unreadable chip; the supported format is documented in `README.md`. | Conforme |
| 7.1 | Script/AT compatibility | The remove button is a real `<button type="button">`, not a styled `<div>`; it participates in the normal tab order and responds to Enter/Space natively. | Conforme |
| 11.1 / 11.2 | Field label | The remove button carries an explicit `aria-label` bound to `removeLabel()`, an externalized input rather than a hardcoded string. | Conforme |
| 12.11 | Hidden content | `<gbt-icon name="x" aria-hidden="true" />` inside the remove button is decorative; the button's own `aria-label` is what's announced. | Conforme |
| WCAG 2.5.8 | Target size | The remove button is 16×16px, below the 24×24px minimum target size. It is a secondary action inside an already-small chip (`Badge`'s own icon is unsized/decorative and sets no comparable precedent); this is accepted as a known minor deviation, consistent with how dense chip/tag UIs are commonly built, and mitigated by the chip's own larger hit area and hover feedback. | Écart mineur accepté |

## Externalized content

`removeLabel` is the only user-facing string this component owns, and it is
an input defaulting to `'Remove'` rather than a hardcoded value. The default
is **English**, like every other default string in the library (see the
"Default strings in English" list in `ACCESSIBILITY.md`): a French default
(`'Retirer'`) shipped here at first, which was an inconsistency, not a
deliberate choice — a non-English application overrides it either way, but
the library's own baseline language is English.

`gbt-select` supplies a per-chip value through its own `chipRemoveLabel`
function input (`` (label) => `Remove ${label}` `` by default), so the label
announced is "Remove Bug" rather than a bare "Remove" — and stays
overridable by the consuming application.
