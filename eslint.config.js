import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
      globals: { ...globals.browser, ...globals.node, ...globals.vitest },
    },
    plugins: { '@typescript-eslint': tsPlugin, 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // TypeScript already resolves identifiers and DOM lib types (e.g. BlobPart),
      // so the core rule only produces false positives here.
      'no-undef': 'off',
      // The input sanitizers intentionally match control characters to strip them.
      'no-control-regex': 'off',
    },
  },
];
