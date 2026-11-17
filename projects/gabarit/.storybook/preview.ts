import type { Decorator, Preview } from '@storybook/angular-vite'

export const darkTheme: Decorator = (story) => {
  document.documentElement.setAttribute('data-theme', 'dark')
  return story()
}

// The aurore ambiance (4.0): a ground of colour, under the dark theme (`style.scss` lays it).
export const auroreAmbiance: Decorator = (story) => {
  document.documentElement.setAttribute('data-theme', 'dark')
  document.documentElement.setAttribute('data-ambiance', 'aurore')
  return story()
}

const resetTheme: Decorator = (story) => {
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-ambiance')
  return story()
}

const preview: Preview = {
  decorators: [resetTheme],
  parameters: {
    controls: { expanded: true },
    options: {
      storySort: {
        order: ['Atoms', 'Molecules', 'Organisms', 'Templates', 'Pages'],
      },
    },
    // The page is the ground (`document-base` on the body, as in an application): no plain background over it.
    backgrounds: { disable: true },
  },
}

export default preview
