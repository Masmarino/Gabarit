# RGAA Audit — Menu

Verified against RGAA 4.1.2 by exercising `Molecules/Menu` in Storybook (stories `UserAccount`,
`AlignEnd`, `IconOnlyKebab`, `CustomTrigger`, `CustomTriggerNarrow`, `DarkCustomTrigger`, `Dark`)
with real keyboard use, and by code review (`menu.ts`, `menu.html`, `menu.scss`). It covers the
whole menu, including the custom trigger and the focus-return behaviour.

## Checklist

| Criterion        | Short title                                  | Verification                                                                                                                                                                                                                                                                                                          | Result               |
| ---------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 7.1              | Scripts compatible with assistive technology | WAI-ARIA menu button: a `<button aria-haspopup="menu" aria-expanded>` and a `role="menu"` named by `label`, its items `role="menuitem"`. 0 axe violations closed, open, icon-only, with a custom trigger and with `gbtMenuItem` items (`menu.spec.ts`).                                                               | Compliant            |
| 7.3              | Keyboard- and pointer-operable               | Enter/Space/click open and focus the first item; ↑/↓ on the closed trigger open on the first/last item; ↑ ↓ cycle with wraparound, Home/End jump; Escape closes (also from the trigger) and returns focus to it; activating an item closes the menu and returns focus to the trigger. All asserted in `menu.spec.ts`. | Compliant            |
| 7.3 / WCAG 2.1.2 | No keyboard trap                             | Tab is never prevented: leaving the menu with Tab fires `focusout` outside it and closes it (tested). Items are `tabindex="-1"` when written with `gbtMenuItem`.                                                                                                                                                      | Compliant            |
| 10.7             | Visible focus indicator                      | Trigger: 2px `--focus-ring` outline on `:focus-visible`; items: the 2px inset ring of `.gbt-menu__item`.                                                                                                                                                                                                                 | Compliant            |
| 11.1 / 11.9      | Name of the trigger                          | Default trigger: its visible `label`. Icon-only: `label` becomes the `aria-label`. Custom trigger: named by its content, or by `triggerAriaLabel` when it has no text (avatar only) — asserted; the list is always named by `label`.                                                                                  | Compliant            |
| 12.11            | Hidden content ignored by assistive tech     | The chevron and the trigger icon are `aria-hidden`; a decorative avatar in the custom slot should be `aria-hidden` when the name is next to it (documented and used in the stories).                                                                                                                                  | Compliant            |
| WCAG 2.4.3       | Focus order                                  | The item that has focus is destroyed when the menu closes: focus is explicitly moved to the trigger after an activation and after Escape; a click outside or a Tab leave focus where the user put it.                                                                                                                 | Compliant            |
| WCAG 2.5.8       | 24×24px target size                          | Trigger and items are well above 24px (measured in Storybook).                                                                                                                                                                                                                                                        | Compliant — verified |

## Notes

- A disabled `gbtMenuItem` is `aria-disabled` and stays focusable; the menu ignores its click and stays
  open (`menu.spec.ts`, "a disabled item keeps the menu open").
- Externalized strings: none — `label`, `triggerAriaLabel` and the items' labels come from the consumer.
