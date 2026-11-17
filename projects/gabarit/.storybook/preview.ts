import type { Decorator, Preview } from '@storybook/angular-vite'

export const darkTheme: Decorator = (story) => {
  document.documentElement.setAttribute('data-theme', 'dark')
  return story()
}

const resetTheme: Decorator = (story) => {
  document.documentElement.removeAttribute('data-theme')
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
