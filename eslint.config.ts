import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig({
  files: ['**/*.ts', '**/*.mts', '**/*.cts'],
  ignores: ['build/**', 'node_modules/**', 'debug/**', 'dist/**'],
  extends: [js.configs.recommended, ...tseslint.configs.recommended],
  languageOptions: { globals: globals.node },
  rules: {
    '@typescript-eslint/no-namespace': 'off',
  },
});
