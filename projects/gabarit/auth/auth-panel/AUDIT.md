# RGAA Audit — AuthPanel

Verified against RGAA 4.1.2 by the unit tests (`auth-panel.spec.ts`, including axe-core runs on the
heading-and-intro, heading-alone, no-heading and no-logo renders), by the Storybook stories
(`Auth/AuthPanel`: `Default`, `WideHeadingAlone`, `WithStatus`, `WithNeutralStatus`,
`WithErrorStatus`, `WithoutLogo`, `Dark`, `Phone`, `Localised`, whose play functions run
`expectPanelLayout`) and by code review (`auth-panel.ts`, `auth-panel.html`, `auth-panel.scss`).

## Checklist

| Criterion | Short title                         | Verification                                                                                                                                                                                                                                              | Result                  |
| --------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1.1 / 1.2 | Images have a text alternative      | The logo is the application's (`[auth-logo]`): its `alt` is the application's to write. The spec projects `alt="Acme"` and checks it lands in `.gbt-auth-panel__logo`; the `Default` story finds it by role `img` and name.                               | Compliant (documented)  |
| 9.1       | Headings                            | `heading` is the page's single `<h1>` (spec); with no heading, no `<h1>` is drawn and the projected state brings its own (`gbt-empty-state` with `headingLevel="1"`, `With*Status` stories find it by role `heading` level 1).                            | Compliant               |
| 12.6      | Landmark regions                    | The panel is the page's `<main>`, exactly one (spec).                                                                                                                                                                                                     | Compliant               |
| 7.1       | Scripts compatible with AT          | The heading is focusable by script (`tabindex="-1"`, spec) so that a page can move the focus to it when its state changes; it is not in the tab order.                                                                                                    | Compliant               |
| 10.7      | Focus visible                       | The heading has no focus ring on purpose: it is not a control and is only focused by script. Every control inside keeps its own ring (code review).                                                                                                       | Compliant               |
| 10.11     | Reflow                              | At a 375 px column (`Phone`) and in every story, `expectPanelLayout` checks: no horizontal overflow, a 16 px gutter, nothing spilling out of the panel, the footer link and the primary button 44 px high.                                                | Compliant               |
| 13.9      | Content viewable in any orientation | No orientation lock; the panel is fluid up to 25rem / 30rem (`wide`).                                                                                                                                                                                     | Compliant               |
| 3.2       | Text contrast                       | Theme tokens only (`--text-primary`, `--text-secondary` on `--bg-principal`); the `Dark` story renders the dark theme. Contrast is not measured by these specs (axe's `color-contrast` rule is off in jsdom).                                             | Visually checked        |
| —         | Target size (WCAG 2.2 2.5.8)        | Under 480 px the projected fields are 44 px high and a password field's eye gets a 44 px hit area (code review; `expectPanelLayout` measures field heights only when the viewport itself is ≤ 480 px, which `Phone` does not set: it narrows the column). | Compliant (code review) |

axe-core (WCAG 2.0/2.1/2.2 A and AA rules, contrast excepted) reports no violation on the four
renders listed above.

## Externalized strings

The panel has no string of its own: `heading` and `intro` are inputs, the logo's `alt` and the
projected content are the application's. The `Localised` story renders them in French.
