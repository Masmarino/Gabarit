import { inject, provideAppInitializer } from '@angular/core'
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular-vite'
import { IconRegistry } from '../src/lib/components/atoms/icon/icon-registry'

export const withLayoutIcons = applicationConfig({
  providers: [
    provideAppInitializer(() => {
      inject(IconRegistry).registerAll({
        'circle-dot': '<circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="1" />',
        'circle-check': '<circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />',
        'git-merge':
          '<circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M6 21V9a9 9 0 0 0 9 9" />',
        'git-pull-request':
          '<circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M13 6h3a2 2 0 0 1 2 2v7" /><line x1="6" x2="6" y1="9" y2="21" />',
        'circle-x': '<circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />',
        'message-circle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />',
        plus: '<path d="M5 12h14" /><path d="M12 5v14" />',
        pencil:
          '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" />',
        bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0" /><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />',
        'refresh-cw':
          '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" />',
        'users-round':
          '<path d="M18 21a8 8 0 0 0-16 0" /><circle cx="10" cy="8" r="5" /><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />',
      })
    }),
  ],
})

export const inContentArea = componentWrapperDecorator(
  (story) =>
    `<div style="box-sizing: border-box; min-height: 100vh; padding: 1rem; background: var(--bg-panel);">${story}</div>`,
)

const cardStyle =
  'border: 1px solid var(--gbt-card-border); border-radius: var(--site-border-radius); background: var(--bg-principal); overflow: hidden;'
const cardHeaderStyle =
  'display: flex; align-items: center; gap: 0.5rem; min-height: 38px; color: var(--text-primary); font-size: 0.8125rem; font-weight: 600; margin-bottom: 0.5rem;'
const cardBodyStyle =
  'padding: 1rem; color: var(--text-primary); font-size: 0.875rem; line-height: 1.6;'

/** A plain heading above a bordered box, as gbt-card and gbt-list-card render theirs: placeholder
 * content for the layout stories. */
export function demoCard(title: string, body: string): string {
  return `<div><div style="${cardHeaderStyle}">${title}</div><section style="${cardStyle}"><div style="${cardBodyStyle}">${body}</div></section></div>`
}

export const muted = (text: string) =>
  `<p style="margin: 0; color: var(--text-secondary);">${text}</p>`

const fileRow = (marker: string, name: string, message: string, date: string) =>
  `<li style="display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 1rem; border-top: 1px solid var(--gbt-hairline); font-size: 0.875rem;">
     <span style="width: 1rem; color: var(--text-secondary);" aria-hidden="true">${marker}</span>
     <span style="flex: 0 0 8rem; min-width: 0; color: var(--text-primary); font-weight: 500;">${name}</span>
     <span style="flex: 1 1 auto; min-width: 0; overflow: hidden; color: var(--text-secondary); white-space: nowrap; text-overflow: ellipsis;">${message}</span>
     <span style="flex: none; color: var(--text-secondary); font-size: 0.75rem;">${date}</span>
   </li>`

export const FILES_CARD = `<div>
  <div style="${cardHeaderStyle}">Files</div>
  <section style="${cardStyle}">
    <ul style="margin: 0; padding: 0; list-style: none;">
      ${fileRow('▸', 'crates', 'Split the gix reader by module', '2 h ago')}
      ${fileRow('▸', 'frontend', 'Rework the merge request timeline', 'yesterday')}
      ${fileRow('▸', 'scripts', 'Add the local start-up script', '6 d ago')}
      ${fileRow('·', 'Cargo.toml', 'Bump gix to 0.72', '3 d ago')}
      ${fileRow('·', 'README.md', 'Document the environment variables', '12 d ago')}
    </ul>
  </section>
</div>`

export const README_CARD = demoCard(
  'README.md',
  `<p style="margin: 0 0 0.75rem;"><strong>Harbor</strong> is a self-hosted Git forge written in Rust: repositories, issues, merge requests, pipelines and a wiki in a single binary.</p>
   <p style="margin: 0 0 0.75rem;">To start locally, run <code>scripts/dev.sh</code> and open the interface on port 4201. Database migrations are applied at start-up.</p>
   <p style="margin: 0;">Contributions are welcome: open a merge request against <code>main</code> describing the change and how to test it.</p>`,
)

export const NAV_LIST = `<ul style="margin: 0; padding: 0; list-style: none; font-size: 0.875rem; line-height: 2;">
  <li><a href="#" style="color: var(--text-primary);">crates/</a></li>
  <li><a href="#" style="color: var(--text-primary);">frontend/</a></li>
  <li><a href="#" style="color: var(--text-primary);">scripts/</a></li>
  <li><a href="#" aria-current="page" style="color: var(--primary); font-weight: 600;">README.md</a></li>
  <li><a href="#" style="color: var(--text-primary);">Cargo.toml</a></li>
</ul>`
