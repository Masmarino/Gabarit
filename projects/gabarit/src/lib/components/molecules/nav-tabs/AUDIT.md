# RGAA Audit — NavTabs

Verified against RGAA 4.1.2 by exercising `Molecules/NavTabs` in Storybook (stories `Default`, `RouterLess`,
`Vertical`, `Overflowing`, `InPageLayout`, `InNarrowPageLayout`, `Dark`, `VerticalDark`, with the keyboard: Tab,
Shift+Tab, Enter) and by code review (`nav-tabs.ts`, `nav-tab.ts`, their templates and styles).

## Checklist

| Criterion  | Short title                                    | Verification                                                                                                                                                                                                                                                                                                                                                  | Result    |
| ---------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 6.1 / 6.2  | Explicit, relevant links                       | Each item is a real `<a>` whose name is its label (plus its badge, separated by a real space: "Webhooks 3"); the icon is decorative. The application supplies the `href` / `routerLink`.                                                                                                                                                                      | Compliant |
| 12.6       | Landmarks                                      | By default the links sit in a `<nav>` named by `ariaLabel`. `landmark="false"` renders no landmark, for use inside an existing one (a `gbt-page-layout` `[page-nav]`): one navigation, not two nested. Tested (`nav-tabs.spec.ts`, "one navigation landmark").                                                                                                | Compliant |
| 12.8       | Consistent tab order                           | Native links in DOM order; no `tabindex`, no roving tabindex. Tested.                                                                                                                                                                                                                                                                                         | Compliant |
| 7.1        | Scripts compatible with assistive technology   | The current item carries `aria-current="page"` (an attribute, not a class alone); only the active item does. Tested. No ARIA `tab` roles: this is a list of links, not a `tablist`, so no widget keyboard model is promised.                                                                                                                                  | Compliant |
| 7.3        | Keyboard operable                              | Everything is a native link: Tab, Shift+Tab and Enter, middle-click, "open in a new tab". The scroll of an overflowing row follows the focus natively.                                                                                                                                                                                                        | Compliant |
| 10.7       | Focus visible                                  | `:focus-visible` draws a 2 px `--primary` outline inside the link.                                                                                                                                                                                                                                                                                            | Compliant |
| 3.1        | Information not conveyed by colour alone       | The active item is told by `aria-current`, a bold label, and an underline (horizontal) or an accent bar on the leading edge (vertical), not by the tint alone.                                                                                                                                                                                                | Compliant |
| 3.2 / 3.3  | Text and component contrast                    | Link text (`--text-secondary`, `--text-primary` when active or hovered) reaches 7:1 on the page, a panel and each of them under `--bg-hover`; the active pill keeps 7:1 with `--text-primary`; the badge is the `gbt-counter` recipe (7:1). The active icon and the underline (`--primary`) are graphics above 3:1 (`tokens/contrast.spec.ts`, "navigation"). | Compliant |
| 13.8       | Moving content can be controlled               | The colour transitions are removed under `prefers-reduced-motion: reduce`; scrolling to the active tab is an instant `scrollLeft`, never a smooth animation.                                                                                                                                                                                                  | Compliant |
| 10.11      | Reflow at 320 px                               | A horizontal row that does not fit scrolls inside its own box (edge fades tell it), the page does not scroll sideways; a vertical nav in a stacked `gbt-page-layout` folds into that row. Checked at 375 px.                                                                                                                                                  | Compliant |
| WCAG 2.5.8 | Target size minimum                            | A tab is at least 36 px tall (vertical) or 40 px (horizontal), and as wide as its label.                                                                                                                                                                                                                                                                      | Compliant |
| 12.11      | Hidden content ignored by assistive technology | The hidden bold copy that reserves a label's width is a `::after` with an empty alternative text (`content: attr(data-label) / ''`), so it never joins the link's name; icons are `aria-hidden`.                                                                                                                                                              | Compliant |

## Accessibility test

`nav-tabs.spec.ts` runs axe horizontal (icon and badges), vertical, and inside a `gbt-page-layout` `[page-nav]`: 0 violations.

## Browser-only APIs

The overflow fades use `ResizeObserver`, which jsdom does not have. The spec installs a fake, restored in
`afterEach`, and asserts: the list is observed, the fades follow measured layouts and scroll events, the active tab
is scrolled into view without moving the page, the observer is disconnected on destroy, nothing reaches the
`ErrorHandler`, and everything still works when `ResizeObserver` does not exist.

## Externalized strings

`ariaLabel` is the only string of the component and is an input (no default). Labels and badges are projected or bound
by the application.
