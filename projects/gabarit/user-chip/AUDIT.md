# RGAA Audit — UserChip

Verified against RGAA 4.1.2 by exercising `Molecules/UserChip` in
Storybook (stories `Small`, `Medium`, `WithPicture`, `LongNameTruncated`,
`InMetaLine`, `Contributors`, `Dark`) and by code review (`user-chip.ts`,
`user-chip.html`, `user-chip.scss`).

`gbt-user-chip` is plain text plus a decorative avatar: no interactive
role, no state.

## Checklist

| Criterion | Short title                       | Verification                                                                                                                                                                                                               | Result    |
| --------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1.2       | Decorative images ignored         | The avatar (initials or picture) is `aria-hidden="true"` on its host: the name next to it is the accessible content, so it is read once (`user-chip.spec.ts`, "reads its name once").                                      | Compliant |
| 3.2       | Text contrast                     | The name is `--text-primary`, the same token audited at 7:1 on the page and on a panel, in both themes (`tokens/contrast.spec.ts`). The avatar keeps `gbt-avatar`'s own audited pair (`--text-on-primary` on `--primary`). | Compliant |
| 10.4      | Text size                         | rem-based (13 px / 14 px), scales with the user's font size; the name truncates with an ellipsis rather than being clipped silently, and the full name stays in `title` and in the DOM.                                    | Compliant |
| 10.12     | Text spacing                      | Single line with a `1.5rem` line height, no fixed height on the text.                                                                                                                                                      | Compliant |
| 10.13     | Additional content on hover/focus | `title` only repeats the visible text; the name stays fully in the DOM for assistive technology whatever the truncation.                                                                                                   | Compliant |

## Externalized strings

None: the only text is the `name` supplied by the application.

Dark mode is visually confirmed in Storybook (`Dark` story).
