import type { StorybookConfig } from '@storybook/angular-vite'

const config: StorybookConfig = {
  stories: ['../*/**/*.stories.ts'],
  addons: ['@storybook/addon-a11y'],
  // The fonts the tokens name, served where `@use '../fonts'` expects them.
  staticDirs: [{ from: '../fonts', to: '/fonts/ibm-plex' }],
  framework: {
    name: '@storybook/angular-vite',

    options: { compodoc: false },
  },
}

export default config
