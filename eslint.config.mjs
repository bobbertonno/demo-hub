import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['.next/**', 'node_modules/**', 'manifests/**', 'playwright-report/**', 'test-results/**', 'next-env.d.ts', 'user_read_only_context/**', 'v0_memories/**'] },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-restricted-syntax': [
        'error',
        { selector: "MemberExpression[object.name='localStorage']", message: 'Catalog data must persist in MongoDB, not localStorage.' },
      ],
    },
  },
)
