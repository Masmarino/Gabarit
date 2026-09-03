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
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f7f9fb' },
        { name: 'dark', value: '#0d1b24' },
      ],
    },
  },
}

export default preview
