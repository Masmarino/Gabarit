# RGAA Audit — JobGraph

Verified against RGAA 4.1.2 by exercising `Molecules/JobGraph` in
Storybook (stories `Running`, `WithSelection`, `Failed`, `Dark`) and by
code review (`job-graph.ts`, `job-graph.html`, `job-graph.scss`).

## Checklist

| Criterion | Short title                                   | Verification                                                                                                                                                                                                                                                                                                  | Result    |
| --------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 9.1       | Information structured by headings            | Each stage name is an `<h3>` heading inside its stage's `<li>`.                                                                                                                                                                                                                                                | Compliant |
| 9.3       | Appropriate list structure                    | Real `<ol>` of stages, each holding a `<ul>` of jobs; every `<li>` is a direct child of its list, rendered by this component's own template. Tested ("renders an ol of stages, each with a heading and a ul of jobs") and by 0 axe violations.                                                                  | Compliant |
| 7.1       | Scripts compatible with assistive technology  | Each job is a native `<button type="button">`, so Tab, Enter and Space work natively and focus is visible (`:focus-visible` outline). The selected job carries `aria-current="true"`.                                                                                                                          | Compliant |
| 7.4       | No uncontrolled context change                | Clicking a job only emits `jobSelected`; the consuming application decides what happens next. Nothing navigates or changes context on its own.                                                                                                                                                                | Compliant |
| 1.1 / 1.2 | Decorative images and their alternatives      | The dependency links are an `<svg aria-hidden="true" focusable="false">`, ignored by assistive technology. The same information is duplicated as visually-hidden text on each node ("Needs: a, b"). The status glyphs are `aria-hidden` too, the status being duplicated as visually-hidden text. Tested.       | Compliant |
| 3.2       | Text contrast                                 | Glyphs use `--color-success-text` and `--color-error-text`; the running spinner uses `--primary`. No `*-base` colour token is used for text, border or background (enforced by the repo's `tokens/token-usage.spec.ts`). The link stroke uses `--color-success-base`, which is allowed for a stroke.           | Compliant |
| 3.1       | Information not conveyed by colour alone      | Status is conveyed by glyph shape (check, alert, cross, ring, spinning ring) and by visually-hidden text, never by colour alone.                                                                                                                                                                              | Compliant |
| 13.8      | Moving content can be controlled              | The running spinner animation is disabled under `prefers-reduced-motion: reduce` and replaced by a static filled dot.                                                                                                                                                                                         | Compliant |

## Accessibility test

`job-graph.spec.ts` ("has no accessibility violations") runs axe
against a graph with every status and dependencies: 0 violations.

## Externalized strings

`statusLabels`, `needsLabel` and `ariaLabel` default to English and are
all overridable, so a consumer localizes the hidden text by passing its
own strings.

Dark mode is confirmed in Storybook (`Dark` story) — glyph, border and
selection colours stay legible.
