import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // TypeScript-specific rules
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // General rules
      'no-console': 'off', // Allow console for CLI tool
      'prefer-const': 'error',
      'no-var': 'error',
      // Allow the intentional `== null` / `!= null` idiom (null-OR-undefined guard) while
      // keeping strict equality everywhere else. The codebase relies on this idiom in several
      // places (e.g. `finding.exploitedAt != null`); rewriting those to `!==` would change
      // semantics for `undefined`, which is why eslint refuses to auto-fix them.
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'curly': ['warn', 'multi-line'],  // Allow single-line if without braces
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '*.js', '*.mjs'],
  }
);
