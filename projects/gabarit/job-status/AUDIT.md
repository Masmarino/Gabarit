# RGAA Audit — JobStatus

Verified against RGAA 4.1.2 by exercising `Atoms/JobStatus` in Storybook (stories `Default`, `AllStatuses`,
`WithLabel`, `InAJobList`, `Dark`) and `Molecules/JobGraph` (`Running`, `Failed`, `Dark`: geometry, colours and
DOM position identical to the job graph's own node rendering), and by code review (`job-status.ts`,
`job-status.html`, `job-status.scss`). The criteria are those of the job graph's glyph, unchanged.

## Checklist

| Criterion | Short title                                    | Verification                                                                                                                                                                                                                                            | Result    |
| --------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1.1 / 1.2 | Decorative images and their alternatives       | The glyph is decorative (`aria-hidden`) without a `label`; with one, the label is visually hidden text and the glyph stays hidden. In the graph the status is duplicated as hidden text in the node. Tested.                                            | Compliant |
| 3.1       | Information not conveyed by colour alone       | Status is told by the shape: check, alert, cross, spinning ring, still ring (plus the text the application gives).                                                                                                                                      | Compliant |
| 3.2 / 3.3 | Text and component contrast                    | Glyphs use `--color-success-text`, `--color-error-text`, `--text-secondary` (7:1 on the page, `tokens/contrast.spec.ts`); the running ring uses `--primary`, the pending ring `--border-color` (3:1). No `*-base` colour token (`token-usage.spec.ts`). | Compliant |
| 13.8      | Moving content can be controlled               | The running ring spins; under `prefers-reduced-motion: reduce` it stops and turns into a filled dot (asserted on the stylesheet in the spec).                                                                                                           | Compliant |
| 12.11     | Hidden content ignored by assistive technology | Icons are `aria-hidden`; the host is `aria-hidden` unless it has a `label`.                                                                                                                                                                             | Compliant |

## Accessibility test

`job-status.spec.ts` runs axe on every status with and without a label: 0 violations; its second `describe`
checks that `gbt-job-graph` renders one hidden `gbt-job-status[data-glyph]` per node, as first child of the node
button, with the icon or ring directly inside.

## Externalized strings

`label` is the only text and is an input (no default).
