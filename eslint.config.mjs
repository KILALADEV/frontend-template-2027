import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import astroParser from 'astro-eslint-parser';
import eslintPluginAstro from 'eslint-plugin-astro';
import a11yGuide from './eslint-rules/a11y-guide.js';
import htmlRequiredAttrs from './eslint-rules/html-required-attrs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  {
    ignores: ['dist/**', '.astro/**', 'node_modules/**', 'test-results/**', 'playwright-report/**'],
  },
  js.configs.recommended,
  ...eslintPluginAstro.configs['flat/recommended'],
  {
    files: ['**/*.astro'],
    plugins: {
      rulesdir: {
        rules: {
          'a11y-guide': a11yGuide,
          'html-required-attrs': htmlRequiredAttrs,
        },
      },
    },
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: '@babel/eslint-parser',
        extraFileExtensions: ['.astro'],
        sourceType: 'module',
        ecmaVersion: 'latest',
        requireConfigFile: true,
        babelOptions: {
          configFile: path.resolve(__dirname, 'eslint-rules/babel-astro.cjs'),
        },
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'astro/jsx-a11y/alt-text': 'off',
      'astro/jsx-a11y/anchor-is-valid': 'off',
      'rulesdir/a11y-guide': 'error',
      'rulesdir/html-required-attrs': 'error',
    },
  },
];
