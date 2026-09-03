// @ts-check
const eslint = require('@eslint/js')
const { defineConfig } = require('eslint/config')
const tseslint = require('typescript-eslint')
const angular = require('angular-eslint')
const eslintConfigPrettier = require('eslint-config-prettier')

module.exports = defineConfig([
  {
    ignores: ['dist/**', 'node_modules/**', '.angular/**', 'coverage/**'],
  },
  {
    files: ['projects/gabarit/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      angular.configs.tsRecommended,
      eslintConfigPrettier,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'gbt',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        [
          { type: 'element', prefix: 'gbt', style: 'kebab-case' },

          { type: 'attribute', prefix: 'gbt', style: 'camelCase' },
        ],
      ],
    },
  },
  {
    files: ['projects/gabarit/**/*.html'],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
      eslintConfigPrettier,
    ],
    rules: {},
  },
])
