import metapic from '@metapic/eslint-config'
import { defineConfig } from 'eslint/config'
import globals from 'globals'

export default defineConfig({
  extends: [
    metapic.configs.customize({
      extraIgnores: ['example/'],
    }),
  ],
  languageOptions: {
    globals: {
      ...globals.node,
    },
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    '@typescript-eslint/no-inferrable-types': 'off',
  },
})
